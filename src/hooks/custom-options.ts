import { Options, OptionsInit } from 'got-cjs';

/**
 * @param {object} options
 */
export function customOptionsHook(raw: OptionsInit, options: Options): void {
    if ('proxyUrl' in raw) {
        // @ts-expect-error FIXME
        options.context['proxyUrl'] = raw.proxyUrl; // eslint-disable-line dot-notation

        // @ts-expect-error FIXME
        delete raw.proxyUrl;
    }

    if ('headerGeneratorOptions' in raw) {
        // @ts-expect-error FIXME
        options.context['headerGeneratorOptions'] = raw.headerGeneratorOptions; // eslint-disable-line dot-notation

        // @ts-expect-error FIXME
        delete raw.headerGeneratorOptions;
    }

    if ('useHeaderGenerator' in raw) {
        // @ts-expect-error FIXME
        options.context['useHeaderGenerator'] = raw.useHeaderGenerator; // eslint-disable-line dot-notation

        // @ts-expect-error FIXME
        delete raw.useHeaderGenerator;
    }

    if ('insecureHTTPParser' in raw) {
        options.context.insecureHTTPParser = raw.insecureHTTPParser;
        delete raw.insecureHTTPParser;
    }
}
