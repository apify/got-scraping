import { AddressInfo } from 'net';
import { Server } from 'http';
import { SCRAPING_DEFAULT_OPTIONS } from '../dist/scraping-defaults';
import gotScraping from '../dist/index';
import { startDummyServer } from './helpers/dummy-server';

describe('Scraping defaults', () => {
    let server: Server;
    let port: number;

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port; //eslint-disable-line
    });

    afterAll(() => {
        server.close();
    });

    test('should set correct defaults', async () => {
        const response = await gotScraping.get(`http://localhost:${port}/html`);

        const defaults = { ...SCRAPING_DEFAULT_OPTIONS };
        // @ts-expect-error We delete a defined type on purpose.
        delete defaults.headers;

        expect(response.request.options).toMatchObject(defaults);
    });

    test('should allow user to override the defaults', async () => {
        const customOptions = { https: { ciphers: undefined }, http2: false, throwHttpErrors: false };
        const response = await gotScraping.get(`http://localhost:${port}/html`, customOptions);

        expect(response.request.options).toMatchObject(customOptions);
    });

    test('should have compatible defaults with node 10', () => {
        const nodeVersion = parseFloat(process.versions.node);

        if (nodeVersion < 12) {
            expect(SCRAPING_DEFAULT_OPTIONS.https.ciphers).toBe(undefined);
        } else {
            expect(SCRAPING_DEFAULT_OPTIONS.https.ciphers
                .startsWith('TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256'))
                .toBe(true);
        }
    });
});
