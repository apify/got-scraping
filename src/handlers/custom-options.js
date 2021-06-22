/**
 * @param {object} options
 */
exports.customOptionsHook = function (options) {
    const {
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
        context,
    } = options;

    // Got expects custom properties inside the context option.
    options.context = {
        ...context,
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
    };

    delete options.proxyUrl;
    delete options.headerGeneratorOptions;
    delete options.useHeaderGenerator;
};
