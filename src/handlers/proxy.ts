import { proxies } from 'http2-wrapper';
import HttpsProxyAgent from 'https-proxy-agent';
import HttpProxyAgent from 'http-proxy-agent';
import httpResolver from '../http-resolver';
import type { NormalizedOptions, HandlerFunction } from 'got/dist/source'

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = proxies;

export const proxyHandler: HandlerFunction = async (options, next) => {
    const { proxyUrl } = options.context!;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl as any);

        validateProxyProtocol(parsedProxy.protocol);
        options.agent = await getAgent(parsedProxy, options?.https?.rejectUnauthorized);
    }

    return next(options as NormalizedOptions);
}

function validateProxyProtocol(protocol: string) {
    const isSupported = protocol === 'http:' || protocol === 'https:';

    if (!isSupported) {
        throw new Error(`Proxy URL protocol "${protocol}" is not supported. Please use HTTP or HTTPS.`);
    }
}

async function getAgent(parsedProxyUrl: URL, rejectUnauthorized: boolean | undefined) {
    const proxy: any = {
        proxyOptions: {
            url: parsedProxyUrl,

            rejectUnauthorized, // based on the got https.rejectUnauthorized option.
        },
    };

    const proxyUrl = proxy.proxyOptions.url;
    let agent;

    if (proxyUrl.protocol === 'https:') {
        const protocol = await httpResolver.resolveHttpVersion(proxyUrl);
        const isHttp2 = protocol === 'h2';

        if (isHttp2) {
            agent = {
                http: new HttpOverHttp2(proxy),
                https: new HttpsOverHttp2(proxy),
                http2: new Http2OverHttp2(proxy),
            };
        } else {
            agent = {
                http: HttpsProxyAgent(proxyUrl.href),
                https: HttpsProxyAgent(proxyUrl.href),
                http2: new Http2OverHttps(proxy),
            };
        }
    } else {
        agent = {
            http: HttpProxyAgent(proxyUrl.href),
            https: HttpsProxyAgent(proxyUrl.href),
            http2: new Http2OverHttp(proxy),
        };
    }

    return agent;
}
