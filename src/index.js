const got = require('got');
const HeaderGenerator = require('@petrpatek/headers-generator');

const { SCRAPING_DEFAULT_OPTIONS } = require('./scraping-defaults');

const { customOptionsHandler } = require('./handlers/custom-options');
const { browserHeadersHandler } = require('./handlers/browser-headers');
const { proxyHandler } = require('./handlers/proxy');

const mutableGot = got.extend({
    mutableDefaults: true,
    context: {
        headerGenerator: new HeaderGenerator(),
    },
});

mutableGot.defaults.options = got.mergeOptions(mutableGot.defaults.options, SCRAPING_DEFAULT_OPTIONS);

const gotScraping = got.extend(
    mutableGot,
    {
        handlers: [
            customOptionsHandler,
            proxyHandler,
            browserHeadersHandler,
        ],
    },
);

module.exports = gotScraping;
