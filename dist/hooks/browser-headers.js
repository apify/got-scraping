"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserHeadersHook = exports.mergeHeaders = void 0;
const http2 = require("http2-wrapper");
/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 * @param {object} original
 * @param {object} overrides
 * @returns
 */
function mergeHeaders(original, overrides) {
    const fixedHeaders = new Map();
    for (const entry of Object.entries(original)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }
    for (const entry of Object.entries(overrides)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }
    const headers = {};
    for (const [key, value] of fixedHeaders.values()) {
        headers[key] = value;
    }
    return headers;
}
exports.mergeHeaders = mergeHeaders;
/**
 * @param {object} options
 */
async function browserHeadersHook(options) {
    const { context } = options;
    const { headerGeneratorOptions, useHeaderGenerator, headerGenerator, } = context;
    if (!useHeaderGenerator)
        return;
    const url = options.url;
    let alpnProtocol;
    if (url.protocol === 'https:') {
        alpnProtocol = (await http2.auto.resolveProtocol({
            host: url.hostname,
            port: url.port || 443,
            rejectUnauthorized: false,
            // @ts-expect-error Open an issue in http2-wrapper
            ALPNProtocols: ['h2', 'http/1.1'],
            servername: url.hostname,
        })).alpnProtocol;
    }
    const mergedHeaderGeneratorOptions = {
        httpVersion: alpnProtocol === 'h2' ? '2' : '1',
        ...headerGeneratorOptions,
    };
    const generatedHeaders = headerGenerator.getHeaders(mergedHeaderGeneratorOptions);
    // TODO: Remove this when Got supports Headers class.
    options.headers = mergeHeaders(generatedHeaders, options.headers);
}
exports.browserHeadersHook = browserHeadersHook;
