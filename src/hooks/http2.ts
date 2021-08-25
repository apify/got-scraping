import { URL } from 'url';
import { Options } from 'got-cjs';
import { auto, AutoRequestOptions } from 'http2-wrapper';
import { Context } from '../context';
import { createResolveProtocol } from '../resolve-protocol';

export function http2Hook(options: Options): void {
    const { proxyUrl, sessionData } = options.context as Context;

    if (options.http2 && (options.url as URL).protocol !== 'http:') {
        options.request = (url, requestOptions, callback) => {
            const typedRequestOptions = requestOptions as AutoRequestOptions;
            if (proxyUrl) {
                typedRequestOptions.resolveProtocol = createResolveProtocol(proxyUrl, sessionData as any);
            }

            return auto(url, typedRequestOptions, callback);
        };
    }
}
