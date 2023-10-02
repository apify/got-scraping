import { type OptionsInit as GotOptionsInit, Options } from 'got';
import type { OptionsInit } from '../context.js';

export function customOptionsHook(raw: GotOptionsInit, options: Options): void {
    const typedRaw = raw as OptionsInit;

    const names = [
        'proxyUrl',
        'headerGeneratorOptions',
        'useHeaderGenerator',
        'insecureHTTPParser',
        'sessionToken',
    ] as const;

    for (const name of names) {
        if (name in raw) {
            options.context[name] = typedRaw[name];
            delete typedRaw[name];
        }
    }
}
