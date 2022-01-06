import http from 'http';
import https from 'https';

import { got as gotCjs, Options } from 'got-cjs';

// @ts-expect-error Missing types
import HeaderGenerator from 'header-generator';

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

const gotScraping = gotCjs.extend({
    handlers: [
        fixDecompress,
    ],
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
        init: [
            optionsValidationHandler,
            customOptionsHook,
        ],
        beforeRequest: [
            insecureParserHook,
            sessionDataHook,
            http2Hook,
            proxyHook,
            browserHeadersHook,
            tlsHook,
        ],
    },
});

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
export { gotScraping };

export {
    GotOptionsInit,
    OptionsInit,
    Context,
} from './context';
