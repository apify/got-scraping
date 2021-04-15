const got = require('got');

/**
 * @param {object} options
 * @param {function} next
 * @returns {import('got').GotReturn}
 */
function customOptionsHandler(options, next) {
    const {
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
        context,
    } = options;

    // Got expects custom properties inside the context option.
    const newContext = {
        ...context,
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
    };

    delete options.proxyUrl;
    delete options.headerGeneratorOptions;
    delete options.useHeaderGenerator;

    const finalOptions = got.mergeOptions(options, { context: newContext });

    return next(finalOptions);
}

module.exports = {
    customOptionsHandler,
};
