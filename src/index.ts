import { got as originalGot, Options } from 'got';
import { HeaderGenerator } from 'header-generator';

import AgentKeepAlive, { HttpsAgent as AgentKeepAliveHttps } from 'agentkeepalive';
import { TransformHeadersAgent } from './agent/transform-headers-agent.js';

import { browserHeadersHook } from './hooks/browser-headers.js';
import { customOptionsHook } from './hooks/custom-options.js';
import { fixDecompress } from './hooks/fix-decompress.js';
import { http2Hook } from './hooks/http2.js';
import { insecureParserHook } from './hooks/insecure-parser.js';
import { optionsValidationHandler } from './hooks/options-validation.js';
import { proxyHook } from './hooks/proxy.js';
import { refererHook } from './hooks/referer.js';
import { sessionDataHook } from './hooks/storage.js';
import { tlsHook } from './hooks/tls.js';
import type { GotScraping } from './types.js';

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
        // turn on keep-alive by default for our use-case
        // see: https://connectreport.com/blog/tuning-http-keep-alive-in-node-js/
        // https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html
        http: new TransformHeadersAgent(new AgentKeepAlive()),
        https: new TransformHeadersAgent(new AgentKeepAliveHttps()),
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
} from './context.js';

export type * from './types.js';
