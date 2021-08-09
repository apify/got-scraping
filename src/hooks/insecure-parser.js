/* eslint-disable no-underscore-dangle */

const insecureParserHook = (options) => {
    if (options.context.insecureHTTPParser !== undefined) {
        options._unixOptions = {
            ...options._unixOptions,
            insecureHTTPParser: options.context.insecureHTTPParser,
        };
    }
};

module.exports = { insecureParserHook };
