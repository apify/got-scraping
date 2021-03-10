exports.customOptionsHandler = (options, next) => {
    const { proxyUrl, headersGeneratorOptions, ...gotOptions } = options;

    gotOptions.context = {
        proxyUrl,
        headersGeneratorOptions,
        ...gotOptions.context,
    };

    return next(gotOptions);
};
