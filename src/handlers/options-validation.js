const { default: ow } = require('ow');

/**
 * @param {object} options
 * @param {function} next
 * @returns {import('got').GotReturn}
 */
function optionsValidationHandler(options, next) {
    const validationSchema = {
        proxyUrl: ow.optional.string.url,
        useHeaderGenerator: ow.optional.boolean,
        headerGeneratorOptions: ow.optional.object,
    };

    ow(options, ow.object.partialShape(validationSchema));

    const { proxyUrl, http2 } = options;

    if (proxyUrl && http2) {
        if (isUnsupportedNodeVersion()) {
            throw new Error('Proxy with HTTP2 target is supported only in node v12+. Please upgrade your node version to fix this error.');
        }
    }

    return next(options);
}

/**
 * @returns {boolean}
 */
function isUnsupportedNodeVersion() {
    const nodeVersion = parseFloat(process.versions.node);

    return nodeVersion < 12;
}

module.exports = {
    optionsValidationHandler,
    isUnsupportedNodeVersion,
};
