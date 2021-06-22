const got = require('got');
const HeaderGenerator = require('header-generator');

const { SCRAPING_DEFAULT_OPTIONS } = require('./scraping-defaults');

const { optionsValidationHandler } = require('./handlers/options-validation');
const { customOptionsHook } = require('./handlers/custom-options');
const { browserHeadersHook } = require('./handlers/browser-headers');
const { proxyHandler } = require('./handlers/proxy');
const { alpnHandler } = require('./handlers/alpn');

const gotScraping = got.extend({
    // Must be mutable in order to override the defaults
    // https://github.com/sindresorhus/got#instances
    mutableDefaults: true,
    ...SCRAPING_DEFAULT_OPTIONS,
    context: {
        headerGenerator: new HeaderGenerator(),
    },
    hooks: {
        init: [
            (opts) => optionsValidationHandler(opts, () => {}),
        ],
        beforeRequest: [
            customOptionsHook,
            // ALPN negotiation is handled by got (http2-wrapper) by default.
            // However, its caching is causing problems with http proxies and https targets on http 1.1
            async (opts) => alpnHandler(opts, () => {}),
            async (opts) => proxyHandler(opts, () => {}),
            browserHeadersHook,
        ],
    },
});

module.exports = gotScraping;
