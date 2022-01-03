import { RequestError } from 'got-cjs';

export function fixDecompress(error: RequestError): void {
    if (error.code === 'Z_DATA_ERROR') {
        error.options.decompress = false;
    }
}
