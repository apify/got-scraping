import http from 'node:http';
import https from 'node:https';
import type { AddressInfo, Socket } from 'node:net';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

import { describe, test } from 'vitest';
import { gotScraping, type OptionsInit } from '../src/index.js';

const TEST_TLS_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC/5j1R+CwYt+eV
xUN2GFC0GV9gGNNT0at+44+ODYxmzJvVtfni2/7nt1SMDU5E05rIA/8HDWTqzlE1
89/tTLLTL112xAnvSk6hAOTnBBnJ6UStlDUHeqTgU6GxqiFcFayUIOKVS/ZDkWwx
FTieyp27tfBe9Lo+CnsZw8HUQ1r8RU50sXDmPJQ+J+piEh9GWxuHhF4AeSWNBqT3
zlSSbbDmJFm9OivF1vIAwxUpLFHEF90MAcHYMW7Xb2LBxH1H/LEhdUAEloLdbQyb
gvtaAWaaGn61D5tGUlZ6UshudXq/trJoD8VJbzZ9HSSlWht1mPGf94gipOpX3PpZ
9vxs55UpAgMBAAECggEAASKn2LkO67uE0YBICKYWriYbSBqFf5C1QswuYIEIhGAw
CNjpiFPUY4MUazq17JbS6t2JL/2+i9waI2dUuxbx1OmKFEaPJ30JT48Ni6dczrLE
XwGKOcfaO2CLS52N0nlnWr4CES+QnrA402aEff4FZmOqbylkA7N0rH+ZwTt/yY/N
yCGFp9lVl91Q4ODs4cFbvPkdxMYNolOmWFr9xICRRVZ5MiOHsUbmi+PuvjFQ5iBf
KQfgbu41zDgLe+Ov6l1cnYe0PgwOZgqfq6C/lw5leQLJ0wXESxCV/wQ+I0N6qgtW
BBvhkXOz6Ta2sbOyI2yS29XY+H35Lb3SfICHU89VgQKBgQDwbD1S6/+Xr9oDtm/S
YPFIGhXKcM0zJcj/2UwL3CXbgkH0LVZna9ggTpLhtCGTttZh8S+W2D5cT4kOc5gh
U08hGa4K1f+5G6vTnmK1dddTSv70/YhTn4KslHFtCUKfkkaDMqJtKOqe2voqZ8NC
d+XJImUv8QIODFCOd/vtuWiA6QKBgQDMVSsjgmo/7pda59fvr5yqxSwQlJNqJbER
4wg6MQZ05UqGKzjhsZP67sb5HDQcVggEfqebh4ei1ejWFPOLStGOyAVrJ3Wl4Bwx
ZSoISi1bf8qa16dsEyq70j8BmfBjAIsMayNIZFd1MSgnr7b5QzaFJXYVSZsnv5Ta
leFr5g/KQQKBgConoF0AujD7iWtrOpIVo1i0EiwLuT8FmgeaLyZJNG4Xmb7ZkDPU
CfIoNMLUVarTvSUxJ9n4En8XBv38sKjvNYmlOgn2Wb84JdmWBNKyVc3p8Wg9aADZ
kAz4fibTH9ZgzHJGl4oySWkPFhwHU4o9AZJRsJJGXMjfyeQhD5AwGS25AoGAGevs
DxMqW3XvKY8j67pBi8B7uJbApMSnU/eTQZ6ajRXRgHfXPXqDpV/JSizzx2x6k+dl
Z+unn1a3tQDvbIpPT2e8mD1nRWXK7dFBpc+TNXpev4oAKUu9Lhqb954JyuV0vlyR
G0vvdGSKDY7TDYgjUHzSIB04W7CIN7qv4DpNYoECgYBK3tAa/fN89BVjc30Utf+n
U2dnMum1wDAEQVM6rq1IYhsEzYKxmofN0UHlB6JcvfQtm4kUSsqv8NYhoHfE0F5B
edR2tRNY0oEa8l6SSUWL5/l09dqErRDw7xcw4/WiJDvr5RtIZ/6qDNRibi3n4YvY
s6waGKiuAltfN0VEH7PjGA==
-----END PRIVATE KEY-----`;

const TEST_TLS_CERT = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUTY+m8VZQKxS/HuxrrHq5tPEkz1AwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDExMzA3MTkwMloXDTM2MDEx
MTA3MTkwMlowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAv+Y9UfgsGLfnlcVDdhhQtBlfYBjTU9GrfuOPjg2MZsyb
1bX54tv+57dUjA1ORNOayAP/Bw1k6s5RNfPf7Uyy0y9ddsQJ70pOoQDk5wQZyelE
rZQ1B3qk4FOhsaohXBWslCDilUv2Q5FsMRU4nsqdu7XwXvS6Pgp7GcPB1ENa/EVO
dLFw5jyUPifqYhIfRlsbh4ReAHkljQak985Ukm2w5iRZvTorxdbyAMMVKSxRxBfd
DAHB2DFu129iwcR9R/yxIXVABJaC3W0Mm4L7WgFmmhp+tQ+bRlJWelLIbnV6v7ay
aA/FSW82fR0kpVobdZjxn/eIIqTqV9z6Wfb8bOeVKQIDAQABo1MwUTAdBgNVHQ4E
FgQUI22Wfzhs03Dlvgj5a4hnKJ0y9NMwHwYDVR0jBBgwFoAUI22Wfzhs03Dlvgj5
a4hnKJ0y9NMwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAt9tf
I1/+oI2+YEyaRUl+FZEtUJEsWytqA/kWLM8pfKHX+MJug6LKLiDE4Ph7L08QolGO
VxH2vwCRfBJdArewAcZzWskFnMDNE07Y3fg+LtGvRSQQ6BMeAsIuEWLrBE23sqWO
2DFFFfBZ4Mzawp5oQs3+Jr1YiteyVglulihAHhy6hJEHrIa23sWW2nv6jHXqKzL6
LkadTuGWBQVQPz2AJJZyAxDLEIWkWfJsecrMe3Z74FBR6fSXwJoIpoKzljUdJyNa
1AZsqJ8Rg1zxpRQRwaOjUU6MsjAThzpv0lrXuxKRsNqmT1t5R2cUm3rKukw708Ak
i0QiSp3NS/dFY94vgA==
-----END CERTIFICATE-----`;

