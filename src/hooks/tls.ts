import { Options } from 'got-cjs';

const supportsFirefoxFully = Number(process.versions.node.split('.')[0]) >= 17;

// OpenSSL supports secp256r1. It's just reffered to as prime256v1.
const ecdhCurve = {
    firefox: (supportsFirefoxFully ? [
        'X25519',
        'prime256v1',
        'secp384r1',
        'secp521r1',
        'ffdhe2048',
        'ffdhe3072',
    ] : [
        'X25519',
        'prime256v1',
        'secp384r1',
        'secp521r1',
    ]).join(':'),
    chrome: [
        'X25519',
        'prime256v1',
        'secp384r1',
    ].join(':'),
    safari: [
        'X25519',
        'prime256v1',
        'secp384r1',
        'secp521r1',
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
    safari: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'ECDSA+SHA1',
        'rsa_pss_rsae_sha384',
        'rsa_pkcs1_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha512',
        'RSA+SHA1',
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
    safari: [
        // Safari v14
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-CHACHA20-POLY1305',
        // Legacy:
        'ECDHE-ECDSA-AES256-SHA384',
        'ECDHE-ECDSA-AES128-SHA256',
        'ECDHE-ECDSA-AES256-SHA',
        'ECDHE-ECDSA-AES128-SHA',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA',
        'ECDHE-RSA-AES128-SHA',
        'AES256-GCM-SHA384',
        'AES128-GCM-SHA256',
        'AES256-SHA256',
        'AES128-SHA256',
        'AES256-SHA',
        'AES128-SHA',
        'ECDHE-ECDSA-DES-CBC3-SHA',
        'ECDHE-RSA-DES-CBC3-SHA',
        'DES-CBC3-SHA',
    ].join(':'),
} as const;

export const minVersion = {
    firefox: 'TLSv1.2',
    chrome: 'TLSv1',
    safari: 'TLSv1.2',
} as const;

export const maxVersion = {
    firefox: 'TLSv1.3',
    chrome: 'TLSv1.3',
    safari: 'TLSv1.3',
} as const;

type BrowserName = 'chrome' | 'firefox' | 'safari' | undefined;

const getUserAgent = (headers: Record<string, string | string[] | undefined>): string | undefined => {
    for (const [header, value] of Object.entries(headers)) {
        if (header.toLowerCase() === 'user-agent') {
            return value as string;
        }
    }
    return undefined;
};

const getBrowser = (userAgent?: string): BrowserName | undefined => {
    if (!userAgent) {
        return;
    }

    let browser;
    if (userAgent.includes('Firefox')) {
        browser = 'firefox';
    } else if (userAgent.includes('Chrome')) {
        browser = 'chrome';
    } else {
        browser = 'safari';
    }

    return browser as BrowserName;
};

export function tlsHook(options: Options): void {
    const { https } = options;

    if (https.ciphers || https.signatureAlgorithms || https.minVersion || https.maxVersion) {
        return;
    }

    const browser: BrowserName = getBrowser(getUserAgent(options.headers));

    if (browser && browser in knownCiphers) {
        https.ciphers = knownCiphers[browser];
        https.signatureAlgorithms = sigalgs[browser];
        https.ecdhCurve = ecdhCurve[browser];
        https.minVersion = minVersion[browser];
        https.maxVersion = maxVersion[browser];

        return;
    }

    // Let's default to Firefox settings as it has low failure rates
    https.ciphers = knownCiphers.firefox;
    https.signatureAlgorithms = sigalgs.firefox;
    https.ecdhCurve = ecdhCurve.firefox;
    https.minVersion = minVersion.firefox;
    https.maxVersion = maxVersion.firefox;
}
