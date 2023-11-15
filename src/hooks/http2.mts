import { URL } from 'node:url';

import { Options } from 'got';
import { auto, type AutoRequestOptions } from 'http2-wrapper';

import type { Context } from '../context.mjs';
import { createResolveProtocol } from '../resolve-protocol.mjs';

export function http2Hook(options: Options): void {
    const { proxyUrl, sessionData } = options.context as Context;

    if (options.http2 && (options.url as URL).protocol !== 'http:') {
        options.request = async (url, requestOptions, callback) => {
            const typedRequestOptions = requestOptions as AutoRequestOptions;
            if (proxyUrl) {
                typedRequestOptions.resolveProtocol = createResolveProtocol(proxyUrl, sessionData as any);
            }

            return auto(url, typedRequestOptions, callback);
        };
    } else {
        // Restore to default.
        // Otherwise it would use the `request` function above after redirects.
        options.request = undefined;
    }
}
