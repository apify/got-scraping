import http from 'http';
import https from 'https';
import { URL } from 'url';
import http2 from 'http2-wrapper';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import QuickLRU from 'quick-lru';
import { Options } from 'got-cjs';
import TransformHeadersAgent from '../agent/transform-headers-agent';

type Agent = http.Agent | https.Agent;

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

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
 * @param {Agent} agent
 */
const fixAgentBase = (agent: Agent) => {
    if (isAmbiguousAgent(agent)) {
        Object.defineProperty(agent, 'protocol', {
            value: undefined,
        });
    }

    return agent;
};

/**
 * @param {Agent} agent
 */
const fixAgent = (agent: Agent) => {
    agent = fixAgentBase(agent);
    agent = new TransformHeadersAgent(agent) as unknown as Agent;

    return agent;
};

/**
 * @param {object} options
 */
export async function proxyHook(options: Options) {
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl as string);

        validateProxyProtocol(parsedProxy.protocol);

        // TODO: The `!` shouldn't be necessary. Open an issue in Got.
        options.agent = await getAgents(parsedProxy, options.https.rejectUnauthorized!);
    }
}

/**
 * @param {string} protocol
 */
function validateProxyProtocol(protocol: string) {
    const isSupported = protocol === 'http:' || protocol === 'https:';

    if (!isSupported) {
        throw new Error(`Proxy URL protocol "${protocol}" is not supported. Please use HTTP or HTTPS.`);
    }
}

export const agentCache = new QuickLRU({ maxSize: 1000 });

/**
 * @param {URL} parsedProxyUrl parsed proxyUrl
 * @param {boolean} rejectUnauthorized
 * @returns {object}
 */
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
        const { alpnProtocol } = await http2.auto.resolveProtocol({
            host: parsedProxyUrl.hostname,
            port: parsedProxyUrl.port,
            rejectUnauthorized,
            // @ts-expect-error Open an issue in http2-wrapper
            ALPNProtocols: ['h2', 'http/1.1'],
            servername: parsedProxyUrl.hostname,
        });

        const proxyIsHttp2 = alpnProtocol === 'h2';

        if (proxyIsHttp2) {
            agent = {
                http: fixAgent(new HttpOverHttp2(proxy)),
                https: fixAgent(new HttpsOverHttp2(proxy)),
                http2: new Http2OverHttp2(proxy),
            };
        } else {
            agent = {
                http: fixAgent(new HttpsProxyAgent({ proxy: proxyUrl })),
                https: fixAgent(new HttpsProxyAgent({ proxy: proxyUrl })),
                http2: new Http2OverHttps(proxy),
            };
        }
    } else {
        agent = {
            http: fixAgent(new HttpProxyAgent({ proxy: proxyUrl })),
            https: fixAgent(new HttpsProxyAgent({ proxy: proxyUrl })),
            http2: new Http2OverHttp(proxy),
        };
    }

    agentCache.set(key, agent);

    return agent;
}
