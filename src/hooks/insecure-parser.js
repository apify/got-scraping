/* eslint-disable no-underscore-dangle */

const insecureParserHook = (options) => {
    if (options.context.insecureParser !== undefined) {
        options._unixOptions = {
            ...options._unixOptions,
            insecureHTTPParser: options.context.insecureParser,
        };
    }
};

module.exports = { insecureParserHook };
