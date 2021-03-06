const requestAsBrowser = require('../src/main');

describe('extensions', () => {
    test('should automatically resolve protocol correctly', async () => {
        const response = await requestAsBrowser({ url: 'https://apify.com/' });
        expect(response.statusCode).toBe(200);
        expect(response.request.options).toMatchObject({ http2: true });
    });

    test('should work with proxyUrl and http2', async () => {
        const response = await requestAsBrowser({
            url: 'https://apify.com/',
            proxyUrl: `http://session-my_session:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
        });
        expect(response.statusCode).toBe(200);
        expect(response.request.options).toMatchObject({ http2: true });
    });

    test('should add headers', async () => {
        const response = await requestAsBrowser({
            url: 'https://apify.com/',
        });
        expect(response.statusCode).toBe(200);
        expect(response.request.options).toMatchObject({
            http2: true,
            headers: {
                'user-agent': 'test',
            } });
    });
});
