const SCRAPING_DEFAULT_OPTIONS = {
    http2: true,
    https: {
        rejectUnauthorized: false,
    },
    throwHttpErrors: false,
    ciphers: 'TLS_AES_256_GCM_SHA384',
    useHeaderGenerator: true,
};

module.exports = {
    SCRAPING_DEFAULT_OPTIONS,
};
