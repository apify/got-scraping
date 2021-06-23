const http = require('http');
const https = require('https');
const http2 = require('http2-wrapper');
const httpResolver = require('../http-resolver');

/**
 * @param {object} options
 */
exports.alpnHook = async function (options) {
    const parsedUrl = new URL(options.url);
    if (parsedUrl.protocol === 'https:') {
        // HTTP2 always uses https: protocol
        if (options.http2) {
            const protocol = await httpResolver.resolveHttpVersion(parsedUrl, options.https.rejectUnauthorized);
            if (protocol === 'h2') {
                setHttp2(options);
            } else {
                setHttps(options);
            }
        } else {
            setHttps(options);
        }
    } else {
        setHttp(options);
    }
};

function setHttp2(options) {
    options.http2 = true;
    options.request = http2.request;
    options.context.resolvedRequestProtocol = 'http2';
}

function setHttps(options) {
    options.http2 = false;
    options.request = https.request;
    options.context.resolvedRequestProtocol = 'https';
}

function setHttp(options) {
    options.http2 = false;
    options.request = http.request;
    options.context.resolvedRequestProtocol = 'http';
}
