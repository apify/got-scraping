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
        ...gotOptions } = options;

    // Got expects custom properties inside the context option.
    gotOptions.context = {
        ...context,
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
    };

    return next(gotOptions);
}

module.exports = {
    customOptionsHandler,
};
