import http2 from 'http2-wrapper';

export function http2Hook(options) {
    if (options.http2 && options.url.protocol !== 'http:') {
        options.request = http2.auto;
    }
}
