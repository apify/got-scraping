const customOptionsHandler = (options, next) => {
    const { proxyUrl, headerGeneratorOptions, useHeaderGenerator, ...gotOptions } = options;

    gotOptions.context = {
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
        ...gotOptions.context,
    };

    return next(gotOptions);
};

module.exports = {
    customOptionsHandler,
};
