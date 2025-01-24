import { Options, type Agents } from 'got';
import http2, { auto } from 'http2-wrapper';
import { URL } from 'node:url';
import { HttpProxyAgent, HttpRegularProxyAgent, HttpsProxyAgent } from '../agent/h1-proxy-agent.js';
import { TransformHeadersAgent } from '../agent/transform-headers-agent.js';
import { buildBasicAuthHeader } from '../auth.js';

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

export async function proxyHook(options: Options): Promise<void> {
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl as string);

        validateProxyProtocol(parsedProxy.protocol);

        options.agent = await getAgents(parsedProxy, options.https.rejectUnauthorized!);
    }
}

export class ProxyError extends Error {}

function validateProxyProtocol(protocol: string) {
    const isSupported = protocol === 'http:' || protocol === 'https:';

    if (!isSupported) {
        throw new ProxyError(`Proxy URL protocol "${protocol}" is not supported. Please use HTTP or HTTPS.`);
    }
}

export async function getAgents(parsedProxyUrl: URL, rejectUnauthorized: boolean) {
    // Sockets must not be reused, the proxy server may rotate upstream proxies as well.

    const headers: Record<string, string> = {};
    const basic = buildBasicAuthHeader(parsedProxyUrl);

    if (basic) {
        headers.authorization = basic;
        headers['proxy-authorization'] = basic;
    }

    // `http2-wrapper` Agent options
    const wrapperOptions = {
        proxyOptions: {
            url: parsedProxyUrl,
            headers,

            // Based on the got https.rejectUnauthorized option
            rejectUnauthorized,
        },

        // The sockets won't be reused, no need to keep them
        maxFreeSockets: 0,
        maxEmptySessions: 0,
    };

    // Native `http.Agent` options
    const nativeOptions = {
        proxy: parsedProxyUrl,

        // The sockets won't be reused, no need to keep them
        maxFreeSockets: 0,
    };

    let agent: Agents;

    if (parsedProxyUrl.protocol === 'https:') {
        let alpnProtocol = 'http/1.1';

        try {
            const result = await auto.resolveProtocol({
                host: parsedProxyUrl.hostname,
                port: parsedProxyUrl.port,
                rejectUnauthorized,
                ALPNProtocols: ['h2', 'http/1.1'],
                servername: parsedProxyUrl.hostname,
            });

            alpnProtocol = result.alpnProtocol;
        } catch {
            // Some proxies don't support CONNECT protocol, use http/1.1
        }

        const proxyIsHttp2 = alpnProtocol === 'h2';

        if (proxyIsHttp2) {
            agent = {
                http: new TransformHeadersAgent(new HttpOverHttp2(wrapperOptions)),
                https: new TransformHeadersAgent(new HttpsOverHttp2(wrapperOptions)),
                http2: new Http2OverHttp2(wrapperOptions),
            };
        } else {
            // Upstream proxies hang up connections on CONNECT + unsecure HTTP
            agent = {
                http: new TransformHeadersAgent(new HttpProxyAgent(nativeOptions)),
                https: new TransformHeadersAgent(new HttpsProxyAgent(nativeOptions)),
                http2: new Http2OverHttps(wrapperOptions),
            };
        }
    } else {
        // Upstream proxies hang up connections on CONNECT + unsecure HTTP
        agent = {
            http: new TransformHeadersAgent(new HttpRegularProxyAgent(nativeOptions)),
            https: new TransformHeadersAgent(new HttpsProxyAgent(nativeOptions)),
            http2: new Http2OverHttp(wrapperOptions),
        };
    }

    return agent;
}
