import { AddressInfo } from 'net';
// @ts-expect-error @types/node is missing types
import { DEFAULT_CIPHERS } from 'tls';
import { Server } from 'http';
import { SCRAPING_DEFAULT_OPTIONS } from '../src/scraping-defaults';
import { gotScraping } from '../src/index';
import { startDummyServer } from './helpers/dummy-server';

describe('Scraping defaults', () => {
    let server: Server;
    let port: number;

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port;
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
        const customOptions = { https: { ciphers: DEFAULT_CIPHERS }, http2: false, throwHttpErrors: false };
        const response = await gotScraping.get(`http://localhost:${port}/html`, customOptions);

        expect(response.request.options).toMatchObject(customOptions);
    });
});
