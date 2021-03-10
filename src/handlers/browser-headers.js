const got = require('got');

exports.browserHeadersHandler = (options, next) => {
    const { http2, context } = options;
    const { browserHeadersGeneratorOptions } = context;
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
                    (gotOptions) => {
                        gotOptions.headers = headers;
                    },
                ],
            },
        };

        newOptions = got.mergeOptions(options, optionsWithHooks);
    }
    return next(got.mergeOptions(options, newOptions));
};
