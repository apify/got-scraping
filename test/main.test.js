import { Options } from 'got-cjs';
import gotScraping from '../lib';

import { startDummyServer } from './helpers/dummy-server';

describe('GotScraping', () => {
    let server;
    let port;
    const nodeVersion = parseFloat(process.versions.node);

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
        expect(gotScraping.defaults.handlers).toHaveLength(4);
    });

    // TODO this is a sanity check for https://github.com/sindresorhus/got/issues/1753
    // Can't keep it as a failing test because an unhandled rejection bleeds into the next one.
    test.skip('should throw unexpected option error on invalid options', async () => {
        await expect(() => gotScraping({ url: 'https://example.com', foo: 'bar' }))
            .rejects.toThrow('Unexpected option: foo');
    });

    // TODO skipping for now, but we should delete this later if we
    // confirm that custom props are not the way to go
    // test('should allow passing custom properties', async () => {
    //     const requestOptions = {
    //         url: `http://localhost:${port}/html`,
    //         headerGeneratorOptions: {
    //             browsers: [{ name: 'firefox' }],
    //         },
    //     };
    //
    //     const response = await gotScraping(requestOptions);
    //     const { request: { options } } = response;
    //     expect(options.context.headerGeneratorOptions).toMatchObject(requestOptions.headerGeneratorOptions);
    // });

    test('should allow overriding generated options using handlers', async () => {
        const requestOptions = {
            url: `http://localhost:${port}/html`,
            headers: {
                'user-agent': 'one',
                referer: 'one',
            }
        };

        const extendedGot = gotScraping.extend({
            handlers: [
                (options, next) => {
                    options.merge({
                        headers: {
                            referer: 'two',
                            'user-agent': 'two'
                        }
                    });
                    return next(options);
                },
            ],
        });
        const response = await extendedGot(requestOptions);
        expect(response.request.options.headers).toMatchObject({
            'User-Agent': 'two', // capitalized because it's a "mandatory" header
            referer: 'two', // casing is kept for non-mandatory (custom) headers
        });
    });

    test('should add custom headers', async () => {
        const response = await gotScraping({
            url: `http://localhost:${port}/html`,
            headers: {
                'user-agent': 'test',
            },
        });

        expect(response.statusCode).toBe(200);
        const { options } = response.request;
        expect(options.http2).toBe(false);
        expect(options.headers['User-Agent']).toBe('test');
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
            expect(response.request.options.headers.Accept).toBeDefined(); // capitalized headers are proof
        });

        if (nodeVersion >= 12) {
            test('Should allow https target via http proxy when auto downgrading', async () => {
                const response = await gotScraping({
                    url: 'https://eshop.coop-box.cz/',
                    context: {
                        proxyUrl: `http://groups-SHADER,session-123:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                    },
                });
                expect(response.statusCode).toBe(200);
                expect(response.httpVersion).toBe('1.1');
                expect(response.request.options.headers.Accept).toBeDefined(); // capitalized headers are proof
            });
        }

        test('should work with proxyUrl and http1', async () => {
            const response = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                http2: false,
            });

            const responseProxy = await gotScraping({
                responseType: 'json',
                url: 'https://api.apify.com/v2/browser-info',
                http2: false,
                context: {
                    proxyUrl: `http://groups-SHADER,session-123:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                }

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
                proxyUrl: `http://groups-SHADER,session-123:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
            });

            // We need this because we run tests in CI for various node versions.
            if (nodeVersion < 12) {
                await expect(proxyPromise).rejects.toThrow(/Proxy with HTTP2 target is supported only in node v12+/);
            } else {
                const responseProxy = await proxyPromise;
                expect(responseProxy.statusCode).toBe(200);
                expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
                expect(responseProxy.httpVersion).toBe('2.0');
            }
        });

        test('should support tls 1.2', async () => {
            const url = 'https://tls-v1-2.badssl.com:1012/';

            const response = await gotScraping.get(url);
            expect(response.statusCode).toBe(200);
        });

        if (nodeVersion >= 12) {
            test('should support tls 1.3', async () => {
                const url = 'https://www.howsmyssl.com/a/check';

                const response = await gotScraping.get(url, { responseType: 'json' });
                expect(response.statusCode).toBe(200);
                expect(response.body.tls_version).toBe('TLS 1.3');
            });
        }
    });
});
