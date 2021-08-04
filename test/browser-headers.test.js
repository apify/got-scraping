const HeaderGenerator = require('header-generator');
const got = require('got');

const { browserHeadersHook, mergeHeaders } = require('../src/hooks/browser-headers');
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

        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { name: 'chrome' },
                ],
            },
        };
        await browserHeadersHook(options);

        expect(options.headers).toMatchObject({
            'user-agent': expect.stringContaining('Chrome'),
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
        options.url = `http://localhost:${port}/html`;
        options.http2 = false;
        const response = await gotScraping(options);

        expect(response.request.options.headers).toMatchObject({
            'User-Agent': expect.stringContaining('Chrome'),
        });
    });
    describe('mergeHeaders', () => {
        test('should merge headers and respect original casing', () => {
            const generatedHeaders = {
                'User-Agent': 'TEST',
            };
            const userOverrides = {
                'user-agent': 'TEST2',
            };

            const mergedHeaders = mergeHeaders(generatedHeaders, userOverrides);

            expect(mergedHeaders['User-Agent']).toEqual(userOverrides['user-agent']);
            expect(mergedHeaders['user-agent']).toBeUndefined();
        });

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
