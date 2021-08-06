"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customOptionsHook = void 0;
/**
 * @param {object} options
 */
function customOptionsHook(raw, options) {
    const typedRaw = raw;
    if ('proxyUrl' in typedRaw) {
        options.context['proxyUrl'] = typedRaw.proxyUrl; // eslint-disable-line dot-notation
        delete typedRaw.proxyUrl;
    }
    if ('headerGeneratorOptions' in typedRaw) {
        options.context['headerGeneratorOptions'] = typedRaw.headerGeneratorOptions; // eslint-disable-line dot-notation
        delete typedRaw.headerGeneratorOptions;
    }
    if ('useHeaderGenerator' in typedRaw) {
        options.context['useHeaderGenerator'] = typedRaw.useHeaderGenerator; // eslint-disable-line dot-notation
        delete typedRaw.useHeaderGenerator;
    }
}
exports.customOptionsHook = customOptionsHook;
