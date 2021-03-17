const http2 = require('http2-wrapper');
const HttpsProxyAgent = require('https-proxy-agent');
const HttpProxyAgent = require('http-proxy-agent');

const { proxyHandler } = require('../src/handlers/proxy');
const httpResolver = require('../src/http-resolver');

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

describe('Proxy', () => {
    let next;
    let options;
    beforeEach(() => {
        options = {
            context: {},
            https: {},
        };
        next = () => {};
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

        expect(proxyHandler(options, next)).toReject(expect.stringContaining('Invalid proxy protocol'));
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
