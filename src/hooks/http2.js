const http2 = require('http2-wrapper');

exports.http2Hook = (options) => {
    if (options.http2 && options.url.protocol !== 'http:') {
        options.request = http2.auto;
    }
};
