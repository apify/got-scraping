import { isIPv6 } from 'net';
import tls, { TLSSocket } from 'tls';
import { URL } from 'url';
import { Headers } from 'got-cjs';
import { auto, ResolveProtocolConnectFunction, ResolveProtocolFunction } from 'http2-wrapper';
import QuickLRU from 'quick-lru';
import { SocksClient } from 'socks';

const connectSocks = async (proxyUrl: string, options: tls.ConnectionOptions, callback: () => void) => {
    const url = new URL(proxyUrl);
    const {socket} = await SocksClient.createConnection({
        proxy: {
            host: url.hostname,
            port: parseInt(url.port, 10),
            password: decodeURIComponent(url.password),
            // determine type 4 or 5 based on protocol, may be different like socks4, socks5, socks5h, socks
            type: url.protocol.includes('4') ? 4 : 5,
        },
        command: 'connect',
        destination: {
            host: options.host!,
            port: options.port!,
        },
        existing_socket: options.socket,
        timeout: options.timeout,
    });
    return tls.connect({
        ...options,
        socket,
    }, callback);
};

const connectHttp = async (proxyUrl: string, options: tls.ConnectionOptions, callback: () => void) => new Promise<TLSSocket>((resolve, reject) => {
    let host = `${options.host}:${options.port}`;

    if (isIPv6(options.host!)) {
        host = `[${options.host}]:${options.port}`;
    }

    (async () => {
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
                pathname: host,
                rejectUnauthorized: false,
            } as any);

            request.end();

            request.once('error', reject);

            request.once('connect', (response, socket, head) => {
                if (response.statusCode !== 200 || head.length > 0) {
                    reject(new Error(`Proxy responded with ${response.statusCode} ${response.statusMessage}: ${head.length} bytes`));

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

interface ProtocolCache {
    protocolCache?: typeof defaults.protocolCache;
    resolveAlpnQueue?: typeof defaults.resolveAlpnQueue;
}

export const createResolveProtocol = (proxyUrl: string, sessionData?: ProtocolCache): ResolveProtocolFunction => {
    let { protocolCache, resolveAlpnQueue } = defaults;

    if (sessionData) {
        if (!sessionData.protocolCache || !sessionData.resolveAlpnQueue) {
            Object.assign(sessionData, createCaches());
        }

        protocolCache = sessionData.protocolCache!;
        resolveAlpnQueue = sessionData.resolveAlpnQueue!;
    }

    const connectWithProxy: ResolveProtocolConnectFunction = async (pOptions, pCallback) => {
        return (proxyUrl.startsWith('http') ? connectHttp : connectSocks)(proxyUrl, pOptions, pCallback);
    };

    return auto.createResolveProtocol(
        protocolCache as unknown as Map<string, string>,
        resolveAlpnQueue,
        connectWithProxy,
    );
};
