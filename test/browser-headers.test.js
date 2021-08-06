const http = require('http');
const HeaderGenerator = require('header-generator');
const { got } = require('got-cjs');

const { browserHeadersHook, mergeHeaders } = require('../src/hooks/browser-headers');
const TransformHeadersAgent = require('../src/agent/transform-headers-agent');
const gotScraping = require('../src/index');

const { startDummyServer } = require('./helpers/dummy-server');

describe('Browser headers', () => {
    let options;
    let generatorSpy;
    let server;
    let port;

    const mockedHeaders = {
        'user-agent': 'test',
        referer: 'test',
    };
    const headerGenerator = new HeaderGenerator();

    beforeAll(async () => {
        server = await startDummyServer();
        port = server.address().port; //eslint-disable-line
    });

    beforeEach(() => {
        options = {
            http2: true,
            context: {},
            url: new URL('http://example.com'),
            headers: {},
        };
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

        options = {
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { name: 'chrome' },
                ],
            },
        };
        options.url = `http://localhost:${port}/headers`;
        options.http2 = false;
        const headers = await gotScraping(options).json();

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
