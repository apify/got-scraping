import zlib from 'zlib';
import { ClientRequest, IncomingMessage } from 'http';
import { HandlerFunction } from 'got-cjs';
import { PassThrough, Transform } from 'stream';
import mimicResponse from 'mimic-response';

const onResponse = (response: IncomingMessage, propagate: (fixedResponse: IncomingMessage) => void) => {
    const encoding = response.headers['content-encoding']?.toLowerCase();

    // Append empty chunk.
    const zlibOptions = {
        flush: zlib.constants.Z_SYNC_FLUSH,
        finishFlush: zlib.constants.Z_SYNC_FLUSH,
    };

    const useDecompressor = (decompressor: Transform) => {
        delete response.headers['content-encoding'];

        const result = new PassThrough({
            autoDestroy: false,
            destroy(error, callback) {
                response.destroy();

                callback(error);
            },
        });

        response.pipe(decompressor).pipe(result);

        propagate(mimicResponse(response, result));
    };

    if (encoding === 'gzip' || encoding === 'x-gzip') {
        useDecompressor(zlib.createGunzip(zlibOptions));
    } else if (encoding === 'deflate' || encoding === 'x-deflate') {
        let read = false;

        response.once('data', (chunk: Buffer) => {
            read = true;

            response.unshift(chunk);

            // See http://stackoverflow.com/questions/37519828
            // eslint-disable-next-line no-bitwise
            const decompressor = (chunk[0] & 0x0F) === 0x08 ? zlib.createInflate() : zlib.createInflateRaw();
            useDecompressor(decompressor);
        });

        response.once('end', () => {
            if (!read) {
                propagate(response);
            }
        });
    } else if (encoding === 'br') {
        useDecompressor(zlib.createBrotliDecompress());
    } else {
        propagate(response);
    }
};

export const fixDecompress: HandlerFunction = (options, next) => {
    if (options.decompress) {
        options.headers['accept-encoding'] = process.versions.brotli ? 'gzip, deflate, br' : 'gzip, deflate';
        options.decompress = false;
    } else {
        return next(options);
    }

    const result = next(options);

    // @ts-expect-error Looks like a TypeScript bug
    result.on('request', (request: ClientRequest) => {
        const emit = request.emit.bind(request);

        request.emit = (event: string, ...args: unknown[]) => {
            if (event === 'response') {
                const response = args[0] as IncomingMessage;

                const emitted = request.listenerCount('response') !== 0;

                onResponse(response, (fixedResponse: IncomingMessage) => {
                    emit('response', fixedResponse);
                });

                return emitted;
            }

            return emit.call(request, event, ...args);
        };
    });

    return result;
};
