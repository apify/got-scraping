import { Options, OptionsInit as GotOptionsInit } from 'got-cjs';
import { OptionsInit } from '../context';

export function customOptionsHook(raw: GotOptionsInit, options: Options): void {
    const typedRaw = raw as OptionsInit;

    if ('proxyUrl' in typedRaw) {
        options.context.proxyUrl = typedRaw.proxyUrl;
        delete typedRaw.proxyUrl;
    }

    if ('headerGeneratorOptions' in typedRaw) {
        options.context.headerGeneratorOptions = typedRaw.headerGeneratorOptions;
        delete typedRaw.headerGeneratorOptions;
    }

    if ('useHeaderGenerator' in typedRaw) {
        options.context.useHeaderGenerator = typedRaw.useHeaderGenerator;
        delete typedRaw.useHeaderGenerator;
    }

    if ('insecureHTTPParser' in raw) {
        options.context.insecureHTTPParser = typedRaw.insecureHTTPParser;
        delete typedRaw.insecureHTTPParser;
    }
}
