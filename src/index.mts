import http from 'node:http';
import https from 'node:https';

import { got as originalGot, Options } from 'got';
import { HeaderGenerator } from 'header-generator';

import { TransformHeadersAgent } from './agent/transform-headers-agent.mjs';
import { browserHeadersHook } from './hooks/browser-headers.mjs';
import { customOptionsHook } from './hooks/custom-options.mjs';
import { fixDecompress } from './hooks/fix-decompress.mjs';
import { http2Hook } from './hooks/http2.mjs';
import { insecureParserHook } from './hooks/insecure-parser.mjs';
import { optionsValidationHandler } from './hooks/options-validation.mjs';
import { proxyHook } from './hooks/proxy.mjs';
import { refererHook } from './hooks/referer.mjs';
import { sessionDataHook } from './hooks/storage.mjs';
import { tlsHook } from './hooks/tls.mjs';
import type { GotScraping } from './types.mjs';

const handlers = [
    fixDecompress,
];

const beforeRequest = [
    insecureParserHook,
    sessionDataHook,
    http2Hook,
    proxyHook,
    browserHeadersHook,
    tlsHook,
];

const init = [
    optionsValidationHandler,
    customOptionsHook,
];

const beforeRedirect = [
    refererHook,
];

const gotScraping = originalGot.extend({
    handlers,
    mutableDefaults: true,
    // Most of the new browsers use HTTP/2
    http2: true,
    https: {
        // In contrast to browsers, we don't usually do login operations.
        // We want the content.
        rejectUnauthorized: false,
    },
    // Don't fail on 404
    throwHttpErrors: false,
    timeout: { request: 60_000 },
    retry: { limit: 0 },
    headers: {
        'user-agent': undefined,
    },
    context: {
        headerGenerator: new HeaderGenerator(),
        useHeaderGenerator: true,
        insecureHTTPParser: true,
    },
    agent: {
        http: new TransformHeadersAgent(http.globalAgent),
        https: new TransformHeadersAgent(https.globalAgent),
    },
    hooks: {
        init,
        beforeRequest,
        beforeRedirect,
    },
}) as GotScraping;

/**
 * Mock the `decodeURI` global for the time when Got is normalizing the URL.
 * @see https://github.com/apify/apify-js/issues/1205
 */
const setupDecodeURI = () => {
    const { set } = Object.getOwnPropertyDescriptor(Options.prototype, 'url')!;

    Object.defineProperty(Options.prototype, 'url', {
        set(value) {
            const originalDecodeURI = global.decodeURI;
            global.decodeURI = (str) => str;

            try {
                return set!.call(this, value);
            } finally {
                global.decodeURI = originalDecodeURI;
            }
        },
    });
};

setupDecodeURI();

export * from 'got';
export { gotScraping, TransformHeadersAgent };

export const hooks = {
    init,
    beforeRequest,
    beforeRedirect,
    fixDecompress,
    insecureParserHook,
    sessionDataHook,
    http2Hook,
    proxyHook,
    browserHeadersHook,
    tlsHook,
    optionsValidationHandler,
    customOptionsHook,
    refererHook,
};

export {
    type Context,
    type GotOptionsInit,
    type OptionsInit,
} from './context.mjs';

export type * from './types.mjs';
