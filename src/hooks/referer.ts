import { BeforeRedirectHook } from 'got-cjs';
import { URL } from 'url';

export const refererHook: BeforeRedirectHook = (options, response) => {
    const url = options.url as URL;
    const resUrl = new URL(response.url);

    // Empty string means fall back to default.
    const policy = response.headers['referer-policy'] || 'strict-origin-when-cross-origin';

    if (policy === 'no-referrer') {
        delete options.headers.referer;
    } else if (policy === 'no-referrer-when-downgrade') {
        if (resUrl.protocol === 'https:' && url.protocol === 'http:') {
            delete options.headers.referer;
        } else {
            options.headers.referer = `${resUrl.origin}${resUrl.pathname}${resUrl.search}`;
        }
    } else if (policy === 'origin') {
        options.headers.referer = resUrl.origin;
    } else if (policy === 'origin-when-cross-origin') {
        if (url.origin === resUrl.origin) {
            options.headers.referer = `${resUrl.origin}${resUrl.pathname}${resUrl.search}`;
        } else {
            options.headers.referer = resUrl.origin;
        }
    } else if (policy === 'same-origin') {
        if (url.origin === resUrl.origin) {
            options.headers.referer = `${resUrl.origin}${resUrl.pathname}${resUrl.search}`;
        } else {
            delete options.headers.referer;
        }
    } else if (policy === 'strict-origin') {
        if (resUrl.protocol === 'https:' && url.protocol === 'http:') {
            delete options.headers.referer;
        } else {
            options.headers.referer = resUrl.origin;
        }
    } else if (policy === 'strict-origin-when-cross-origin') {
        if (url.origin === resUrl.origin) {
            options.headers.referer = `${resUrl.origin}${resUrl.pathname}${resUrl.search}`;
        } else if (resUrl.protocol === 'https:' && url.protocol === 'http:') {
            delete options.headers.referer;
        } else {
            options.headers.referer = resUrl.origin;
        }
    } else if (policy === 'unsafe-url') {
        options.headers.referer = `${resUrl.origin}${resUrl.pathname}${resUrl.search}`;
    }
};
