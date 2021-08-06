import http2 from 'http2-wrapper';
import {
    HttpsProxyAgent,
    HttpProxyAgent,
} from 'hpagent';
import QuickLRU from 'quick-lru';
import TransformHeadersAgent from '../agent/transform-headers-agent';

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

// `agent-base` package does stacktrace checks
// in order to set `agent.protocol`.
// The keys in this object are names of functions
// that will appear in the stacktrace.
const isAmbiguousAgent = (agent) => {
    if (!isAmbiguousAgent.x) {
        isAmbiguousAgent.x = {
            '(https.js:': (a) => a.protocol,
            '(http.js:': (a) => a.protocol,
        };
    }

    const { x } = isAmbiguousAgent;

    return x['(https.js:'](agent) !== x['(http.js:'](agent);
};

/**
 * @see https://github.com/TooTallNate/node-agent-base/issues/61
 * @param {Agent} agent
 */
const fixAgentBase = (agent) => {
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
const fixAgent = (agent) => {
    agent = fixAgentBase(agent);
    agent = new TransformHeadersAgent(agent);

    return agent;
};

/**
 * @param {object} options
 */
export async function proxyHook(options) {
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl);

        validateProxyProtocol(parsedProxy.protocol);
        options.agent = await getAgents(parsedProxy, options.https.rejectUnauthorized);
    }
}

/**
 * @param {string} protocol
 */
function validateProxyProtocol(protocol) {
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
async function getAgents(parsedProxyUrl, rejectUnauthorized) {
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
