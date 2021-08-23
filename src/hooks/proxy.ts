import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { URL } from 'url';
import { proxies, auto } from 'http2-wrapper';
import QuickLRU from 'quick-lru';
import { Options } from 'got-cjs';
import { HttpsProxyAgent, HttpRegularProxyAgent } from '../agent/h1-proxy-agent';
import { TransformHeadersAgent } from '../agent/transform-headers-agent';

type Agent = HttpAgent | HttpsAgent;

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = proxies;

const x = {
    '(https.js:': (a: Agent) => (a as {protocol?: string}).protocol,
    '(http.js:': (a: Agent) => (a as {protocol?: string}).protocol,
};

// `agent-base` package does stacktrace checks
// in order to set `agent.protocol`.
// The keys in this object are names of functions
// that will appear in the stacktrace.
const isAmbiguousAgent = (agent: Agent): boolean => {
    return x['(https.js:'](agent) !== x['(http.js:'](agent);
};

/**
 * @see https://github.com/TooTallNate/node-agent-base/issues/61
 */
const fixAgentBase = (agent: Agent) => {
    if (isAmbiguousAgent(agent)) {
        Object.defineProperty(agent, 'protocol', {
            value: undefined,
        });
    }

    return agent;
};

const fixAgent = (agent: Agent) => {
    agent = fixAgentBase(agent);
    agent = new TransformHeadersAgent(agent) as unknown as Agent;

    return agent;
};

export async function proxyHook(options: Options): Promise<void> {
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl as string);

        validateProxyProtocol(parsedProxy.protocol);

        options.agent = await getAgents(parsedProxy, options.https.rejectUnauthorized!);
    }
}

function validateProxyProtocol(protocol: string) {
    const isSupported = protocol === 'http:' || protocol === 'https:';

    if (!isSupported) {
        throw new Error(`Proxy URL protocol "${protocol}" is not supported. Please use HTTP or HTTPS.`);
    }
}

export const agentCache = new QuickLRU({ maxSize: 1000 });

async function getAgents(parsedProxyUrl: URL, rejectUnauthorized: boolean) {
    const key = `${rejectUnauthorized}:${parsedProxyUrl.href}`;

    let agent = exports.agentCache.get(key);
    if (agent) {
        return agent;
    }

    const proxy = {
        proxyOptions: {
            url: parsedProxyUrl,

            rejectUnauthorized, // based on the got https.rejectUnauthorized option.
        },
    };

    const proxyUrl = proxy.proxyOptions.url;

    if (proxyUrl.protocol === 'https:') {
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
                http: fixAgent(new HttpOverHttp2(proxy)),
                https: fixAgent(new HttpsOverHttp2(proxy)),
                http2: new Http2OverHttp2(proxy),
            };
        } else {
            // Upstream proxies hang up connections on CONNECT + unsecure HTTP
            agent = {
                http: fixAgent(new HttpRegularProxyAgent({ proxy: proxyUrl })),
                https: fixAgent(new HttpsProxyAgent({ proxy: proxyUrl })),
                http2: new Http2OverHttps(proxy),
            };
        }
    } else {
        // Upstream proxies hang up connections on CONNECT + unsecure HTTP
        agent = {
            http: fixAgent(new HttpRegularProxyAgent({ proxy: proxyUrl })),
            https: fixAgent(new HttpsProxyAgent({ proxy: proxyUrl })),
            http2: new Http2OverHttp(proxy),
        };
    }

    agentCache.set(key, agent);

    return agent;
}
