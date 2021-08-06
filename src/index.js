import http from 'http';
import https from 'https';

import {
    Options,
    calculateRetryDelay,
    create,
    parseLinkHeader,
    isResponseOk,
    ParseError,
    parseBody,
    RequestError,
    MaxRedirectsError,
    HTTPError,
    CacheError,
    UploadError,
    TimeoutError,
    ReadError,
    RetryError,
    CancelError,
    got as gotCjs,
} from 'got-cjs';
import HeaderGenerator from 'header-generator';

import TransformHeadersAgent from './agent/transform-headers-agent';
import { SCRAPING_DEFAULT_OPTIONS } from './scraping-defaults';

import { optionsValidationHandler } from './hooks/options-validation';
import { customOptionsHook } from './hooks/custom-options';
import { browserHeadersHook } from './hooks/browser-headers';
import { proxyHook } from './hooks/proxy';
import { http2Hook } from './hooks/http2';
import { insecureParserHook } from './hooks/insecure-parser';

const got = gotCjs.extend({
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
            http2Hook,
            proxyHook,
            browserHeadersHook,
            insecureParserHook,
        ],
    },
});

export default got;
export {
    Options,
    calculateRetryDelay,
    create,
    parseLinkHeader,
    isResponseOk,
    ParseError,
    parseBody,
    RequestError,
    MaxRedirectsError,
    HTTPError,
    CacheError,
    UploadError,
    TimeoutError,
    ReadError,
    RetryError,
    CancelError,
    got,
};
