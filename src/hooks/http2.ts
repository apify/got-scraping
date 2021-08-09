import { URL } from 'url';
import { Options } from 'got-cjs';
import { auto } from 'http2-wrapper';

export function http2Hook(options: Options) {
    if (options.http2 && (options.url as URL).protocol !== 'http:') {
        // @ts-expect-error FIXME
        options.request = auto;
    }
}
