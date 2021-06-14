import got, { Options, Response } from 'got-cjs';
import HeaderGenerator from 'header-generator';

import { SCRAPING_DEFAULT_OPTIONS } from './scraping-defaults';

import { optionsValidationHandler } from './handlers/options-validation';
import { customOptionsHandler } from './handlers/custom-options';
import { browserHeadersHandler } from './handlers/browser-headers';
import { proxyHandler } from './handlers/proxy';
import { alpnHandler } from './handlers/alpn';

const isResponseOk = (response: Response) => {
    const { statusCode } = response;
    const limitStatusCode = response.request.options.followRedirect ? 299 : 399;

    return (statusCode >= 200 && statusCode <= limitStatusCode) || statusCode === 304;
};

// we need to define the properties on the prototype to get around strict options validation in `got`
Object.defineProperties(Options.prototype, {
    proxyUrl: { value: undefined, writable: true, configurable: true },
    useHeaderGenerator: { value: undefined, writable: true, configurable: true },
    headerGeneratorOptions: { value: undefined, writable: true, configurable: true },
});

const mutableGot = got.extend({
    // Must be mutable in order to override the defaults
    // https://github.com/sindresorhus/got#instances
    mutableDefaults: true,
    context: {
        // Custom header generator instance.
        headerGenerator: new HeaderGenerator(),
    },
    // Got has issues with terminating requests and it can cause unhandled exceptions
    hooks: {
        afterResponse: [
            (response) => {
                if (isResponseOk(response)) {
                    response.request.destroy();
                }

                return response;
            },
        ],
    },
});

// Overriding the mutableGot defaults by merging its defaults and our scraping defaults.
mutableGot.defaults.options = new Options(SCRAPING_DEFAULT_OPTIONS, undefined, mutableGot.defaults.options);

const gotScraping = got.extend(
    mutableGot,
    {
        handlers: [
            optionsValidationHandler,
            customOptionsHandler,
            // ALPN negotiation is handled by got (http2-wrapper) by default.
            // However, its caching is causing problems with http proxies and https targets on http 1.1
            alpnHandler,
            proxyHandler,
            browserHeadersHandler,
        ],
    },
);

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

export default gotScraping;
