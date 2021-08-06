const { default: ow } = require('ow');

/**
 * @param {object} options
 */
function optionsValidationHandler(options) {
    const validationSchema = {
        proxyUrl: ow.optional.string.url,
        useHeaderGenerator: ow.optional.boolean,
        headerGeneratorOptions: ow.optional.object,
        insecureParser: ow.optional.boolean,
    };

    ow(options, ow.object.partialShape(validationSchema));
}

module.exports = {
    optionsValidationHandler,
};
