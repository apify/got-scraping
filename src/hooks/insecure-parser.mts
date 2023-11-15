/* eslint-disable no-underscore-dangle */

import { Options } from 'got';

export function insecureParserHook(options: Options): void {
    if (options.context.insecureHTTPParser !== undefined) {
        // `insecureHTTPParser` is not an allowed HTTP option in Got,
        // so we must inject it directly into the Got internals for Node.js `http` module to use it.

        // @ts-expect-error Private use
        options._unixOptions = {
            // @ts-expect-error Private use
            ...options._unixOptions,
            insecureHTTPParser: options.context.insecureHTTPParser,
        };
    }
}
