// FIXME: lint fails
/* eslint-disable no-underscore-dangle */
import http = require('http');
import https = require('https');

import { got as gotCjs } from 'got-cjs';

// @ts-expect-error Missing types
import HeaderGenerator = require('header-generator');

import { TransformHeadersAgent } from './agent/transform-headers-agent';
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
        http: new TransformHeadersAgent(http.globalAgent) as unknown as http.Agent,
        https: new TransformHeadersAgent(https.globalAgent) as unknown as https.Agent,
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

export * from 'got-cjs';
export default got;

export { got };

export {
    GotOptionsInit,
    OptionsInit,
    Context,
} from './context';

// CommonJS compatibility
Object.assign(got, module.exports);

module.exports = got;
module.exports.__esModule = true;
