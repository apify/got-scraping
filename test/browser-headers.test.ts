import { URL } from 'node:url';
import type { AddressInfo } from 'node:net';
import http, { Server } from 'node:http';
import { HeaderGenerator } from 'header-generator';
import { got } from 'got';
import { vi, describe, test, beforeAll, beforeEach, afterAll } from 'vitest';

import { browserHeadersHook, mergeHeaders } from '../src/hooks/browser-headers.js';
import { TransformHeadersAgent } from '../src/agent/transform-headers-agent.js';
import { type Context, gotScraping, Options } from '../src/index.js';

import { startDummyServer } from './helpers/dummy-server.js';
import { sessionDataHook } from '../src/hooks/storage.js';

describe('Browser headers', () => {
    const generatorSpy = vi.spyOn(HeaderGenerator.prototype, 'getHeaders');

    let options: Options & Context;
    let server: Server;
    let port: number;

    const mockedHeaders = {
        'user-agent': 'test',
        referer: 'test',
    };
    const headerGenerator = new HeaderGenerator();

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port;

        generatorSpy.mockReturnValue(mockedHeaders);
    });

    beforeEach(() => {
        options = {
            http2: true,
            context: {},
            url: new URL('https://example.com'),
            headers: {},
        } as Options & Context;
    });

    afterAll(() => {
        server.close();
    });

    test('should not generate headers without useHeaderGenerator', async (t) => {
        await browserHeadersHook(options);
        t.expect(options).toEqual(options);
    });

    test('should generate headers with useHeaderGenerator', async (t) => {
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

        t.expect(generatorSpy).toHaveBeenCalled();

        t.expect(options.headers).toMatchObject(mockedHeaders);
        t.expect(options.headers.foo).toBe('bar');
    });

    test('should add headers when http2 is used', async (t) => {
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

        t.expect(generatorSpy).toHaveBeenCalled();
        t.expect(options.headers).toEqual(mockedHeaders);
    });

    test('should add headers when http1 is used', async (t) => {
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

        t.expect(generatorSpy).toHaveBeenCalled();
        t.expect(options.headers).toEqual(mockedHeaders);
    });

    test('should pass option to header generator', async (t) => {
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

        t.expect(generatorSpy).toHaveBeenLastCalledWith(t.expect.objectContaining(options.context.headerGeneratorOptions));
    });

    test('should override default ua header', async (t) => {
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headers: {
                ...got.defaults.options.headers,
            },
        };
        await browserHeadersHook(options);

        t.expect(options.headers).toEqual(mockedHeaders);
    });

    // Just a health check - header generator should have its own tests.
    test('should have working generator', async (t) => {
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

        t.expect(headers).toMatchObject({
            'User-Agent': t.expect.stringContaining('Chrome'),
        });
    });

    test('should have capitalized headers with http1', async (t) => {
        generatorSpy.mockRestore();

        const o = {
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { name: 'chrome' },
                ],
            },
            url: `http://localhost:${port}/headers`,
            http2: false,
        };

        const headers = await gotScraping(o).json();

        t.expect(headers).toMatchObject({
            'User-Agent': t.expect.stringContaining('Chrome'),
        });
    });

    test('should respect casing of unrecognized headers', async (t) => {
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

        t.expect(headers).toMatchObject({
            'x-test': 'foo',
        });
    });

    describe('sessionToken', () => {
        const checkHeaders = (t, headers: Record<string, unknown>) => {
            const keys = Object.keys(headers);
            const lowercasedKeys = keys.map((key) => key.toLowerCase());

            t.expect(lowercasedKeys.includes('user-agent')).toBe(true);
        };

        test('gives the same headers with the same protocol', async (t) => {
            generatorSpy.mockRestore();

            options.resolveProtocol = () => ({ alpnProtocol: 'http/1.1' });

            options.context = {
                useHeaderGenerator: true,
                headerGenerator: new HeaderGenerator({
                    browsers: [{ name: 'firefox' }],
                }),
            };

            const sessionToken = {};
            options.context.sessionToken = sessionToken;
            sessionDataHook(options);

            await browserHeadersHook(options as unknown as Options);
            const { headers } = options;
            options.headers = {};

            options.context.headerGenerator = new HeaderGenerator({
                browsers: [{ name: 'chrome' }],
            });

            await browserHeadersHook(options as unknown as Options);
            const secondHeaders = options.headers;

            t.expect(headers).toEqual(secondHeaders);
            checkHeaders(t, headers);
        });

        test('gives different headers with different protocol', async (t) => {
            generatorSpy.mockRestore();

            options.resolveProtocol = () => ({ alpnProtocol: 'http/1.1' });

            options.context = {
                useHeaderGenerator: true,
                headerGenerator: new HeaderGenerator({
                    browsers: [{ name: 'firefox' }],
                }),
            };

            const sessionToken = {};
            options.context.sessionToken = sessionToken;
            sessionDataHook(options);

            await browserHeadersHook(options as unknown as Options);
            const { headers } = options;
            options.headers = {};

            options.resolveProtocol = () => ({ alpnProtocol: 'h2' });

            options.context.headerGenerator = new HeaderGenerator({
                browsers: [{ name: 'chrome' }],
            });

            await browserHeadersHook(options as unknown as Options);
            const secondHeaders = options.headers;

            t.expect(headers).not.toEqual(secondHeaders);
            checkHeaders(t, headers);
            checkHeaders(t, secondHeaders);
        });

        test('gives different headers with different token', async (t) => {
            generatorSpy.mockRestore();

            options.resolveProtocol = () => ({ alpnProtocol: 'http/1.1' });

            options.context = {
                useHeaderGenerator: true,
                headerGenerator: new HeaderGenerator({
                    browsers: [{ name: 'firefox' }],
                }),
            };

            const sessionToken = {};
            options.context.sessionToken = sessionToken;
            sessionDataHook(options);

            await browserHeadersHook(options as unknown as Options);
            const { headers } = options;
            options.headers = {};

            options.context.sessionToken = {};
            sessionDataHook(options);

            options.context.headerGenerator = new HeaderGenerator({
                browsers: [{ name: 'chrome' }],
            });

            await browserHeadersHook(options as unknown as Options);
            const secondHeaders = options.headers;

            t.expect(headers).not.toEqual(secondHeaders);
            checkHeaders(t, headers);
            checkHeaders(t, secondHeaders);
        });
    });

    describe('mergeHeaders', () => {
        test('should merge headers', (t) => {
            const generatedHeaders = {
                accept: 'TEST',
            };
            const userOverrides = {
                accept: 'TEST2',
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            t.expect(mergedHeaders.accept).toEqual(userOverrides.accept);
        });

        test('should allow deleting header', (t) => {
            const generatedHeaders = {
                accept: 'TEST',
            };
            const userOverrides = {
                accept: undefined,
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            t.expect(mergedHeaders.accept).toBeUndefined();
        });

        test('should allow adding header', (t) => {
            const generatedHeaders = {
                accept: 'TEST',
            };
            const userOverrides = {
                referer: 'test2',
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            t.expect(mergedHeaders.referer).toEqual(userOverrides.referer);
        });
    });
});
