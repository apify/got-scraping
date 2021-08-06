"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRAPING_DEFAULT_OPTIONS = void 0;
const crypto_1 = require("crypto");
const SCRAPING_DEFAULT_OPTIONS = {
    // Most of the new browsers use HTTP2
    http2: true,
    https: {
        // In contrast to browsers, we don't usually do login operations.
        // We want the content.
        rejectUnauthorized: false,
        // Node js uses different TLS ciphers by default.
        ciphers: ensureModernTlsFirst(),
    },
    // This would fail all of 404, 403 responses.
    // We usually don't want to consider these as errors.
    // We want to take some action after this.
    throwHttpErrors: false,
    timeout: { request: 60000 },
    retry: { limit: 0 },
    headers: {
        'user-agent': undefined,
    },
};
exports.SCRAPING_DEFAULT_OPTIONS = SCRAPING_DEFAULT_OPTIONS;
/**
 * Reorders the default NodeJs ciphers so the request tries to negotiate the modern TLS version first, same as browsers do.
 * @returns {string} ciphers list
 */
function ensureModernTlsFirst() {
    const modernTlsCiphers = ['TLS_AES_256_GCM_SHA384', 'TLS_AES_128_GCM_SHA256', 'TLS_CHACHA20_POLY1305_SHA256'];
    const defaultCiphers = new Set(crypto_1.constants.defaultCipherList.split(':'));
    // First we will remove the modern ciphers from the set.
    modernTlsCiphers.forEach((cipher) => defaultCiphers.delete(cipher));
    // Then we will add the modern ciphers at the beginning
    return modernTlsCiphers.concat(Array.from(defaultCiphers)).join(':');
}
