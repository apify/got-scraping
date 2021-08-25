export const SCRAPING_DEFAULT_OPTIONS = {
    // Most of the new browsers use HTTP2
    http2: true,
    https: {
        // In contrast to browsers, we don't usually do login operations.
        // We want the content.
        rejectUnauthorized: false,
    },
    throwHttpErrors: false,
    timeout: { request: 60000 },
    retry: { limit: 0 },
    headers: {
        'user-agent': undefined,
    },
};
