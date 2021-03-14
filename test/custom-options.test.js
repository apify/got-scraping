const { customOptionsHandler } = require('../src/handlers/custom-options');

describe('Custom options', () => {
    test('should move custom options to context', () => {
        const nextHolder = {
            next() {},
        };
        const options = {
            url: 'testUrl',
            proxyUrl: 'test',
            headerGeneratorOptions: {
                browsers: [
                    {
                        name: 'firefox',
                    },
                ],
            },
            useHeaderGenerator: false,
        };
        jest.spyOn(nextHolder, 'next');

        customOptionsHandler(options, nextHolder.next);

        expect(nextHolder.next).toBeCalledWith({
            url: options.url,
            context: {
                proxyUrl: options.proxyUrl,
                headerGeneratorOptions: options.headerGeneratorOptions,
                useHeaderGenerator: false,
            },
        });
    });
});
