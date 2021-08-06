"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionsValidationHandler = void 0;
const ow_1 = require("ow");
/**
 * @param {object} options
 */
function optionsValidationHandler(options) {
    const validationSchema = {
        proxyUrl: ow_1.default.optional.string.url,
        useHeaderGenerator: ow_1.default.optional.boolean,
        headerGeneratorOptions: ow_1.default.optional.object,
    };
    ow_1.default(options, ow_1.default.object.partialShape(validationSchema));
}
exports.optionsValidationHandler = optionsValidationHandler;
