const got = require('got');

/**
 * @param {object} options
 * @param {function} next
 * @returns {import('got').GotReturn}
 */
function browserHeadersHandler(options, next) {
    const { http2, headers = {}, context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
    } = context;

    if (!useHeaderGenerator) {
        return next(options);
    }

    deleteDefaultGotUserAgent(headers);

    const mergedHeaderGeneratorOptions = {
        httpVersion: http2 ? '2' : '1',
        ...headerGeneratorOptions,
    };
    const generatedHeaders = headerGenerator.getHeaders(mergedHeaderGeneratorOptions);

    let newOptions;

    if (http2) { // generate http2 headers
        newOptions = {
            headers: {
                ...generatedHeaders,
                ...headers,
            },
        };
    } else {
        newOptions = createOptionsWithBeforeRequestHook(generatedHeaders, headers);
    }

    return next(got.mergeOptions(options, newOptions));
}

/**
 * @param {object} headers
 */
function deleteDefaultGotUserAgent(headers) {
    const gotDefaultUserAgent = got.defaults.options.headers['user-agent'];
    if (headers['user-agent'] && headers['user-agent'] === gotDefaultUserAgent) {
        delete headers['user-agent'];
    }
}

/**
 * Creates options with beforeRequestHooks in order to have case-sensitive headers.
 * @param {object} generatedHeaders
 * @param {object} headerOverrides
 * @returns
 */
function createOptionsWithBeforeRequestHook(generatedHeaders, headerOverrides) {
    return {
        hooks: {
            beforeRequest: [
                (gotOptions) => {
                    gotOptions.headers = {
                        ...generatedHeaders,
                        ...headerOverrides,
                    };
                },
            ],
        },
    };
}

module.exports = {
    browserHeadersHandler,
};
