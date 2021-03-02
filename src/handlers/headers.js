const got = require('got');

/**
 *
 * @param {HeadersGeneratorOptions} headersGeneratorOptions
 * @returns {import("got/dist/source").HandlerFunction} -  got handler
 */
exports.createBrowserHeadersHandler = (headersGeneratorOptions) => {
    return (options, next) => {
        const { http2 } = options;
        const headers = {
            'user-agent': 'test',
        };
        let newOptions;
        if (http2) { // generate http2 headers
            newOptions = got.mergeOptions(options, { headers });
        } else {
            const optionsWithHooks = {
                hooks: {
                    beforeRequest: [
                        (options) => {
                            options.headers = headers;
                        },
                    ],
                },
            };

            newOptions = got.mergeOptions(options, optionsWithHooks);
        }
        return next(got.mergeOptions(options, newOptions));
    };
};
