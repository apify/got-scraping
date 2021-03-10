const got = require('got');

const SCRAPING_DEFAULT_OPTIONS = {
    http2: true,
    https: {
        rejectUnauthorized: false,
    },
    throwOnHttpErrors: false,
    ciphers: 'TLS_AES_256_GCM_SHA384',
};

const scrapingDefaultsHandler = (userGotOptions, next) => {
    const finalOptions = got.mergeOptions(got.defaults, SCRAPING_DEFAULT_OPTIONS, userGotOptions);

    return next(finalOptions);
};

module.exports = {
    SCRAPING_DEFAULT_OPTIONS,
    scrapingDefaultsHandler,
};
