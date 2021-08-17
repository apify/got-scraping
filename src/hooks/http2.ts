import tls, { TLSSocket } from 'tls';
import { URL } from 'url';
import { Headers, Options } from 'got-cjs';
import { auto, AutoRequestOptions, ResolveProtocolConnectFunction } from 'http2-wrapper';
import QuickLRU from 'quick-lru';
import { Context } from '../context';

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

            request.once('connect', (_response, socket, head) => {
                if (head.length > 0) {
                    reject(new Error(`Unexpected data before CONNECT tunnel: ${head.length} bytes`));

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

const protocolCache = new QuickLRU<string, string>({ maxSize: 1000 });
const resolveAlpnQueue = new Map();

export function http2Hook(options: Options): void {
    const { proxyUrl } = options.context as Context;

    if (options.http2 && (options.url as URL).protocol !== 'http:') {
        options.request = (url, requestOptions, callback) => {
            const typedRequestOptions = requestOptions as AutoRequestOptions;

            if (proxyUrl) {
                const connectWithProxy: ResolveProtocolConnectFunction = async (pOptions, pCallback) => {
                    return connect(proxyUrl, pOptions, pCallback);
                };

                typedRequestOptions.resolveProtocol = auto.createResolveProtocol(
                    protocolCache as unknown as Map<string, string>,
                    resolveAlpnQueue,
                    connectWithProxy,
                );
            }

            return auto(url, typedRequestOptions, callback);
        };
    }
}
