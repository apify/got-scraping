import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import { createSecureContext, type ConnectionOptions } from 'node:tls';
import { describe, afterEach, beforeEach, test } from 'vitest';

import { HttpProxyAgent } from '../src/agent/h1-proxy-agent.js';
import { tlsHook } from '../src/hooks/tls.js';
import type { Options } from '../src/index.js';

const USER_AGENTS = {
    chrome: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
} as const;

describe('TLS profiles on this runtime', () => {
    // A profile the runtime's TLS library cannot configure makes every request
    // that uses it throw (Bun 1.4 rejects the ffdhe groups Firefox offers).
    for (const [browser, userAgent] of Object.entries(USER_AGENTS)) {
        test(`the ${browser} profile builds a secure context`, (t) => {
            const options = { https: {}, headers: { 'user-agent': userAgent } } as unknown as Options;

            tlsHook(options);

            const { https } = options;
            t.expect(https.ciphers).toBeTruthy();
            t.expect(() => createSecureContext({
                ciphers: https.ciphers,
                sigalgs: https.signatureAlgorithms,
                ecdhCurve: https.ecdhCurve,
                minVersion: https.minVersion,
                maxVersion: https.maxVersion,
            })).not.toThrow();
        });
    }
});

describe('HTTP CONNECT proxy agent', () => {
    let proxy: http.Server;
    let proxyUrl: string;
    const sockets = new Set<Socket>();

    beforeEach(async () => {
        // Accepts every CONNECT and holds the tunnel open; the TLS handshake
        // never starts because the options below are rejected first.
        proxy = http.createServer();
        proxy.on('connect', (_request, socket: Socket) => {
            sockets.add(socket);
            socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        });
        await new Promise<void>((resolve) => { proxy.listen(0, '127.0.0.1', resolve); });
        proxyUrl = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
    });

    afterEach(async () => {
        for (const socket of sockets) socket.destroy();
        sockets.clear();
        await new Promise<void>((resolve) => { proxy.close(() => resolve()); });
    });

    test('reports invalid TLS options to the request instead of throwing', async (t) => {
        const agent = new HttpProxyAgent({ proxy: proxyUrl });
        const options = {
            host: 'example.com',
            port: 443,
            protocol: 'https:',
            ecdhCurve: 'not-a-real-curve',
        } as ConnectionOptions;

        const error = await new Promise<Error | undefined>((resolve) => {
            agent.createConnection(options, (err) => resolve(err));
        });

        t.expect(error).toBeInstanceOf(Error);
        agent.destroy();
    });
});
