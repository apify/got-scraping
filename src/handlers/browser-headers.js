const got = require('got');

exports.browserHeadersHandler = async (options, next) => {
    const { http2, headers, context } = options;
    const { browserHeadersGeneratorOptions } = context;
    const generatedHeaders = {
        'user-agent': 'test',
    };
    let newOptions;
    if (http2) { // generate http2 headers
        newOptions = got.mergeOptions(options, { headers: generatedHeaders }, { headers });
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
