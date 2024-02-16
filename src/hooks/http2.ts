import { URL } from 'node:url';
import { Options } from 'got';
import { auto, type AutoRequestOptions } from 'http2-wrapper';
import type { Context } from '../context.js';
import { createResolveProtocol } from '../resolve-protocol.js';

export function http2Hook(options: Options): void {
    const { proxyUrl, sessionData } = options.context as Context;

    if (options.http2 && (options.url as URL).protocol !== 'http:') {
        options.request = (url, requestOptions, callback) => {
            const typedRequestOptions = requestOptions as AutoRequestOptions;
            if (proxyUrl) {
                typedRequestOptions.resolveProtocol = createResolveProtocol(
                    proxyUrl,
                    sessionData as any,
                    Math.min(options?.timeout?.connect ?? 60_000, options?.timeout?.request ?? 60_000),
                );
            }

            return auto(url, typedRequestOptions, callback);
        };
    } else {
        // Restore to default.
        // Otherwise it would use the `request` function above after redirects.
        options.request = undefined;
    }
}
