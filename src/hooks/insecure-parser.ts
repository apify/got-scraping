/* eslint-disable no-underscore-dangle */

import { Options } from 'got-cjs';

export function insecureParserHook(options: Options): void {
    // eslint-disable-next-line dot-notation
    if (options.context['insecureHTTPParser'] !== undefined) {
        // `insecureHTTPParser` is not an allowed HTTP option in Got,
        // so we must inject it directly into the Got internals for Node.js `http` module to use it.

        // @ts-expect-error Private use
        options._unixOptions = {
            // @ts-expect-error Private use
            ...options._unixOptions,
            // eslint-disable-next-line dot-notation
            insecureHTTPParser: options.context['insecureHTTPParser'],
        };
    }
}
