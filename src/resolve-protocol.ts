import { isIPv6 } from 'node:net';
import tls, { TLSSocket } from 'node:tls';
import { URL } from 'node:url';
import { type Headers } from 'got';
import { auto, type ResolveProtocolConnectFunction, type ResolveProtocolFunction } from 'http2-wrapper';
import QuickLRU from 'quick-lru';

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
            const username = decodeURIComponent(url.username);
            const password = decodeURIComponent(url.password);

            if (username || password) {
                headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
                headers['proxy-authorization'] = headers.authorization;
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
                    reject(new Error(`Proxy responded with ${response.statusCode} ${response.statusMessage}: ${head.length} bytes.

Below is the first 100 bytes of the proxy response body:
${head.toString('utf8', 0, 100)}
`));
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
