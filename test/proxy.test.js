import { proxies } from 'http2-wrapper';
import HttpsProxyAgent from 'https-proxy-agent';
import HttpProxyAgent from 'http-proxy-agent';

import { proxyHandler } from '../lib/handlers/proxy';
import httpResolver from '../lib/http-resolver';

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = proxies;

describe('Proxy', () => {
    let next;
    let options;
    beforeEach(() => {
        options = {
            context: {},
            https: {},
        };
        next = () => { };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should modify agents only if proxyUrl provided', async () => {
        await proxyHandler(options, next);
        expect(options.agent).toBeUndefined();

        jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');
        options.context.proxyUrl = 'http://localhost:132';

        await proxyHandler(options, next);
        expect(options.agent).toBeDefined();
    });

    test('should throw on invalid proxy protocol', async () => {
        jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');
        options.context.proxyUrl = 'ftp://localhost:132';

        await expect(proxyHandler(options, next))
            .rejects
            .toThrow(/is not supported. Please use HTTP or HTTPS./);
    });

    describe('agents', () => {
        test('should support http proxy via http2, https and http', async () => {
            options.context.proxyUrl = 'http://localhost:132';

            await proxyHandler(options, next);

            const { agent } = options;
            expect(agent.http2).toBeInstanceOf(Http2OverHttp);
            expect(agent.https).toBeInstanceOf(HttpsProxyAgent);
            expect(agent.http).toBeInstanceOf(HttpProxyAgent);
        });

        test('should support https proxy via http2', async () => {
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');

            options.context.proxyUrl = 'https://localhost:132';

            await proxyHandler(options, next);

            const { agent } = options;
            expect(agent.http2).toBeInstanceOf(Http2OverHttp2);
            expect(agent.https).toBeInstanceOf(HttpsOverHttp2);
            expect(agent.http).toBeInstanceOf(HttpOverHttp2);
        });

        test('should support https proxy via http 1.1', async () => {
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('1.1');

            options.context.proxyUrl = 'https://localhost:132';

            await proxyHandler(options, next);

            const { agent } = options;
            expect(agent.http2).toBeInstanceOf(Http2OverHttps);
            expect(agent.https).toBeInstanceOf(HttpsProxyAgent);
            expect(agent.http).toBeInstanceOf(HttpsProxyAgent);
        });
    });
});
