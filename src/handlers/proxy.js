const http2 = require('http2-wrapper');
const HttpsProxyAgent = require('https-proxy-agent');
const HttpProxyAgent = require('http-proxy-agent');

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

/**
 *
 * @param {string|undefined} rawProxyUrl
 * @returns {import('got/dist/source').HandlerFunction} - got handler.
 */
exports.createProxyHandler = (rawProxyUrl) => {
    if (rawProxyUrl) {
        return (options, next) => {
            options.agent = getAgent(rawProxyUrl, options.http2);

            return next(options);
        };
    }

    return (options, next) => next(options);
};

/**
 *
 * @param {string} rawProxyUrl
 * @param {bolean} isHttp2
 * @returns {object}
 */
function getAgent(rawProxyUrl, isHttp2) {
    const proxy = {
        proxyOptions: {
            url: new URL(rawProxyUrl),

            rejectUnauthorized: false, // based on the got https.rejectUnauthorized option.
        },
    };

    const proxyUrl = proxy.proxyOptions.url;

    let agent;

    if (proxyUrl.protocol === 'https:') {
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
