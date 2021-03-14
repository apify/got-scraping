const got = require('got');
const HeaderGenerator = require('@petrpatek/headers-generator');

const browserHeadersHandler = (options, next) => {
    const { http2, headers = {}, context } = options;
    const { headerGeneratorOptions, useHeaderGenerator } = context;

    if (!useHeaderGenerator) {
        return next(options);
    }

    deleteDefaultGotUserAgent(headers);

    const mergedHeaderGeneratorOptions = {
        httpVersion: http2 ? '2' : '1',
        ...headerGeneratorOptions,
    };
    const headerGenerator = new HeaderGenerator(); // We could pass the options here in constructor
    const generatedHeaders = headerGenerator.getHeaders(mergedHeaderGeneratorOptions); // But we are passing them here because of testing.

    let newOptions;

    if (http2) { // generate http2 headers
        newOptions = got.mergeOptions(
            options,
            { headers: generatedHeaders },
            { headers },
        );
    } else {
        const optionsWithHooks = {
            hooks: {
                beforeRequest: [
                    (gotOptions) => {
                        gotOptions.headers = {
                            ...generatedHeaders,
                            headers,
                        };
                    },
                ],
            },
        };

        newOptions = got.mergeOptions(options, optionsWithHooks);
    }

    return next(got.mergeOptions(options, newOptions));
};

/**
 *
 * @param {object} headers
 */
function deleteDefaultGotUserAgent(headers) {
    if (headers['user-agent'] && headers['user-agent'].includes('got (https://github.com/sindresorhus/got)')) {
        delete headers['user-agent'];
    }
}

module.exports = {
    browserHeadersHandler,
};
