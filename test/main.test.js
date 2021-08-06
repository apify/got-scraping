const { once } = require('events');
const getStream = require('get-stream');
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

    test('should allow passing custom properties', async () => {
        const requestOptions = {
            url: `http://localhost:${port}/headers`,
            headerGeneratorOptions: {
                browsers: [{ name: 'firefox' }],
            },
        };

        const response = await gotScraping(requestOptions);
        const { request: { options } } = response;
        expect(options.context.headerGeneratorOptions).toMatchObject(requestOptions.headerGeneratorOptions);

        expect('User-Agent' in JSON.parse(response.body)).toBe(true);
    });

    test('should allow overriding generated options using handlers', async () => {
        const requestOptions = {
            url: `http://localhost:${port}/html`,
        };
        const headers = {
            referer: 'test',
        };

        const extendedGot = gotScraping.extend({
            handlers: [
                (options, next) => {
                    options.merge({ headers });

                    return next(options);
                },
            ],
        });
        const response = await extendedGot(requestOptions);
        expect(response.request.options.headers).toMatchObject(headers);
    });

    test('should add custom headers', async () => {
        const response = await gotScraping({
            url: `http://localhost:${port}/headers`,
            headers: {
                'user-agent': 'test',
            },
            responseType: 'json',
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            'User-Agent': 'test',
        });
    });

    test('should get json', async () => {
        const response = await gotScraping({
            responseType: 'json',
            url: `http://localhost:${port}/json`,
        });

        expect(response.statusCode).toBe(200);
    });

    test('should post json', async () => {
        const body = { foo: 'bar' };

        const response = await gotScraping({
            responseType: 'json',
            url: `http://localhost:${port}/jsonPost`,
            json: body,
            method: 'POST',
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(body);
    });

    test('should post body', async () => {
        const body = { foo: 'bar' };

        const response = await gotScraping({
            url: `http://localhost:${port}/jsonPost`,
            body: JSON.stringify(body),
            responseType: 'json',
            method: 'POST',
            headers: {
                'content-type': 'application/json; charset=UTF-8',
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(body);
    });

    describe('Integration', () => {
        test('should use http2 first', async () => {
            const response = await gotScraping({ url: 'https://apify.com/' });
            expect(response.statusCode).toBe(200);
            expect(response.httpVersion).toBe('2.0');
        });

        test('Should auto downgrade protocol', async () => {
            const response = await gotScraping({ url: 'https://eshop.coop-box.cz/' });
            expect(response.statusCode).toBe(200);
            expect(response.httpVersion).toBe('1.1');
        });

        test('Should allow https target via http proxy when auto downgrading', async () => {
            const response = await gotScraping({
                url: 'https://eshop.coop-box.cz/',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
            });

            expect(response.statusCode).toBe(200);
            expect(response.httpVersion).toBe('1.1');
        });

        test('should work with proxyUrl and http1', async () => {
            const response = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                http2: false,
            });

            const responseProxy = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                http2: false,
            });

            expect(response.statusCode).toBe(200);
            expect(response.request.options).toMatchObject({ http2: false });

            expect(responseProxy.statusCode).toBe(200);

            expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
            expect(responseProxy.httpVersion).toBe('1.1');
        });

        test('should work with proxyUrl and http2', async () => {
            const response = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
            });

            expect(response.statusCode).toBe(200);
            expect(response.request.options).toMatchObject({ http2: true });

            const proxyPromise = gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
            });

            const responseProxy = await proxyPromise;
            expect(responseProxy.statusCode).toBe(200);
            expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
            expect(responseProxy.httpVersion).toBe('2.0');
        });

        test('should support tls 1.2', async () => {
            const url = 'https://tls-v1-2.badssl.com:1012/';

            const response = await gotScraping.get(url);
            expect(response.statusCode).toBe(200);
        });

        test('should support tls 1.3', async () => {
            const url = 'https://www.howsmyssl.com/a/check';

            const response = await gotScraping.get(url, { responseType: 'json' });
            expect(response.statusCode).toBe(200);
            expect(response.body.tls_version).toBe('TLS 1.3');
        });
    });

    describe('same thing with streams', () => {
        test('should allow passing custom properties', async () => {
            const requestOptions = {
                isStream: true,
                url: `http://localhost:${port}/html`,
                headerGeneratorOptions: {
                    browsers: [{ name: 'firefox' }],
                },
            };

            const stream = gotScraping(requestOptions);
            const [response] = await once(stream, 'response');

            const { request: { options } } = response;
            expect(options.context.headerGeneratorOptions).toMatchObject(requestOptions.headerGeneratorOptions);
        });

        test('should allow overriding generated options using handlers', async () => {
            const requestOptions = {
                isStream: true,
                url: `http://localhost:${port}/html`,
            };
            const headers = {
                referer: 'test',
            };

            const extendedGot = gotScraping.extend({
                handlers: [
                    (options, next) => {
                        options.merge({ headers });

                        return next(options);
                    },
                ],
            });

            const stream = extendedGot(requestOptions);
            const [response] = await once(stream, 'response');
            expect(response.request.options.headers).toMatchObject(headers);
        });

        test('should add custom headers', async () => {
            const stream = gotScraping({
                isStream: true,
                url: `http://localhost:${port}/headers`,
                headers: {
                    'user-agent': 'test',
                },
            });

            const [response] = await once(stream, 'response');

            const body = await getStream(stream);
            const headers = JSON.parse(body);

            expect(response.statusCode).toBe(200);
            expect(headers).toMatchObject({
                'User-Agent': 'test',
            });
        });

        test('should get json', async () => {
            const stream = gotScraping({
                isStream: true,
                url: `http://localhost:${port}/json`,
            });

            const [response] = await once(stream, 'response');
            expect(response.statusCode).toBe(200);
        });

        test('should post json', async () => {
            const body = { foo: 'bar' };

            const stream = gotScraping({
                isStream: true,
                url: `http://localhost:${port}/jsonPost`,
                json: body,
                method: 'POST',
            });

            const [response] = await once(stream, 'response');
            response.setEncoding('utf-8');

            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const responseBody = chunks.join();

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(responseBody)).toEqual(body);
        });

        test('should post body', async () => {
            const body = { foo: 'bar' };

            const stream = gotScraping({
                isStream: true,
                url: `http://localhost:${port}/jsonPost`,
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'content-type': 'application/json; charset=UTF-8',
                },
            });

            const [response] = await once(stream, 'response');
            response.setEncoding('utf-8');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const responseBody = chunks.join();

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(responseBody)).toEqual(body);
        });

        describe('Integration', () => {
            test('should use http2 first', async () => {
                const stream = gotScraping.stream({ url: 'https://apify.com/' });
                const [response] = await once(stream, 'response');
                expect(response.statusCode).toBe(200);
                expect(response.httpVersion).toBe('2.0');
            });

            test('Should auto downgrade protocol', async () => {
                const stream = gotScraping.stream({ url: 'https://eshop.coop-box.cz/' });
                const [response] = await once(stream, 'response');
                expect(response.statusCode).toBe(200);
                expect(response.httpVersion).toBe('1.1');
            });

            test('Should allow https target via http proxy when auto downgrading', async () => {
                const stream = gotScraping.stream({
                    url: 'https://eshop.coop-box.cz/',
                    proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,

                });
                const [response] = await once(stream, 'response');
                expect(response.statusCode).toBe(200);
                expect(response.httpVersion).toBe('1.1');
            });

            test('should work with proxyUrl and http1', async () => {
                const stream = gotScraping.stream({
                    url: 'https://api.apify.com/v2/browser-info',
                    http2: false,
                });
                const [response] = await once(stream, 'response');
                response.setEncoding('utf-8');
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const responseBody = chunks.join();

                const proxyStream = gotScraping.stream({
                    url: 'https://api.apify.com/v2/browser-info',
                    proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                    http2: false,
                });
                const [responseProxy] = await once(proxyStream, 'response');
                responseProxy.setEncoding('utf-8');
                const proxyChunks = [];
                for await (const chunk of responseProxy) {
                    proxyChunks.push(chunk);
                }
                const proxyResponseBody = proxyChunks.join();

                expect(response.statusCode).toBe(200);
                expect(response.request.options).toMatchObject({ http2: false });

                expect(responseProxy.statusCode).toBe(200);

                expect(JSON.parse(responseBody).clientIp).not.toBe(JSON.parse(proxyResponseBody).clientIp);
                expect(responseProxy.httpVersion).toBe('1.1');
            });

            test('should work with proxyUrl and http2', async () => {
                const stream = gotScraping.stream({
                    url: 'https://api.apify.com/v2/browser-info',
                });
                const [response] = await once(stream, 'response');
                response.setEncoding('utf-8');
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const responseBody = chunks.join();

                expect(response.statusCode).toBe(200);
                expect(response.request.options).toMatchObject({ http2: true });

                const proxyStream = gotScraping.stream({
                    url: 'https://api.apify.com/v2/browser-info',
                    proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                });

                const [responseProxy] = await once(proxyStream, 'response');
                responseProxy.setEncoding('utf-8');
                const proxyChunks = [];
                for await (const chunk of responseProxy) {
                    proxyChunks.push(chunk);
                }
                const proxyResponseBody = proxyChunks.join();
                expect(responseProxy.statusCode).toBe(200);
                expect(JSON.parse(responseBody).clientIp).not.toBe(JSON.parse(proxyResponseBody).clientIp);
                expect(responseProxy.httpVersion).toBe('2.0');
            });

            test('should support tls 1.2', async () => {
                const url = 'https://tls-v1-2.badssl.com:1012/';
                const stream = gotScraping.stream(url);
                const [response] = await once(stream, 'response');
                expect(response.statusCode).toBe(200);
            });

            test('should support tls 1.3', async () => {
                const url = 'https://www.howsmyssl.com/a/check';
                const stream = await gotScraping.stream(url);
                const [response] = await once(stream, 'response');
                response.setEncoding('utf-8');
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const responseBody = chunks.join();
                expect(response.statusCode).toBe(200);
                expect(JSON.parse(responseBody).tls_version).toBe('TLS 1.3');
            });
        });
    });
});
