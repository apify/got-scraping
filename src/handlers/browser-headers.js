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
            headers: mergeHeaders(generatedHeaders, headers),
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
                    gotOptions.headers = mergeHeaders(generatedHeaders, headerOverrides);
                },
            ],
        },
    };
}

/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 * @param {object} original
 * @param {object} overrides
 * @returns
 */
function mergeHeaders(original, overrides) {
    const mergedHeaders = new Map();

    Object.entries(original).forEach(([nameSensitive, value]) => mergedHeaders.set(nameSensitive.toLowerCase(), { nameSensitive, value }));

    Object.entries(overrides).forEach(([nameSensitive, value]) => {
        const headerRecord = mergedHeaders.get(nameSensitive.toLowerCase());

        if (headerRecord) {
            const { nameSensitive: oldNameSensitive } = headerRecord;

            mergedHeaders.set(nameSensitive.toLowerCase(), { nameSensitive: oldNameSensitive, value });
        } else {
            mergedHeaders.set(nameSensitive.toLowerCase(), { nameSensitive, value });
        }
    });

    const finalHeaders = {};

    mergedHeaders.forEach(({ nameSensitive, value }) => { finalHeaders[nameSensitive] = value; });

    return finalHeaders;
}

module.exports = {
    browserHeadersHandler,
    mergeHeaders,
};
