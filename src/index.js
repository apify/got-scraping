const got = require('got');

const { customOptionsHandler } = require('./handlers/custom-options');
const { scrapingDefaultsHandler } = require('./handlers/scraping-defaults');
const { browserHeadersHandler } = require('./handlers/browser-headers');
const { proxyHandler } = require('./handlers/proxy');

/**
 * @typedef RequestOptions
 * @extends {GotOptions} - @TODO: proper import
 * @property {string} [proxyUrl] - HTTPS or HTTP proxy url - Support for SOCKS?
 * @property {HeadersGeneratorOptions} headersGeneratorOptions - options of the header generator.
 */

const mutableGot = got.extend({ mutableDefaults: true });

const gotScraping = got.extend(
    mutableGot,
    {
        handlers: [
            customOptionsHandler,
            scrapingDefaultsHandler,
            proxyHandler,
            browserHeadersHandler,
        ],
    },
);

// We can even return only the got modified instance to avoid mixing "our" options and got options.
// So far we need only the website url and https.rejectUnauthorized option.
module.exports = gotScraping;
