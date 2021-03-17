const got = require('got');

const gotScraping = require('../src');

const { startDummyServer } = require('./helpers/dummy-server');

describe('GotScraping', () => {
    let server;
    let port;

    beforeAll(async () => {
        server = await startDummyServer();
        port = server.address().port; //eslint-disable-line
    });

    afterAll(() => {
        server.close();
    });

    test('should have got interface', () => {
        expect(typeof gotScraping.post).toBe('function');
        expect(typeof gotScraping.get).toBe('function');
        expect(typeof gotScraping.extend).toBe('function');
        expect(typeof gotScraping).toBe('function');
    });

    test('should use all handlers', async () => {
        expect(gotScraping.defaults.handlers).toHaveLength(3);
    });

    test('should allow passing custom properties', async () => {
        const requestOptions = {
            url: `http://localhost:${port}/html`,
            headerGeneratorOptions: {
                browsers: [{ name: 'firefox' }],
            },
        };

        const response = await gotScraping(requestOptions);
        const { request: { options } } = response;
        expect(options.context.headerGeneratorOptions).toMatchObject(requestOptions.headerGeneratorOptions);
    });

    test('should allow overrding generated options using handlers', async () => {
        const requestOptions = {
            url: `http://localhost:${port}/html`,
        };
        const headers = {
            referer: 'test',
        };

        const extendedGot = gotScraping.extend({
            handlers: [
                (options, next) => {
                    return next(got.mergeOptions(
                        options,
                        {
                            headers,
                        },
                    ));
                },
            ],
        });
        const response = await extendedGot(requestOptions);
        expect(response.request.options.headers).toMatchObject(headers);
    });

    test('should add custom headers', async () => {
        const response = await gotScraping({
            url: `http://localhost:${port}/html`,
            headers: {
                'user-agent': 'test',
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.request.options).toMatchObject({
            http2: true,
            headers: {
                'user-agent': 'test',
            },
        });
    });

    test('should get json', async () => {
        const response = await gotScraping({
            responseType: 'json',
            url: `http://localhost:${port}/json`,
        });

        expect(response.statusCode).toBe(200);
    });

    describe('Integration', () => {
        test('should use http2 first', async () => {
            const response = await gotScraping({ url: 'https://apify.com/' });
            expect(response.statusCode).toBe(200);
            expect(response.httpVersion).toBe('2.0');
        });
        test('should work with proxyUrl and http2', async () => {
            jest.setTimeout(20000);
            const response = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                ciphers: undefined,
            });

            const responseProxy = await gotScraping({
                json: true,
                url: 'https://api.apify.com/v2/browser-info',
                proxyUrl: `http://groups-SHADER,session-123:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                ciphers: undefined,
            });
            expect(response.statusCode).toBe(200);
            expect(response.request.options).toMatchObject({ http2: true });

            expect(responseProxy.statusCode).toBe(200);

            expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
            expect(responseProxy.httpVersion).toBe('2.0');
        });

        test('should work with proxyUrl and http1', async () => {
            jest.setTimeout(20000);
            const response = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                ciphers: undefined,
                http2: false,
            });

            const responseProxy = await gotScraping({
                json: true,
                url: 'https://api.apify.com/v2/browser-info',
                proxyUrl: `http://groups-SHADER,session-123:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                ciphers: undefined,
                http2: false,
            });
            expect(response.statusCode).toBe(200);
            expect(response.request.options).toMatchObject({ http2: false });

            expect(responseProxy.statusCode).toBe(200);
            expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
            expect(responseProxy.httpVersion).toBe('1.1');
        });
    });
});
