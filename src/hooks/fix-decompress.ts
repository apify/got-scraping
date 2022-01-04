import { URL } from 'url';
import { RequestError, Options } from 'got-cjs';

const toSkip: string[] = [];

export function shouldDecompress(options: Options): void {
    if (options.decompress) {
        const url = options.url as URL;

        if (toSkip.includes(url.origin)) {
            options.decompress = false;
        }
    }
}

export function fixDecompress(error: RequestError): void {
    if (error.code === 'Z_DATA_ERROR') {
        error.options.decompress = false;

        const url = error.options.url as URL;
        toSkip.push(url.origin);

        if (toSkip.length > 1000) {
            toSkip.shift();
        }
    }
}
