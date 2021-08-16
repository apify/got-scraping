import { URL } from 'url';
import { Options, RequestFunction } from 'got-cjs';
import { auto } from 'http2-wrapper';

export function http2Hook(options: Options): void {
    if (options.http2 && (options.url as URL).protocol !== 'http:') {
        options.request = auto as RequestFunction;
    }
}
