const http2 = require('http2-wrapper');
const HttpsProxyAgent = require('https-proxy-agent');
const HttpProxyAgent = require('http-proxy-agent');
const httpResolver = require('../http-resolver');

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

/**
 * @param {object} options
 */
exports.proxyHook = async function (options) {
    const { context: { proxyUrl, resolvedRequestProtocol } } = options;

    if (!/http[s2]?/.test(resolvedRequestProtocol)) {
        throw new Error(`Internal error: Invalid resolved request protocol passed to proxy hook: ${resolvedRequestProtocol}`);
    }

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl);

        validateProxyProtocol(parsedProxy.protocol);
        const agents = await getAgents(parsedProxy, options.https.rejectUnauthorized);

        /**
         * This is needed because got expects all three agents in an object like this:
         * {
         *     http: httpAgent,
         *     https: httpsAgent,
         *     http2: http2Agent,
         * }
         * The confusing thing is that internally, it destructures the agents out of
         * the object for HTTP and HTTPS, but keeps the structure for HTTP2,
         * because it passes all the agents down to http2.auto (from http2-wrapper).
         * We're not using http2.auto, but http2.request, which expects a single agent.
         * So for HTTP2, we need a single agent and for HTTP and HTTPS we need the object
         * to allow destructuring of correct agents.
         */
        if (resolvedRequestProtocol === 'http2') {
            options.agent = agents[resolvedRequestProtocol];
        } else {
            options.agent = agents;
        }
    }
};

/**
 * @param {string} protocol
 */
function validateProxyProtocol(protocol) {
    const isSupported = protocol === 'http:' || protocol === 'https:';

    if (!isSupported) {
        throw new Error(`Proxy URL protocol "${protocol}" is not supported. Please use HTTP or HTTPS.`);
    }
}

/**
 * @param {URL} parsedProxyUrl parsed proxyUrl
 * @param {boolean} rejectUnauthorized
 * @returns {object}
 */
async function getAgents(parsedProxyUrl, rejectUnauthorized) {
    const proxy = {
        proxyOptions: {
            url: parsedProxyUrl,

            rejectUnauthorized, // based on the got https.rejectUnauthorized option.
        },
    };

    const proxyUrl = proxy.proxyOptions.url;
    let agent;

    if (proxyUrl.protocol === 'https:') {
        const protocol = await httpResolver.resolveHttpVersion(proxyUrl, rejectUnauthorized);
        const proxyIsHttp2 = protocol === 'h2';

        if (proxyIsHttp2) {
            agent = {
                http: new HttpOverHttp2(proxy),
                https: new HttpsOverHttp2(proxy),
                http2: new Http2OverHttp2(proxy),
            };
        } else {
            agent = {
                http: new HttpsProxyAgent(proxyUrl.href),
                https: new HttpsProxyAgent(proxyUrl.href),
                http2: new Http2OverHttps(proxy),
            };
        }
    } else {
        agent = {
            http: new HttpProxyAgent(proxyUrl.href),
            https: new HttpsProxyAgent(proxyUrl.href),
            http2: new Http2OverHttp(proxy),
        };
    }

    return agent;
}
