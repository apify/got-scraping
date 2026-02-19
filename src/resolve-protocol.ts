import { createHash } from 'node:crypto';
import { isIPv6 } from 'node:net';
import tls, { TLSSocket } from 'node:tls';
import { URL } from 'node:url';
import { type Headers } from 'got';
import http2Wrapper, { type ResolveProtocolConnectFunction, type ResolveProtocolFunction } from 'http2-wrapper';

const { auto } = http2Wrapper;
import QuickLRU from 'quick-lru';
import { ProxyError } from './hooks/proxy.js';
import { buildBasicAuthHeader } from './auth.js';

const connect = async (proxyUrl: string, options: tls.ConnectionOptions, callback: () => void) => new Promise<TLSSocket>((resolve, reject) => {
    let host = `${options.host}:${options.port}`;

    if (isIPv6(options.host!)) {
        host = `[${options.host}]:${options.port}`;
    }

    void (async () => {
        try {
            const headers: Headers = {
                host,
            };

            const url = new URL(proxyUrl);
            const basic = buildBasicAuthHeader(url);

            if (basic) {
                headers.authorization = basic;
                headers['proxy-authorization'] = basic;
            }

            const request = await auto(url, {
                method: 'CONNECT',
                headers,
                path: host,
                // TODO: this property doesn't exist according to the types
                pathname: host,
                rejectUnauthorized: false,
            } as never);

            request.end();

            request.once('error', reject);

            request.once('connect', (response, socket, head) => {
                if (response.statusCode !== 200 || head.length > 0) {
                    reject(new ProxyError(`Proxy responded with ${response.statusCode} ${response.statusMessage}: ${head.length} bytes.

Below is the first 100 bytes of the proxy response body:
${head.toString('utf8', 0, 100)}`, { cause: head.toString('utf8') }));
                    socket.destroy();
                    return;
                }

                const tlsSocket = tls.connect({
                    ...options,
                    socket,
                }, callback);

                resolve(tlsSocket);
            });
        } catch (error) {
            reject(error);
        }
    })();
});

const createCaches = () => ({
    protocolCache: new QuickLRU<string, string>({ maxSize: 1000 }),
    resolveAlpnQueue: new Map(),
});

type ProtocolCaches = ReturnType<typeof createCaches>;

// When `sessionData` is not provided, got-scraping previously used a single global
// `resolveAlpnQueue`. That queue key does not include the proxy URL, so a hanging
// proxy CONNECT/ALPN resolve could poison retries that rotate proxies.
//
// We keep this intentionally simple (got-scraping is EOL): use a bounded per-proxy cache.
const PROTOCOL_CACHE_BY_PROXY_URL = new QuickLRU<string, ProtocolCaches>({ maxSize: 100 });

const defaults = createCaches();

export interface ProtocolCache {
    protocolCache?: typeof defaults.protocolCache;
    resolveAlpnQueue?: typeof defaults.resolveAlpnQueue;
}

export const createResolveProtocol = (proxyUrl: string, sessionData?: ProtocolCache, timeout?: number): ResolveProtocolFunction => {
    let { protocolCache, resolveAlpnQueue } = defaults;

    if (sessionData) {
        if (!sessionData.protocolCache || !sessionData.resolveAlpnQueue) {
            Object.assign(sessionData, createCaches());
        }

        protocolCache = sessionData.protocolCache!;
        resolveAlpnQueue = sessionData.resolveAlpnQueue!;
    } else {
        // Scope the ALPN resolve queue to the proxy URL so a hung proxy doesn't block resolution through other proxies.
        // IMPORTANT: Do not use `URL.href` here because it includes credentials (username/password).
        // Keeping secrets in long-lived global caches increases exposure (heap dumps, logs, etc).
        //
        // We still want to isolate caches for different "proxy identities" (including credentials) because some
        // providers rotate upstreams based on username/password/session. Use a stable hash of the canonicalized URL
        // so we keep isolation without storing secrets in cleartext.
        // Use the raw input string to avoid throwing here when `proxyUrl` is invalid.
        // (Invalid `proxyUrl` will still fail later when we actually try to use it.)
        const cacheKey = createHash('sha256').update(proxyUrl).digest('hex');
        const perProxyCaches = PROTOCOL_CACHE_BY_PROXY_URL.get(cacheKey) ?? createCaches();
        PROTOCOL_CACHE_BY_PROXY_URL.set(cacheKey, perProxyCaches);
        ({ protocolCache, resolveAlpnQueue } = perProxyCaches);
    }

    const connectWithProxy: ResolveProtocolConnectFunction = async (pOptions, pCallback) => {
        return connect(proxyUrl, pOptions, pCallback);
    };

    const resolveProtocol: ResolveProtocolFunction = auto.createResolveProtocol(
        protocolCache as unknown as Map<string, string>,
        resolveAlpnQueue,
        connectWithProxy,
    );

    return async (...args: Parameters<ResolveProtocolFunction>) => resolveProtocol({
        ...args[0],
        timeout,
    });
};
