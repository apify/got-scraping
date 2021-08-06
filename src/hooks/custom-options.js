/**
 * @param {object} options
 */
exports.customOptionsHook = function (options) {
    // Got expects custom properties inside the context option.
    options.context = { ...options.context };

    if ('proxyUrl' in options) {
        options.context.proxyUrl = options.proxyUrl;
        delete options.proxyUrl;
    }

    if ('headerGeneratorOptions' in options) {
        options.context.headerGeneratorOptions = options.headerGeneratorOptions;
        delete options.headerGeneratorOptions;
    }

    if ('useHeaderGenerator' in options) {
        options.context.useHeaderGenerator = options.useHeaderGenerator;
        delete options.useHeaderGenerator;
    }
};
