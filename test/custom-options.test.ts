import { Server } from 'http';
import type { AddressInfo } from 'net';
import { describe, beforeAll, afterAll, test } from 'vitest';
import { gotScraping, type OptionsInit } from '../src/index.js';
import { startDummyServer } from './helpers/dummy-server.js';

describe('Custom options', () => {
    let server: Server;
    let port: number;

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port;
    });

    afterAll(() => {
        server.close();
    });

    test('should move custom options to context', async (t) => {
        t.expect.assertions(2);

        const options: OptionsInit = {
            url: `http://localhost:${port}/html`,
            proxyUrl: 'http://localhost:8080',
            http2: false,
            headerGeneratorOptions: {
                browsers: [
                    {
                        name: 'firefox',
                    },
                ],
            },
            useHeaderGenerator: false,
            hooks: {
                beforeRequest: [
                    (opts) => {
                        t.expect(opts.context).toMatchObject({
                            proxyUrl: options.proxyUrl,
                            headerGeneratorOptions: options.headerGeneratorOptions,
                            useHeaderGenerator: false,
                        });

                        throw new Error('request aborted');
                    },
                ],
            },
        };
        try {
            await gotScraping(options);
        } catch (e: any) {
            t.expect(e.message).toBe('request aborted');
        }
    });
});
