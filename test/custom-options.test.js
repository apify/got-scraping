const { customOptionsHandler } = require('../src/handlers/custom-options');

describe('Custom options', () => {
    test('should move custom options to context', () => {
        const nextHolder = {
            next() {},
        };
        const options = {
            url: 'testUrl',
            proxyUrl: 'test',
            headersGeneratorOptions: {
                browsers: [
                    {
                        name: 'firefox',
                    },
                ],
            },
        };
        jest.spyOn(nextHolder, 'next');

        customOptionsHandler(options, nextHolder.next);

        expect(nextHolder.next).toBeCalledWith({
            url: options.url,
            context: {
                proxyUrl: options.proxyUrl,
                headersGeneratorOptions: options.headersGeneratorOptions,
            },
        });
    });
});
