declare const SCRAPING_DEFAULT_OPTIONS: {
    http2: boolean;
    https: {
        rejectUnauthorized: boolean;
        ciphers: string;
    };
    throwHttpErrors: boolean;
    timeout: {
        request: number;
    };
    retry: {
        limit: number;
    };
    headers: {
        'user-agent': undefined;
    };
};
export { SCRAPING_DEFAULT_OPTIONS };
