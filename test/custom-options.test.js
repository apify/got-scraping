import gotScraping from '../lib';
import { startDummyServer } from './helpers/dummy-server';

describe('Custom options', () => {
    let server;
    let port;

    beforeAll(async () => {
        server = await startDummyServer();
        port = server.address().port; //eslint-disable-line
    });

    afterAll(() => {
        server.close();
    });

    test('should move custom options to context', async () => {
        expect.assertions(2);

        const options = {
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
                        expect(opts.context).toMatchObject({
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
        } catch (e) {
            expect(e.message).toBe('request aborted');
        }
    });
});
