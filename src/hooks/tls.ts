import { Options } from 'got-cjs';
// @ts-expect-error Missing types
import { getBrowser, getUserAgent } from 'header-generator/src/utils';
import { knownCiphers, sigalgs, minVersion, maxVersion } from '../scraping-defaults';

type Browser = 'chrome' | 'firefox' | 'safari' | undefined;

export function tlsHook(options: Options): void {
    const { https } = options;

    if (https.ciphers || https.signatureAlgorithms || https.minVersion || https.maxVersion) {
        return;
    }

    const browser: Browser = getBrowser(getUserAgent(options.headers));

    const useDefault = () => {
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

    useDefault();
}
