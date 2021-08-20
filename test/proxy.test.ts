import { URL } from 'url';
import http2 from 'http2-wrapper';
import {
    HttpsProxyAgent,
    HttpRegularProxyAgent,
} from '../src/agent/h1-proxy-agent';

import { proxyHook, agentCache } from '../src/hooks/proxy';
import { TransformHeadersAgent } from '../src/agent/transform-headers-agent';
import { Options } from '../src';

const {
    HttpOverHttp2,
    HttpsOverHttp2,
    Http2OverHttp2,
    Http2OverHttps,
    Http2OverHttp,
} = http2.proxies;

describe('Proxy', () => {
    let options: Options;
    beforeEach(() => {
        options = {
            context: {},
            https: {},
            url: new URL('https://example.com'),
        } as Options;
    });

    afterEach(() => {
        // Do not use clearAllMocks: https://github.com/facebook/jest/issues/7136
        jest.restoreAllMocks();

        agentCache.clear();
    });

    test('should not add an agent if proxyUrl is not provided', async () => {
        await proxyHook(options);
        expect(options.agent).toBeUndefined();
    });

    test('should add an agent if proxyUrl is provided', async () => {
        jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'h2' });
        options.context.proxyUrl = 'http://localhost:132';

        await proxyHook(options);
        expect(options.agent).toBeDefined();
    });

    test('should throw on invalid proxy protocol', async () => {
        jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'h2' });
        options.context.proxyUrl = 'ftp://localhost:132';

        await expect(proxyHook(options))
            .rejects
            .toThrow(/is not supported. Please use HTTP or HTTPS./);
    });

    describe('agents', () => {
        test('should support http request over http proxy', async () => {
            options.context.proxyUrl = 'http://localhost:132';

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect((agent.http as any).agent).toBeInstanceOf(HttpRegularProxyAgent);
        });

        test('should support https request over http proxy', async () => {
            options.context.proxyUrl = 'http://localhost:132';
            jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect((agent.https as any).agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support http2 request over http proxy', async () => {
            options.context.proxyUrl = 'http://localhost:132';
            jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http2).toBeInstanceOf(Http2OverHttp);
        });

        test('should support http request over https proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            // jest.clearAllMocks();
            jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect((agent.http as any).agent).toBeInstanceOf(HttpRegularProxyAgent);
        });

        test('should support https request over https proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValue({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect((agent.https as any).agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support http2 request over https proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';

            const spy = jest.spyOn(http2.auto, 'resolveProtocol');
            spy.mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });
            spy.mockResolvedValueOnce({ alpnProtocol: 'h2' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http2).toBeInstanceOf(Http2OverHttps);
        });

        test('should support http request over http2 proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'h2' });

            const { url } = options;

            options.url = new URL('http://example.com');
            await proxyHook(options);
            options.url = url;

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect((agent.http as any).agent).toBeInstanceOf(HttpOverHttp2);
        });

        test('should support https request over http2 proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';

            const spy = jest.spyOn(http2.auto, 'resolveProtocol');
            spy.mockResolvedValueOnce({ alpnProtocol: 'h2' });
            spy.mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            expect((agent.https as any).agent).toBeInstanceOf(HttpsOverHttp2);
        });

        test('should support http2 request over http2 proxy', async () => {
            options.context.proxyUrl = 'https://localhost:132';
            jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValue({ alpnProtocol: 'h2' });

            await proxyHook(options);

            const { agent } = options;
            expect(agent.http2).toBeInstanceOf(Http2OverHttp2);
        });
    });
});
