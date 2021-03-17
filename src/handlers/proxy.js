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
 * @param {function} next
 * @returns {import('got').GotReturn}
 */
async function proxyHandler(options, next) {
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl);

        validateProxyProtocol(parsedProxy.protocol);
        options.agent = await getAgent(parsedProxy, options.https.rejectUnauthorized);
    }

    return next(options);
}

/**
 * @param {string} protocol
 */
function validateProxyProtocol(protocol) {
    const isSupported = protocol === 'http:' || protocol === 'https:';

    if (!isSupported) {
        throw new Error(`Invalid proxy protocol "${protocol}"`);
    }
}

/**
 * @param {object} parsedProxyUrl parsed proxyUrl
 * @param {boolean} rejectUnauthorized
 * @returns {object}
 */
async function getAgent(parsedProxyUrl, rejectUnauthorized) {
    const proxy = {
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

module.exports = {
    proxyHandler,
};
