import type { HandlerFunction, RequestFunction } from 'got-cjs';
import http2 from 'http2-wrapper';
import httpResolver from '../http-resolver';

export const alpnHandler: HandlerFunction = async (options, next) => {
    if (options.http2) {
        // TODO: is this correct?
        const parsedUrl = new URL(options.url as any);

        if (parsedUrl.protocol === 'https:') {
            const protocol = await httpResolver.resolveHttpVersion(parsedUrl);

            options.http2 = protocol === 'h2';
        } else {
            // http2 is https
            options.http2 = false;
        }
    }

    if (options.http2) {
        options.request = http2.request as RequestFunction;
    }

    return next(options);
};
