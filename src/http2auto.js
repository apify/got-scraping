/* istanbul ignore file: forked */

'use strict';

const { URL } = require('url');
const http2 = require('http2-wrapper');

function urlToHttpOptions(url) {
    const options = {
        protocol: url.protocol,
        hostname: typeof url.hostname === 'string'
                && String.prototype.startsWith.call(url.hostname, '[')
            ? String.prototype.slice.call(url.hostname, 1, -1)
            : url.hostname,
        hash: url.hash,
        search: url.search,
        pathname: url.pathname,
        path: `${url.pathname || ''}${url.search || ''}`,
        href: url.href,
    };
    if (url.port !== '') {
        options.port = Number(url.port);
    }
    if (url.username || url.password) {
        options.auth = `${url.username}:${url.password}`;
    }
    return options;
}

module.exports = async (input, options, callback) => {
    if (typeof input === 'string') {
        input = urlToHttpOptions(new URL(input));
    } else if (input instanceof URL) {
        input = urlToHttpOptions(input);
    } else {
        input = { ...input };
    }

    if (typeof options === 'function' || options === undefined) {
        // (options, callback)
        callback = options;
        options = input;
    } else {
        // (input, options, callback)
        options = Object.assign(input, options);
    }

    return http2.auto(options, callback);
};
