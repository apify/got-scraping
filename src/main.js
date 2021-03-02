_ = require('lodash');
const got = require('got');

const httpResolver = require('./handlers/http-resolver');
const { createBrowserHeadersHandler } = require('./handlers/headers');
const { createProxyHandler } = require('./handlers/proxy');

/**
 * @typedef RequestOptions
 * @extends {GotOptions} - @TODO: proper import
 * @property {string} [proxyUrl] - HTTPS or HTTP proxy url - Support for SOCKS?
 * @property {HeadersGeneratorOptions} headersGeneratorOptions - options of the header generator.
 */

/**
 *
 * @param {RequestOptions} options
 * @returns {import('got/dist/source').GotReturn}
 */
const requestAsBrowser = async (options) => {
    const { proxyUrl, headersGeneratorOptions, ...rest } = options;
    const gotOptions = _.cloneDeep(rest);
    const mutableGot = got.extend({ ...gotOptions, mutableDefaults: true });

    const resolverHandler = await httpResolver.createResolverHandler(gotOptions.url);
    const proxyHandler = createProxyHandler(proxyUrl);
    const browserHeadersHandler = createBrowserHeadersHandler(headersGeneratorOptions);

    const gotScraping = got.extend(
        mutableGot,
        {
            handlers: [
                resolverHandler,
                proxyHandler,
                browserHeadersHandler,
            ],
        },
    );

    return gotScraping();
};

// We can even return only the got modified instance to avoid mixing "our" options and got options.
// So far we need only the website url and https.rejectUnauthorized option.
module.exports = requestAsBrowser;
