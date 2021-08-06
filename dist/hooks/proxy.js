"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCache = exports.proxyHook = void 0;
const url_1 = require("url");
const http2_wrapper_1 = require("http2-wrapper");
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
const QuickLRU = require("quick-lru");
const transform_headers_agent_1 = require("../agent/transform-headers-agent");
const { HttpOverHttp2, HttpsOverHttp2, Http2OverHttp2, Http2OverHttps, Http2OverHttp, } = http2_wrapper_1.proxies;
const x = {
    '(https.js:': (a) => a.protocol,
    '(http.js:': (a) => a.protocol,
};
// `agent-base` package does stacktrace checks
// in order to set `agent.protocol`.
// The keys in this object are names of functions
// that will appear in the stacktrace.
const isAmbiguousAgent = (agent) => {
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
    agent = new transform_headers_agent_1.TransformHeadersAgent(agent);
    return agent;
};
/**
 * @param {object} options
 */
async function proxyHook(options) {
    const { context: { proxyUrl } } = options;
    if (proxyUrl) {
        const parsedProxy = new url_1.URL(proxyUrl);
        validateProxyProtocol(parsedProxy.protocol);
        options.agent = await getAgents(parsedProxy, options.https.rejectUnauthorized);
    }
}
exports.proxyHook = proxyHook;
/**
 * @param {string} protocol
 */
function validateProxyProtocol(protocol) {
    const isSupported = protocol === 'http:' || protocol === 'https:';
    if (!isSupported) {
        throw new Error(`Proxy URL protocol "${protocol}" is not supported. Please use HTTP or HTTPS.`);
    }
}
exports.agentCache = new QuickLRU({ maxSize: 1000 });
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
        const { alpnProtocol } = await http2_wrapper_1.auto.resolveProtocol({
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
        }
        else {
            agent = {
                http: fixAgent(new https_proxy_agent_1.HttpsProxyAgent(proxyUrl.href)),
                https: fixAgent(new https_proxy_agent_1.HttpsProxyAgent(proxyUrl.href)),
                http2: new Http2OverHttps(proxy),
            };
        }
    }
    else {
        agent = {
            http: fixAgent(new http_proxy_agent_1.HttpProxyAgent(proxyUrl.href)),
            https: fixAgent(new https_proxy_agent_1.HttpsProxyAgent(proxyUrl.href)),
            http2: new Http2OverHttp(proxy),
        };
    }
    exports.agentCache.set(key, agent);
    return agent;
}
