const { SCRAPING_DEFAULT_OPTIONS } = require('../src/scraping-defaults');
const gotScraping = require('../src/index');

describe('Scraping defaults', () => {
    test('should set correct defaults', async () => {
        const { useHeaderGenerator, ...gotDefaults } = SCRAPING_DEFAULT_OPTIONS;

        const response = await gotScraping.get('https://apify.com');
        expect(response.request.options).toMatchObject(gotDefaults);
        expect(response.request.options.context).toMatchObject({ useHeaderGenerator });
    });

    test('should allow user to override the defaults', async () => {
        const customOptions = { ciphers: undefined, http2: false, throwHttpErrors: false };
        const response = await gotScraping.get('https://apify.com', customOptions);

        expect(response.request.options).toMatchObject(customOptions);
    });
});
