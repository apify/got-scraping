import { Options } from 'got-cjs';
// @ts-expect-error Missing types
import { getBrowser, getUserAgent } from 'header-generator/src/utils';

// @ts-expect-error Custom ECDH curves are not used yet as Node.js doesn't support some of them.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ecdhCurve = {
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

type Browser = 'chrome' | 'firefox' | 'safari' | undefined;

export function tlsHook(options: Options): void {
    const { https } = options;

    if (https.ciphers || https.signatureAlgorithms || https.minVersion || https.maxVersion) {
        return;
    }

    const browser: Browser = getBrowser(getUserAgent(options.headers));

    // Firefox is one of the browsers with low failure rates
    const useFirefox = () => {
        https.ciphers = knownCiphers.firefox;
        https.signatureAlgorithms = sigalgs.firefox;
        https.minVersion = minVersion.firefox;
        https.maxVersion = maxVersion.firefox;
    };

    if (browser) {
        if (browser in knownCiphers) {
            // This is ugly because TS doesn't type object[nonExistent] as undefined
            https.ciphers = knownCiphers[browser as keyof typeof knownCiphers];
            https.signatureAlgorithms = sigalgs[browser as keyof typeof knownCiphers];
            // @ts-expect-error @types/node doesn't accept TLSv1.0
            https.minVersion = minVersion[browser as keyof typeof knownCiphers];
            https.maxVersion = maxVersion[browser as keyof typeof knownCiphers];

            return;
        }

        if (browser === 'safari') {
            https.ciphers = knownCiphers.chrome;
            https.signatureAlgorithms = sigalgs.chrome;
            // @ts-expect-error @types/node doesn't accept TLSv1.0
            https.minVersion = minVersion.chrome;
            https.maxVersion = maxVersion.chrome;

            return;
        }
    }

    useFirefox();
}
