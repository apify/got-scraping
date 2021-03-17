const HeaderGenerator = require('@petrpatek/headers-generator');
const got = require('got');

const { browserHeadersHandler } = require('../src/handlers/browser-headers');
const gotScraping = require('../src/index');

const { startDummyServer } = require('./helpers/dummy-server');

describe('Browser headers', () => {
    let nextHolder;
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
        };
        nextHolder = {
            next() { },
        };
        jest.spyOn(nextHolder, 'next');
        generatorSpy = jest.spyOn(HeaderGenerator.prototype, 'getHeaders').mockReturnValue(mockedHeaders);
    });

    afterAll(() => {
        server.close();
    });

    test('should generate headers only if header generation is on', () => {
        browserHeadersHandler(options, nextHolder.next);
        expect(nextHolder.next).toBeCalledWith(options);

        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };

        browserHeadersHandler(options, nextHolder.next);

        expect(generatorSpy).toHaveBeenCalled();

        expect(nextHolder.next).toHaveBeenLastCalledWith(expect.objectContaining({ headers: mockedHeaders }));
    });

    test('should add headers by option when http2 is used', () => {
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };

        browserHeadersHandler(options, nextHolder.next);

        expect(generatorSpy).toHaveBeenCalled();

        expect(nextHolder.next).toHaveBeenLastCalledWith(expect.objectContaining({ headers: mockedHeaders }));
    });

    test('should add headers by beforeRequestHook when http1 is used', () => {
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

        browserHeadersHandler(options, nextHolder.next);

        expect(generatorSpy).toHaveBeenCalled();

        expect(nextHolder.next).toHaveBeenLastCalledWith(expect.objectContaining({ hooks: expect.objectContaining({
            beforeRequest: expect.toBeArrayOfSize(1),
        }),
        }));
    });

    test('should pass option to header generator', () => {
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headerGeneratorOptions: {
                browsers: [
                    { browserName: 'chrome' },
                ],
            },
        };
        browserHeadersHandler(options, nextHolder.next);

        expect(generatorSpy).toHaveBeenLastCalledWith(expect.objectContaining(options.context.headerGeneratorOptions));
    });

    test('should override default ua header', () => {
        options.context = {
            headerGenerator,
            useHeaderGenerator: true,
            headers: {
                ...got.defaults.options.headers,
            },
        };
        browserHeadersHandler(options, nextHolder.next);

        expect(nextHolder.next).toHaveBeenLastCalledWith(expect.objectContaining({
            headers: {
                ...mockedHeaders,
            },
        }));
    });

    // Just an health check - header generator should have its own tests.
    test('should have working generator', () => {
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
        browserHeadersHandler(options, nextHolder.next);

        expect(nextHolder.next).toHaveBeenLastCalledWith(expect.objectContaining({
            headers: expect.objectContaining({
                'user-agent': expect.stringContaining('Chrome'),
            }),
        }));
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

        expect(response.request.options.hooks).toMatchObject({
            beforeRequest: expect.toBeArrayOfSize(1),
        });

        expect(response.request.options.headers).toMatchObject({
            'User-Agent': expect.stringContaining('Chrome'),
        });
    });
});
