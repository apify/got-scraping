/* eslint-disable no-underscore-dangle */

const insecureParserHook = (options) => {
    if (options.context.insecureHTTPParser !== undefined) {
        // `insecureHTTPParser` is not an allowed HTTP option in Got,
        // so we must inject it directly into the Got internals for Node.js `http` module to use it.
        options._unixOptions = {
            ...options._unixOptions,
            insecureHTTPParser: options.context.insecureHTTPParser,
        };
    }
};

module.exports = { insecureParserHook };
