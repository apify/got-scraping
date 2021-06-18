import { SCRAPING_DEFAULT_OPTIONS } from '../lib/scraping-defaults';
import gotScraping from '../lib/index';
import { startDummyServer } from './helpers/dummy-server';

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
        expect(response.request.options).toMatchObject({
            ...SCRAPING_DEFAULT_OPTIONS,
            http2: false // false because the testing server does not support HTTP2, default is true
        });
    });

    test('should allow user to override the defaults', async () => {
        const customOptions = { httpsOptions: { ciphers: undefined }, http2: false, throwHttpErrors: false };
        const response = await gotScraping.get(`http://localhost:${port}/html`, customOptions);

        expect(response.request.options).toMatchObject(customOptions);
    });

    test('should have compatible defaults with node 10', () => {
        const nodeVersion = parseFloat(process.versions.node);

        if (nodeVersion < 12) {
            expect(SCRAPING_DEFAULT_OPTIONS.httpsOptions.ciphers).toBe(undefined);
        } else {
            expect(SCRAPING_DEFAULT_OPTIONS.httpsOptions.ciphers.startsWith('TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256'))
                .toBe(true);
        }
    });
});