describe('resolve-protocol cache', () => {
    test(
        'does not share a hung ALPN resolve across proxy URLs when sessionData is nullish',
        async (t) => {
            const hangingSockets = new Set<Socket>();
            const proxySockets = new Set<Socket>();

            let hangingProxyConnectCount = 0;
            let workingProxyConnectCount = 0;

            const trackSocket = (set: Set<Socket>) => {
                return (socket: Socket) => {
                    set.add(socket);
                    socket.on('close', () => set.delete(socket));
                };
            };

            const httpsServer = https.createServer({ key: TEST_TLS_KEY, cert: TEST_TLS_CERT }, (_req, res) => {
                res.statusCode = 200;
                res.setHeader('content-type', 'text/plain; charset=utf-8');
                res.end('ok');
            });

            const hangingAuth = `Basic ${Buffer.from('hanging:pw').toString('base64')}`;
            const workingAuth = `Basic ${Buffer.from('working:pw').toString('base64')}`;

            const proxy = http.createServer();
            proxy.on('connection', trackSocket(proxySockets));
            proxy.on('connect', (req, clientSocket, head) => {
                const proxyAuthorization = req.headers['proxy-authorization'];
                if (proxyAuthorization === hangingAuth) {
                    hangingProxyConnectCount += 1;
                    // Keep the socket open, but never respond.
                    clientSocket.on('data', () => {});
                    return;
                }

                if (proxyAuthorization === workingAuth) {
                    workingProxyConnectCount += 1;
                }

                const [host, portStr] = (req.url ?? '').split(':');
                const port = portStr ? Number(portStr) : 443;

                const upstreamSocket = net.connect(port, host ?? '127.0.0.1', () => {
                    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                    if (head && head.length) upstreamSocket.write(head);
                    upstreamSocket.pipe(clientSocket);
                    clientSocket.pipe(upstreamSocket);
                });

                const destroyBoth = () => {
                    upstreamSocket.destroy();
                    clientSocket.destroy();
                };

                upstreamSocket.on('error', destroyBoth);
                clientSocket.on('error', destroyBoth);
            });

            try {
                await Promise.all([
                    // Bind on all interfaces so `localhost` can resolve to IPv4 or IPv6 without breaking the test.
                    new Promise<void>((resolve) => httpsServer.listen(0, resolve)),
                    new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve)),
                ]);

                const httpsUrl = `https://localhost:${(httpsServer.address() as AddressInfo).port}/`;
                const proxyPort = (proxy.address() as AddressInfo).port;
                const hangingProxyUrl = `http://hanging:pw@127.0.0.1:${proxyPort}`;
                const workingProxyUrl = `http://working:pw@127.0.0.1:${proxyPort}`;

                const baseOptions: OptionsInit = {
                    url: httpsUrl,
                    responseType: 'text',
                    https: { rejectUnauthorized: false },
                    // Ensure the request itself won't self-timeout before our test assertions.
                    timeout: { request: 60_000 },
                };

                // Start a request through a proxy that hangs on CONNECT/ALPN resolution.
                const first = gotScraping({ ...baseOptions, proxyUrl: hangingProxyUrl });
                first.catch(() => {});

                // Do not abort the request; we want the internal resolve promise to remain pending
                // and stay queued in the global queue (this is what poisons retries in the buggy behavior).
                await t.expect(
                    Promise.race([
                        first,
                        delay(250).then(() => {
                            throw new Error('outer timeout');
                        }),
                    ]),
                ).rejects.toThrow('outer timeout');

                // The second request uses a different proxy. It should not be blocked by the first hung resolve.
                const second = Promise.race([
                    gotScraping({ ...baseOptions, proxyUrl: workingProxyUrl }),
                    delay(2_000).then(() => {
                        throw new Error('outer timeout');
                    }),
                ]);

                const response = await second;
                t.expect(response.statusCode).toBe(200);
                t.expect(hangingProxyConnectCount).toBeGreaterThan(0);
                t.expect(workingProxyConnectCount).toBeGreaterThan(0);
            } finally {
                for (const socket of hangingSockets) socket.destroy();
                for (const socket of proxySockets) socket.destroy();

                await Promise.all([
                    new Promise<void>((resolve) => httpsServer.close(() => resolve())),
                    new Promise<void>((resolve) => proxy.close(() => resolve())),
                ]);
            }
        },
        20_000,
    );
});
