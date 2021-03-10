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

exports.proxyHandler = async (options, next) => {
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        options.agent = await getAgent(proxyUrl);
    }

    return next(options);
};

/**
 *
 * @param {string} rawProxyUrl
 * @returns {object}
 */
async function getAgent(rawProxyUrl) {
    const proxy = {
        proxyOptions: {
            url: new URL(rawProxyUrl),

            rejectUnauthorized: false, // based on the got https.rejectUnauthorized option.
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
