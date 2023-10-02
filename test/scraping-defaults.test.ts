import type { AddressInfo } from 'node:net';
import { DEFAULT_CIPHERS } from 'node:tls';
import { Server } from 'node:http';
import { gotScraping } from '../src/index.js';
import { startDummyServer } from './helpers/dummy-server.js';

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

    test('should allow user to override the defaults', async () => {
        const customOptions = { https: { ciphers: DEFAULT_CIPHERS }, http2: false, throwHttpErrors: false };
        const response = await gotScraping.get(`http://localhost:${port}/html`, customOptions);

        expect(response.request.options).toMatchObject(customOptions);
    });
});
