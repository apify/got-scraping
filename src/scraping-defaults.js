const crypto = require('crypto');

const SCRAPING_DEFAULT_OPTIONS = {
    // Most of the new browsers use HTTP2
    http2: true,
    https: {
        // We usually don't want to fail because of SSL errors.
        // We want the content.
        rejectUnauthorized: false,
    },
    // This would fail all of 404, 403 responses.
    // We usually don't want to consider these as errors.
    // We want to take some action after this.
    throwHttpErrors: false,
    // Node js uses different TLS ciphers by default.
    ciphers: getCiphersBasedOnNode(),
    // We need to have browser-like headers to blend in.
    useHeaderGenerator: true,
    timeout: 60000,
    retry: { limit: 0, maxRetryAfter: 0 },

};

/**
 * @returns {undefined|string} We keep the default ciphers for old node.
 */
function getCiphersBasedOnNode() {
    const nodeVersion = parseFloat(process.versions.node);

    if (nodeVersion < 12) {
        return;
    }
    return ensureModernTlsFirst();
}

/**
 * @returns {string} ciphers list
 */
function ensureModernTlsFirst() {
    const modernTlsCiphers = 'TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:';
    let defaultCiphers = crypto.constants.defaultCipherList.replace(modernTlsCiphers, '');
    defaultCiphers = defaultCiphers.split(':').filter((cipher) => !!cipher);

    return modernTlsCiphers + defaultCiphers.join(':');
}

module.exports = {
    SCRAPING_DEFAULT_OPTIONS,
};
