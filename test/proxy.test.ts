import { URL } from 'node:url';
import http2 from 'http2-wrapper';
import { vi, describe, beforeEach, afterEach, test } from 'vitest';
import {
    HttpsProxyAgent,
    HttpRegularProxyAgent,
    HttpProxyAgent,
} from '../src/agent/h1-proxy-agent.js';

import { proxyHook } from '../src/hooks/proxy.js';
import { TransformHeadersAgent } from '../src/agent/transform-headers-agent.js';
import { Options } from '../src/index.js';

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
        vi.restoreAllMocks();
    });

    test('should not add an agent if proxyUrl is not provided', async (t) => {
        await proxyHook(options);
        t.expect(options.agent).toBeUndefined();
    });

    test('should add an agent if proxyUrl is provided', async (t) => {
        vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'h2' });
        options.context.proxyUrl = 'http://localhost:132';

        await proxyHook(options);
        t.expect(options.agent).toBeDefined();
    });

    test('should throw on invalid proxy protocol', async (t) => {
        vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'h2' });
        options.context.proxyUrl = 'ftp://localhost:132';

        await t.expect(proxyHook(options))
            .rejects
            .toThrow(/is not supported. Please use HTTP or HTTPS./);
    });

    describe('agents', () => {
        test('should support http request over http proxy', async (t) => {
            options.context.proxyUrl = 'http://localhost:132';

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            t.expect((agent.http as any).agent).toBeInstanceOf(HttpRegularProxyAgent);
        });

        test('should support https request over http proxy', async (t) => {
            options.context.proxyUrl = 'http://localhost:132';
            vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            t.expect((agent.https as any).agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support http2 request over http proxy', async (t) => {
            options.context.proxyUrl = 'http://localhost:132';
            vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http2).toBeInstanceOf(Http2OverHttp);
        });

        test('should support http request over https proxy', async (t) => {
            options.context.proxyUrl = 'https://localhost:132';
            // vi.clearAllMocks();
            vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            t.expect((agent.http as any).agent).toBeInstanceOf(HttpProxyAgent);
        });

        test('should support https request over https proxy', async (t) => {
            options.context.proxyUrl = 'https://localhost:132';
            vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValue({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            t.expect((agent.https as any).agent).toBeInstanceOf(HttpsProxyAgent);
        });

        test('should support http2 request over https proxy', async (t) => {
            options.context.proxyUrl = 'https://localhost:132';

            const spy = vi.spyOn(http2.auto, 'resolveProtocol');
            spy.mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });
            spy.mockResolvedValueOnce({ alpnProtocol: 'h2' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http2).toBeInstanceOf(Http2OverHttps);
        });

        test('should support http request over http2 proxy', async (t) => {
            options.context.proxyUrl = 'https://localhost:132';
            vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValueOnce({ alpnProtocol: 'h2' });

            const { url } = options;

            options.url = new URL('http://example.com');
            await proxyHook(options);
            options.url = url;

            const { agent } = options;
            t.expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            t.expect((agent.http as any).agent).toBeInstanceOf(HttpOverHttp2);
        });

        test('should support https request over http2 proxy', async (t) => {
            options.context.proxyUrl = 'https://localhost:132';

            const spy = vi.spyOn(http2.auto, 'resolveProtocol');
            spy.mockResolvedValueOnce({ alpnProtocol: 'h2' });
            spy.mockResolvedValueOnce({ alpnProtocol: 'http/1.1' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http).toBeInstanceOf(TransformHeadersAgent);
            t.expect((agent.https as any).agent).toBeInstanceOf(HttpsOverHttp2);
        });

        test('should support http2 request over http2 proxy', async (t) => {
            options.context.proxyUrl = 'https://localhost:132';
            vi.spyOn(http2.auto, 'resolveProtocol').mockResolvedValue({ alpnProtocol: 'h2' });

            await proxyHook(options);

            const { agent } = options;
            t.expect(agent.http2).toBeInstanceOf(Http2OverHttp2);
        });
    });
});
