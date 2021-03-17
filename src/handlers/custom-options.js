const customOptionsHandler = (options, next) => {
    const { proxyUrl, headerGeneratorOptions, useHeaderGenerator, context, ...gotOptions } = options;

    gotOptions.context = {
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
        ...context,
    };

    return next(gotOptions);
};

module.exports = {
    customOptionsHandler,
};
