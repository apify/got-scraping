const http = require('http');
const https = require('https');

const got = require('got');
const HeaderGenerator = require('header-generator');

const TransformHeadersAgent = require('./agent/transform-headers-agent');
const { SCRAPING_DEFAULT_OPTIONS } = require('./scraping-defaults');

const { optionsValidationHandler } = require('./hooks/options-validation');
const { customOptionsHook } = require('./hooks/custom-options');
const { browserHeadersHook } = require('./hooks/browser-headers');
const { proxyHook } = require('./hooks/proxy');
const { http2Hook } = require('./hooks/http2');

const gotScraping = got.extend({
    mutableDefaults: true,
    ...SCRAPING_DEFAULT_OPTIONS,
    context: {
        headerGenerator: new HeaderGenerator(),
    },
    agent: {
        http: new TransformHeadersAgent(http.globalAgent),
        https: new TransformHeadersAgent(https.globalAgent),
    },
    hooks: {
        init: [
            optionsValidationHandler,
        ],
        beforeRequest: [
            http2Hook,
            customOptionsHook,
            proxyHook,
            browserHeadersHook,
        ],
    },
});

module.exports = gotScraping;
