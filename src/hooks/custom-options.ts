import { Options, OptionsInit } from 'got-cjs';

/**
 * @param {object} options
 */
export function customOptionsHook(raw: OptionsInit, options: Options) {
    if ('proxyUrl' in raw) {
        // @ts-expect-error FIXME
        options.context['proxyUrl'] = raw.proxyUrl;

        // @ts-expect-error FIXME
        delete raw.proxyUrl;
    }

    if ('headerGeneratorOptions' in raw) {
        // @ts-expect-error FIXME
        options.context['headerGeneratorOptions'] = raw.headerGeneratorOptions;

        // @ts-expect-error FIXME
        delete raw.headerGeneratorOptions;
    }

    if ('useHeaderGenerator' in raw) {
        // @ts-expect-error FIXME
        options.context['useHeaderGenerator'] = raw.useHeaderGenerator;

        // @ts-expect-error FIXME
        delete raw.useHeaderGenerator;
    }

    if ('insecureHTTPParser' in raw) {
        options.context.insecureHTTPParser = raw.insecureHTTPParser;
        delete raw.insecureHTTPParser;
    }
}
