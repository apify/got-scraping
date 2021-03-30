const got = require('got');
const HeaderGenerator = require('header-generator');

const { SCRAPING_DEFAULT_OPTIONS } = require('./scraping-defaults');

const { optionsValidationHandler } = require('./handlers/options-validation');
const { customOptionsHandler } = require('./handlers/custom-options');
const { browserHeadersHandler } = require('./handlers/browser-headers');
const { proxyHandler } = require('./handlers/proxy');

const mutableGot = got.extend({
    // Must be mutable in order to override the defaults
    // https://github.com/sindresorhus/got#instances
    mutableDefaults: true,
    context: {
        // Custom header generator instance.
        headerGenerator: new HeaderGenerator(),
    },
});

// Overriding the mutableGot defaults by merging its defaults and our scraping defaults.
mutableGot.defaults.options = got.mergeOptions(mutableGot.defaults.options, SCRAPING_DEFAULT_OPTIONS);

const gotScraping = got.extend(
    mutableGot,
    {
        handlers: [
            optionsValidationHandler,
            customOptionsHandler,
            proxyHandler,
            browserHeadersHandler,
        ],
    },
);

module.exports = gotScraping;
