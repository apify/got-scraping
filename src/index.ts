import http from 'http';
import https from 'https';

import { got as gotCjs } from 'got-cjs';

// @ts-expect-error Missing types
import HeaderGenerator from 'header-generator';

import { TransformHeadersAgent } from './agent/transform-headers-agent';
import { SCRAPING_DEFAULT_OPTIONS } from './scraping-defaults';

import { optionsValidationHandler } from './hooks/options-validation';
import { customOptionsHook } from './hooks/custom-options';
import { browserHeadersHook } from './hooks/browser-headers';
import { proxyHook } from './hooks/proxy';
import { http2Hook } from './hooks/http2';
import { insecureParserHook } from './hooks/insecure-parser';
import { tlsHook } from './hooks/tls';
import { sessionDataHook } from './hooks/storage';

const gotScraping = gotCjs.extend({
    mutableDefaults: true,
    ...SCRAPING_DEFAULT_OPTIONS,
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
            sessionDataHook,
            tlsHook,
            http2Hook,
            proxyHook,
            browserHeadersHook,
            insecureParserHook,
        ],
    },
});

export * from 'got-cjs';
export { gotScraping };

export {
    GotOptionsInit,
    OptionsInit,
    Context,
} from './context';
