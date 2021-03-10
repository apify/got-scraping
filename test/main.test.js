const gotScraping = require('../src');

describe('GotScraping', () => {
    test('should have got interface', () => {
        expect(typeof gotScraping.post).toBe('function');
        expect(typeof gotScraping.get).toBe('function');
        expect(typeof gotScraping.extend).toBe('function');
        expect(typeof gotScraping).toBe('function');
    });
    test('should allow passing custom properties', async () => {
        const requestOptions = {
            url: 'https://apify.com/',
            headersGeneratorOptions: {
                browsers: ['firefox'],
            },
        };

        const response = await gotScraping(requestOptions);
        const { request: { options } } = response;
        expect(options.context.headersGeneratorOptions).toMatchObject(requestOptions.headersGeneratorOptions);
    });

    test('should automatically resolve protocol correctly', async () => {
        const response = await gotScraping({ url: 'https://apify.com/' });
        expect(response.statusCode).toBe(200);
        expect(response.request.options).toMatchObject({ http2: true });
    });

    test('should work with proxyUrl and http2', async () => {
        const response = await gotScraping({
            url: 'https://apify.com/',
            proxyUrl: `http://session-my_session:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
        });
        expect(response.statusCode).toBe(200);
        expect(response.request.options).toMatchObject({ http2: true });
    });

    test('should add headers', async () => {
        const response = await gotScraping({
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
