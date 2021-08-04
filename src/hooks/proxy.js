const http2 = require('http2-wrapper');
const HttpsProxyAgent = require('https-proxy-agent');
const HttpProxyAgent = require('http-proxy-agent');
const TransformHeadersAgent = require('../agent/transform-headers-agent');

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
    const { context: { proxyUrl } } = options;

    if (proxyUrl) {
        const parsedProxy = new URL(proxyUrl);

        validateProxyProtocol(parsedProxy.protocol);
        options.agent = await getAgents(parsedProxy, options.https.rejectUnauthorized);
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
        const { alpnProtocol } = await http2.auto.resolveProtocol({ host: parsedProxyUrl.hostname, port: parsedProxyUrl.port, rejectUnauthorized });
        const proxyIsHttp2 = alpnProtocol === 'h2';

        if (proxyIsHttp2) {
            agent = {
                http: new TransformHeadersAgent(new HttpOverHttp2(proxy)),
                https: new TransformHeadersAgent(new HttpsOverHttp2(proxy)),
                http2: new Http2OverHttp2(proxy),
            };
        } else {
            agent = {
                http: new TransformHeadersAgent(new HttpsProxyAgent(proxyUrl.href)),
                https: new TransformHeadersAgent(new HttpsProxyAgent(proxyUrl.href)),
                http2: new Http2OverHttps(proxy),
            };
        }
    } else {
        agent = {
            http: new TransformHeadersAgent(new HttpProxyAgent(proxyUrl.href)),
            https: new TransformHeadersAgent(new HttpsProxyAgent(proxyUrl.href)),
            http2: new Http2OverHttp(proxy),
        };
    }

    return agent;
}
