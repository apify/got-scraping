import type { NormalizedOptions } from 'got';

export interface Options {
    url?: string,
    // Most of the new browsers use HTTP2
    http2?: boolean,
    https?: {
        // We usually don't want to fail because of SSL errors.
        // We want the content.
        rejectUnauthorized?: boolean,
    },
    headers?: {},
    agent?: NormalizedOptions['agent'],
    proxyUrl?: string,
    headerGeneratorOptions?: Record<string, any>,
    // This would fail all of 404, 403 responses.
    // We usually don't want to consider these as errors.
    // We want to take some action after this.
    throwHttpErrors?: boolean,
    // Node js uses different TLS ciphers by default.
    ciphers?: string | undefined,
    // We need to have browser-like headers to blend in.
    useHeaderGenerator?: boolean,
    timeout?: number | NormalizedOptions['timeout'],
    retry?: { limit?: number, maxRetryAfter?: number },
    context?: Record<string, any>,
}
