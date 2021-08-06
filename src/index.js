const http = require('http');
const https = require('https');

const gotExports = require('got-cjs');
const HeaderGenerator = require('header-generator');

const TransformHeadersAgent = require('./agent/transform-headers-agent');
const { SCRAPING_DEFAULT_OPTIONS } = require('./scraping-defaults');

const { optionsValidationHandler } = require('./hooks/options-validation');
const { customOptionsHook } = require('./hooks/custom-options');
const { browserHeadersHook } = require('./hooks/browser-headers');
const { proxyHook } = require('./hooks/proxy');
const { http2Hook } = require('./hooks/http2');

const gotScraping = gotExports.got.extend({
    mutableDefaults: true,
    ...SCRAPING_DEFAULT_OPTIONS,
    context: {
        headerGenerator: new HeaderGenerator(),
        useHeaderGenerator: true,
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
        ],
    },
});

module.exports = gotScraping;

Object.assign(module.exports, { ...gotExports, got: gotScraping, default: gotScraping });
