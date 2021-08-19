import tls, { TLSSocket } from 'tls';
import { URL } from 'url';
import { Headers } from 'got-cjs';
import { auto, ResolveProtocolConnectFunction, ResolveProtocolFunction } from 'http2-wrapper';
import QuickLRU from 'quick-lru';

const connect = async (proxyUrl: string, options: tls.ConnectionOptions, callback: () => void) => new Promise<TLSSocket>((resolve, reject) => {
    const host = `${options.host}:${options.port}`;

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
                rejectUnauthorized: false,
            });

            request.end();

            request.once('connect', (response, socket, head) => {
                if (response.statusCode !== 200 || head.length > 0) {
                    reject(new Error(`Proxy responded with ${response.statusCode}: ${head.length} bytes`));

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

// TODO: The cache should be storted in Agents

const protocolCache = new QuickLRU<string, string>({ maxSize: 1000 });
const resolveAlpnQueue = new Map();

export const createResolveProtocol = (proxyUrl: string): ResolveProtocolFunction => {
    const connectWithProxy: ResolveProtocolConnectFunction = async (pOptions, pCallback) => {
        return connect(proxyUrl, pOptions, pCallback);
    };

    return auto.createResolveProtocol(
        protocolCache as unknown as Map<string, string>,
        resolveAlpnQueue,
        connectWithProxy,
    );
};
