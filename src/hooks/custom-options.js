/**
 * @param {object} options
 */
exports.customOptionsHook = function (raw, options) {
    if ('proxyUrl' in raw) {
        options.context.proxyUrl = raw.proxyUrl;
        delete raw.proxyUrl;
    }

    if ('headerGeneratorOptions' in raw) {
        options.context.headerGeneratorOptions = raw.headerGeneratorOptions;
        delete raw.headerGeneratorOptions;
    }

    if ('useHeaderGenerator' in raw) {
        options.context.useHeaderGenerator = raw.useHeaderGenerator;
        delete raw.useHeaderGenerator;
    }

    if ('insecureParser' in raw) {
        options.context.insecureParser = raw.insecureParser;
        delete raw.insecureParser;
    }
};
