const { SCRAPING_DEFAULT_OPTIONS } = require('../src/scraping-defaults');
const gotScraping = require('../src/index');
const { startDummyServer } = require('./helpers/dummy-server');

describe('Scraping defaults', () => {
    let server;
    let port;

    beforeAll(async () => {
        server = await startDummyServer();
        port = server.address().port; //eslint-disable-line
    });

    afterAll(() => {
        server.close();
    });

    test('should set correct defaults', async () => {
        const response = await gotScraping.get(`http://localhost:${port}/html`);

        const defaults = { ...SCRAPING_DEFAULT_OPTIONS };
        delete defaults.headers;

        expect(response.request.options).toMatchObject(defaults);
    });

    test('should allow user to override the defaults', async () => {
        const customOptions = { ciphers: undefined, http2: false, throwHttpErrors: false };
        const response = await gotScraping.get(`http://localhost:${port}/html`, customOptions);

        expect(response.request.options).toMatchObject(customOptions);
    });

    test('should have compatible defaults with node 10', () => {
        const nodeVersion = parseFloat(process.versions.node);

        if (nodeVersion < 12) {
            expect(SCRAPING_DEFAULT_OPTIONS.ciphers).toBe(undefined);
        } else {
            expect(SCRAPING_DEFAULT_OPTIONS.ciphers.startsWith('TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256'))
                .toBe(true);
        }
    });
});
