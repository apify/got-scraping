import httpResolver from '../http-resolver';
import type { NormalizedOptions, HandlerFunction } from 'got'

export const alpnHandler: HandlerFunction = async (options, next) => {
    const { url, http2 } = options;

    if (http2) {
        // TODO: is this correct?
        const parsedUrl = new URL(url as any);

        if (parsedUrl.protocol === 'https:') {
            const protocol = await httpResolver.resolveHttpVersion(parsedUrl);

            options.http2 = protocol === 'h2';
        } else {
            // http2 is https
            options.http2 = false;
        }
    }

    return next(options as NormalizedOptions);
}
