const http2 = require('http2-wrapper');
const HttpsProxyAgent = require('https-proxy-agent');
const HttpProxyAgent = require('http-proxy-agent');

const { proxyHook } = require('../src/hooks/proxy');
const httpResolver = require('../src/http-resolver');
const TransformHeadersAgent = require('../src/agent/transform-headers-agent');

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

describe('Proxy', () => {
    let options;
    beforeEach(() => {
        options = {
            context: {
                resolvedRequestProtocol: 'https',
            },
            https: {},
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should not add an agent if proxyUrl is not provided', async () => {
        await proxyHook(options);
        expect(options.agent).toBeUndefined();
    });

    test('should add an agent if proxyUrl is provided', async () => {
        jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');
        options.context.proxyUrl = 'http://localhost:132';

        await proxyHook(options);
        expect(options.agent).toBeDefined();
    });

    test('should throw on invalid proxy protocol', async () => {
        jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');
        options.context.proxyUrl = 'ftp://localhost:132';

        await expect(proxyHook(options))
            .rejects
            .toThrow(/is not supported. Please use HTTP or HTTPS./);
    });

    describe('agents', () => {
        test('should support http request over http proxy', async () => {
            options.context.proxyUrl = 'http://localhost:132';
            options.context.resolvedRequestProtocol = 'http';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect(agent.http.agent).toBeInstanceOf(HttpProxyAgent);
        });

        test('should support https request over http proxy', async () => {
            options.context.proxyUrl = 'http://localhost:132';
            options.context.resolvedRequestProtocol = 'https';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect(agent.https.agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support http2 request over http proxy', async () => {
            options.context.proxyUrl = 'http://localhost:132';
            options.context.resolvedRequestProtocol = 'http2';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

            await proxyHook(options);

            const { agent } = options;
            expect(agent).toBeInstanceOf(Http2OverHttp);
        });

        test('should support http request over https proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            options.context.resolvedRequestProtocol = 'http';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect(agent.http.agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support https request over https proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            options.context.resolvedRequestProtocol = 'https';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect(agent.https.agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support http2 request over https proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            options.context.resolvedRequestProtocol = 'http2';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

            await proxyHook(options);

            const { agent } = options;
            expect(agent).toBeInstanceOf(Http2OverHttps);
        });

        test('should support http request over http2 proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            options.context.resolvedRequestProtocol = 'http';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect(agent.http.agent).toBeInstanceOf(HttpOverHttp2);
        });

        test('should support https request over http2 proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            options.context.resolvedRequestProtocol = 'https';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect(agent.https.agent).toBeInstanceOf(HttpsOverHttp2);
        });

        test('should support http2 request over http2 proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            options.context.resolvedRequestProtocol = 'http2';
            jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');

            await proxyHook(options);

            const { agent } = options;
            expect(agent).toBeInstanceOf(Http2OverHttp2);
        });
    });
});
