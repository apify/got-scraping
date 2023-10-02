import { Server } from 'node:http';
import net, { type AddressInfo, Server as TCPServer } from 'node:net';
import { once } from 'events';
import gotExports, { type Response } from 'got';
import getStream from 'get-stream';
import { jest } from '@jest/globals';
import { gotScraping, type OptionsInit } from '../src/index.js';

import { startDummyServer } from './helpers/dummy-server.js';

const getPort = (server: TCPServer) => (server.address() as AddressInfo).port;

// All `fixme`s here are related with https://github.com/sindresorhus/got/issues/1117

describe('GotScraping', () => {
    let server: Server;
    let port: number;

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port;
    });

    afterAll(() => {
        server.close();
    });

    test('insecure parser by default', (done) => {
        const plain = net.createServer((socket) => {
            socket.end([
                'HTTP/1.1 200 OK',
                'connection: close',
                'content-length: 0',
                `host: localhost:${getPort(plain)}`,
                `invalid: \x00`,
                ``,
                ``,
            ].join('\r\n'));
        });

        plain.listen(0, async () => {
            try {
                const { headers } = await gotScraping(`http://localhost:${getPort(plain)}`);

                expect(headers.invalid).toBe('\x00');
            } catch (error) {
                plain.close();
                done(error);
            }

            plain.close();
            done();
        });
    });

    test('insecure parser can be disabled', (done) => {
        const plain = net.createServer((socket) => {
            socket.end([
                'HTTP/1.1 200 OK',
                'connection: close',
                'content-length: 0',
                `host: localhost:${getPort(plain)}`,
                `invalid: \x00`,
                ``,
                ``,
            ].join('\r\n'));
        });

        plain.listen(0, async () => {
            try {
                await gotScraping(`http://localhost:${getPort(plain)}`, {
                    insecureHTTPParser: false,
                } as OptionsInit);

                plain.close();
                done(new Error('The request went through :('));
            } catch (error) {
                plain.close();
                done();
            }
        });
    });

    test('accepts invalid URIs', async () => {
        const testQueries = [
            // [query, raw]
            ['%20', '%20'],
            ['%cf', '%cf'],
            ['helios-–-the-primordial-sun', 'helios-%E2%80%93-the-primordial-sun'],
            ['helios-%E2%80%93-the-primordial-sun', 'helios-%E2%80%93-the-primordial-sun'],
            ['%C3%A8----%C3%A9', '%C3%A8----%C3%A9'],
            ['è----é', '%C3%A8----%C3%A9'],
        ];

        const result = await Promise.all(testQueries.map((query) => gotScraping(`http://localhost:${port}/query?${query[0]}`).text()));

        expect(result).toEqual(testQueries.map((query) => query[1]));
    });

    test('should have got interface', () => {
        expect(typeof gotScraping.post).toBe('function');
        expect(typeof gotScraping.get).toBe('function');
        expect(typeof gotScraping.extend).toBe('function');
        expect(typeof gotScraping).toBe('function');

        for (const key of Object.keys(gotExports)) {
            expect(key in gotScraping).toBe(true);

            if (key !== 'got' && key !== 'default') {
                const gotScrapingValue = gotScraping[key as keyof typeof gotScraping];
                const gotExprotsValue = gotExports[key as keyof typeof gotExports];

                expect(String(gotScrapingValue)).toBe(String(gotExprotsValue));
            }
        }

        expect('default' in gotScraping).toBe(false);
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
        jest.retryTimes(3);

        // FIXME: this should be using a local server instead
        test.skip('should order headers', async () => {
            const { rawHeaders } = await gotScraping({ url: 'https://api.apify.com/v2/browser-info?rawHeaders=1' }).json<{ rawHeaders: string[] }>();
            expect(rawHeaders[0].toLowerCase()).toBe('connection');
        });

        test('should use http2 first', async () => {
            const response = await gotScraping({ url: 'https://apify.com/' });
            expect(response.statusCode).toBe(200);
            expect(response.httpVersion).toBe('2.0');
        });

        // FIXME: this should use a local server instead
        test.skip('Should auto downgrade protocol', async () => {
            const response = await gotScraping({ url: 'https://eshop.coop-box.cz/' });
            expect(response.statusCode).toBe(200);
            expect(response.httpVersion).toBe('1.1');
        });

        // FIXME: this should use a local server instead
        test.skip('Should allow https target via http proxy when auto downgrading', async () => {
            const response = await gotScraping({
                url: 'https://eshop.coop-box.cz/',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
            } as OptionsInit);

            // @ts-expect-error FIXME
            expect(response.statusCode).toBe(200);
            // @ts-expect-error FIXME
            expect(response.httpVersion).toBe('1.1');
        });

        test('should work with proxyUrl and unsecure http1', async () => {
            const unproxiedResponse = await gotScraping({
                responseType: 'json',
                url: 'http://httpbin.org/anything',
            } as OptionsInit);

            const { body: { origin } } = unproxiedResponse as Response<{ origin: string }>;

            const response = await gotScraping({
                responseType: 'json',
                url: 'http://httpbin.org/anything',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                retry: {
                    limit: 0,
                },
            } as OptionsInit);

            const typedResponse = response as Response<{ origin: string }>;

            expect(typedResponse.statusCode).toBe(200);
            expect(typedResponse.body.origin).not.toBe(origin);
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
            } as OptionsInit);

            expect(response.statusCode).toBe(200);
            expect(response.request.options).toMatchObject({ http2: false });

            // @ts-expect-error FIXME
            expect(responseProxy.statusCode).toBe(200);

            // @ts-expect-error FIXME
            expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
            // @ts-expect-error FIXME
            expect(responseProxy.httpVersion).toBe('1.1');
        });

        // FIXME: this should be using a local server instead
        test.skip('should order headers with proxyUrl and http1', async () => {
            const { rawHeaders } = await gotScraping({
                url: 'https://api.apify.com/v2/browser-info?rawHeaders=1',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                http2: false,
                // @ts-expect-error FIXME
            } as OptionsInit).json();

            expect(rawHeaders[0].toLowerCase()).toBe('connection');
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
            } as OptionsInit);

            const responseProxy = await proxyPromise;
            // @ts-expect-error FIXME
            expect(responseProxy.statusCode).toBe(200);
            // @ts-expect-error FIXME
            expect(response.body.clientIp).not.toBe(responseProxy.body.clientIp);
            // @ts-expect-error FIXME
            expect(responseProxy.httpVersion).toBe('2.0');
        });

        test('should work with default proxy port', async () => {
            try {
                await gotScraping({
                    url: 'http://api.apify.com/v2/browser-info',
                    context: {
                        proxyUrl: 'http://127.0.0.1:80',
                    },
                });
            } catch (error: any) {
                expect(error.code).not.toBe('ERR_SOCKET_BAD_PORT');
            }
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
            // @ts-expect-error FIXME
            expect(response.body.tls_version).toBe('TLS 1.3');
        });
    });

    test('is lenient on decompression', async () => {
        const response = await gotScraping.get(`http://localhost:${port}/invalid-deflate`);
        expect(response.body).toBe('ok');
    });

    describe('same thing with streams', () => {
        // FIXME: this should be using a local server instead
        test.skip('should order headers', async () => {
            const body = await getStream(gotScraping.stream({ url: 'https://api.apify.com/v2/browser-info?rawHeaders=1' }));
            const { rawHeaders } = JSON.parse(body);

            expect(rawHeaders[0].toLowerCase()).toBe('connection');
        });

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

        // FIXME: this should be using a local server instead
        test.skip('should order headers with proxyUrl and http1', async () => {
            // @ts-expect-error FIXME
            const body = await getStream(gotScraping.stream({
                url: 'https://api.apify.com/v2/browser-info?rawHeaders=1',
                proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
                http2: false,
            }));
            const { rawHeaders } = JSON.parse(body);

            expect(rawHeaders[0].toLowerCase()).toBe('connection');
        });

        describe('Integration', () => {
            test('should use http2 first', async () => {
                const stream = gotScraping.stream({ url: 'https://apify.com/' });
                const [response] = await once(stream, 'response');
                expect(response.statusCode).toBe(200);
                expect(response.httpVersion).toBe('2.0');
            });

            // FIXME: this should use a local server instead
            test.skip('Should auto downgrade protocol', async () => {
                const stream = gotScraping.stream({ url: 'https://eshop.coop-box.cz/' });
                const [response] = await once(stream, 'response');
                expect(response.statusCode).toBe(200);
                expect(response.httpVersion).toBe('1.1');
            });

            // FIXME: this should use a local server instead
            test.skip('Should allow https target via http proxy when auto downgrading', async () => {
                // @ts-expect-error FIXME
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

                // @ts-expect-error FIXME
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

                // @ts-expect-error FIXME
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
