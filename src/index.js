const got = require('got');
const HeaderGenerator = require('header-generator');
const http2 = require('http2-wrapper');

const { SCRAPING_DEFAULT_OPTIONS } = require('./scraping-defaults');

const { optionsValidationHandler } = require('./hooks/options-validation');
const { customOptionsHook } = require('./hooks/custom-options');
const { browserHeadersHook } = require('./hooks/browser-headers');
const { proxyHook } = require('./hooks/proxy');
const { alpnHook } = require('./hooks/alpn');

const gotScraping = got.extend({
    // Must be mutable in order to override the defaults
    // https://github.com/sindresorhus/got#instances
    mutableDefaults: true,
    ...SCRAPING_DEFAULT_OPTIONS,
    context: {
        headerGenerator: new HeaderGenerator(),
    },
    request: http2.auto,
    hooks: {
        init: [
            (opts) => optionsValidationHandler(opts, () => {}),
        ],
        beforeRequest: [
            customOptionsHook,
            // ALPN negotiation is handled by got (http2-wrapper) by default.
            // However, its caching is causing problems with http proxies and https targets on http 1.1
            alpnHook,
            proxyHook,
            browserHeadersHook,
        ],
    },
});

module.exports = gotScraping;
