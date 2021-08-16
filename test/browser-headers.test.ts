import { URL } from 'url';
import { AddressInfo } from 'net';
import http, { Server } from 'http';
// @ts-expect-error Missing types
import HeaderGenerator from 'header-generator';
import { got } from 'got-cjs';

import { browserHeadersHook, mergeHeaders } from '../src/hooks/browser-headers';
import { TransformHeadersAgent } from '../src/agent/transform-headers-agent';
import { gotScraping, Options, OptionsInit } from '../src/index';

import { startDummyServer } from './helpers/dummy-server';

describe('Browser headers', () => {
    let options: Options;
    let generatorSpy: any; // Missing types for jest.spy
    let server: Server;
    let port: number;

    const mockedHeaders = {
        'user-agent': 'test',
        referer: 'test',
    };
    const headerGenerator = new HeaderGenerator();

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port; //eslint-disable-line
    });

    beforeEach(() => {
        options = {
            http2: true,
            context: {},
            url: new URL('http://example.com'),
            headers: {},
        } as Options;
        generatorSpy = jest.spyOn(HeaderGenerator.prototype, 'getHeaders').mockReturnValue(mockedHeaders);
    });

    afterAll(() => {
        server.close();
    });

    test('should not generate headers without useHeaderGenerator', async () => {
        await browserHeadersHook(options);
        expect(options).toEqual(options);
    });

    test('should generate headers with useHeaderGenerator', async () => {
        options.headers = {
            foo: 'bar',
        };
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };

        await browserHeadersHook(options);

        expect(generatorSpy).toHaveBeenCalled();

        expect(options.headers).toMatchObject(mockedHeaders);
        expect(options.headers.foo).toBe('bar');
    });

    test('should add headers when http2 is used', async () => {
        options.http2 = true;
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };

        await browserHeadersHook(options);

        expect(generatorSpy).toHaveBeenCalled();
        expect(options.headers).toEqual(mockedHeaders);
    });

    test('should add headers when http1 is used', async () => {
        options.http2 = false;
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };

        await browserHeadersHook(options);

        expect(generatorSpy).toHaveBeenCalled();
        expect(options.headers).toEqual(mockedHeaders);
    });

    test('should pass option to header generator', async () => {
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };
        await browserHeadersHook(options);

        expect(generatorSpy).toHaveBeenLastCalledWith(expect.objectContaining(options.context.headerGeneratorOptions));
    });

    test('should override default ua header', async () => {
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headers: {
                ...got.defaults.options.headers,
            },
        };
        await browserHeadersHook(options);

        expect(options.headers).toEqual(mockedHeaders);
    });

    // Just a health check - header generator should have its own tests.
    test('should have working generator', async () => {
        generatorSpy.mockRestore();

        const headers = await got(`http://localhost:${port}/headers`, {
            agent: {
                http: new TransformHeadersAgent(http.globalAgent),
            },
            headers: {
                'user-agent': undefined,
            },
            context: {
                useHeaderGenerator: true,
                headerGenerator,
                headerGeneratorOptions: {
                    browsers: [
                        { name: 'chrome' },
                    ],
                },
            },
            hooks: {
                beforeRequest: [
                    browserHeadersHook,
                ],
            },
        }).json();

        expect(headers).toMatchObject({
            'User-Agent': expect.stringContaining('Chrome'),
        });
    });

    test('should have capitalized headers with http1', async () => {
        generatorSpy.mockRestore();

        const o: OptionsInit = {
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { name: 'chrome' },
                ],
            },
            url: `http://localhost:${port}/headers`,
            http2: false,
        };

        // @ts-expect-error FIXME
        const headers = await gotScraping(o).json();

        expect(headers).toMatchObject({
            'User-Agent': expect.stringContaining('Chrome'),
        });
    });

    test('should respect casing of unrecognized headers', async () => {
        generatorSpy.mockRestore();

        const headers = await got(`http://localhost:${port}/headers`, {
            headers: {
                'user-agent': undefined,
                'x-test': 'foo',
            },
            context: {
                useHeaderGenerator: true,
                headerGenerator,
                headerGeneratorOptions: {
                    browsers: [
                        { name: 'chrome' },
                    ],
                },
            },
            hooks: {
                beforeRequest: [
                    browserHeadersHook,
                ],
            },
        }).json();

        expect(headers).toMatchObject({
            'x-test': 'foo',
        });
    });

    describe('mergeHeaders', () => {
        test('should merge headers', () => {
            const generatedHeaders = {
                accept: 'TEST',
            };
            const userOverrides = {
                accept: 'TEST2',
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            expect(mergedHeaders.accept).toEqual(userOverrides.accept);
        });

        test('should allow deleting header', () => {
            const generatedHeaders = {
                accept: 'TEST',
            };
            const userOverrides = {
                accept: undefined,
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            expect(mergedHeaders.accept).toBeUndefined();
        });

        test('should allow adding header', () => {
            const generatedHeaders = {
                accept: 'TEST',
            };
            const userOverrides = {
                referer: 'test2',
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            expect(mergedHeaders.referer).toEqual(userOverrides.referer);
        });
    });
});
