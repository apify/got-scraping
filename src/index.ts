import http from 'http';
import https from 'https';

import { Got, got as gotCjs, HTTPAlias, Options } from 'got-cjs';
import { HeaderGenerator } from 'header-generator';

import { TransformHeadersAgent } from './agent/transform-headers-agent';

import { optionsValidationHandler } from './hooks/options-validation';
import { customOptionsHook } from './hooks/custom-options';
import { browserHeadersHook } from './hooks/browser-headers';
import { proxyHook } from './hooks/proxy';
import { http2Hook } from './hooks/http2';
import { insecureParserHook } from './hooks/insecure-parser';
import { tlsHook } from './hooks/tls';
import { sessionDataHook } from './hooks/storage';
import { fixDecompress } from './hooks/fix-decompress';
import { refererHook } from './hooks/referer';
import { ExtendedGotRequestFunction } from './types';

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

const gotScraping = gotCjs.extend({
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
    timeout: { request: 60000 },
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
}) as Got & Record<HTTPAlias, ExtendedGotRequestFunction> & ExtendedGotRequestFunction;

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

export * from 'got-cjs';
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
    GotOptionsInit,
    OptionsInit,
    Context,
} from './context';
