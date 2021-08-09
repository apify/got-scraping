import { Options, OptionsInit as GotOptionsInit } from 'got-cjs';
import { OptionsInit } from '../context';

/**
 * @param {object} options
 */
export function customOptionsHook(raw: GotOptionsInit, options: Options): void {
    const typedRaw = raw as OptionsInit;

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

    if ('insecureHTTPParser' in raw) {
        options.context.insecureHTTPParser = raw.insecureHTTPParser;
        delete raw.insecureHTTPParser;
    }
}
