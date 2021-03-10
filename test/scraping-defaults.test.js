const { scrapingDefaultsHandler, SCRAPING_DEFAULT_OPTIONS } = require('../src/handlers/scraping-defaults');

describe('Scraping defaults', () => {
    const nextHolder = {
        next() {},
    };

    beforeEach(() => {
        nextHolder.next = () => { };
        jest.spyOn(nextHolder, 'next');
    });

    test('should set correct defaults', () => {
        scrapingDefaultsHandler({}, nextHolder.next);
        expect(nextHolder.next).toBeCalledWith(expect.objectContaining(SCRAPING_DEFAULT_OPTIONS));
    });

    test('should allow user to override the defaults', () => {
        const customOptions = { ciphers: 'TEST', http: false, throwOnHttpErrors: false };
        scrapingDefaultsHandler(customOptions, nextHolder.next);
        expect(nextHolder.next).toBeCalledWith(expect.objectContaining(customOptions));
    });
});
