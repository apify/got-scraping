// @ts-expect-error Maybe we'll use this later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const groups = {
    firefox: [
        'X25519',
        // 'secp256r1',
        'secp384r1',
        'secp521r1',
        // 'ffdhe2048',
        // 'ffdhe3072',
    ].join(':'),
    chrome: [
        'X25519',
        // 'secp256r1',
        'secp384r1',
    ].join(':'),
} as const;

export const sigalgs = {
    firefox: [
        'ecdsa_secp256r1_sha256',
        'ecdsa_secp384r1_sha384',
        'ecdsa_secp521r1_sha512',
        'rsa_pss_rsae_sha256',
        'rsa_pss_rsae_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha256',
        'rsa_pkcs1_sha384',
        'rsa_pkcs1_sha512',
        'ECDSA+SHA1',
        'rsa_pkcs1_sha1',
    ].join(':'),
    chrome: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384',
        'rsa_pkcs1_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha512',
    ].join(':'),
} as const;

export const knownCiphers = {
    chrome: [
        // Chrome v92
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        // Legacy:
        'ECDHE-RSA-AES128-SHA',
        'ECDHE-RSA-AES256-SHA',
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384',
        'AES128-SHA',
        'AES256-SHA',
    ].join(':'),
    firefox: [
        // Firefox v91
        'TLS_AES_128_GCM_SHA256',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        // Legacy:
        'ECDHE-ECDSA-AES256-SHA',
        'ECDHE-ECDSA-AES128-SHA',
        'ECDHE-RSA-AES128-SHA',
        'ECDHE-RSA-AES256-SHA',
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384',
        'AES128-SHA',
        'AES256-SHA',
        'DES-CBC3-SHA',
    ].join(':'),
} as const;

export const minVersion = {
    firefox: 'TLSv1.2',
    chrome: 'TLSv1.0',
} as const;

export const maxVersion = {
    firefox: 'TLSv1.3',
    chrome: 'TLSv1.3',
} as const;

export const SCRAPING_DEFAULT_OPTIONS = {
    // Most of the new browsers use HTTP2
    http2: true,
    https: {
        // In contrast to browsers, we don't usually do login operations.
        // We want the content.
        rejectUnauthorized: false,

        // Node.js ships with different defaults
        ciphers: knownCiphers.firefox,
        signatureAlgorithms: sigalgs.firefox,
        minVersion: minVersion.firefox,
        maxVersion: maxVersion.firefox,
        // Disable custom ECDH curves, Node.js doesn't support some of them.
        // Defaults to 'auto'.
        // ecdhCurve: groups.firefox,
    },
    throwHttpErrors: false,
    timeout: { request: 60000 },
    retry: { limit: 0 },
    headers: {
        'user-agent': undefined,
    },
};
