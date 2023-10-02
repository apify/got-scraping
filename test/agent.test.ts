import type { AddressInfo } from 'node:net';
import http, { Server } from 'node:http';
import getStream from 'get-stream';
import { TransformHeadersAgent } from '../src/agent/transform-headers-agent.js';
import { startDummyServer } from './helpers/dummy-server.js';

const NODE_MAJOR_VERSION = parseInt(process.versions.node.split('.')[0], 10);

const agent = new http.Agent({
    keepAlive: true,
});

describe('TransformHeadersAgent', () => {
    let server: Server;
    let port: number;

    beforeAll(async () => {
        server = await startDummyServer();
        port = (server.address() as AddressInfo).port;
    });

    afterAll(() => {
        server.close();
    });

    test('Pascal-Case', () => {
        const transformAgent = new TransformHeadersAgent(agent);

        expect(transformAgent.toPascalCase('connection')).toBe('Connection');
        expect(transformAgent.toPascalCase('user-agent')).toBe('User-Agent');
    });

    test('transformRequest', (done) => {
        const requestHeaders = {
            cookie: 'test=1',
            'user-agent': 'not a chrome',
        };

        const request = http.request(`http://localhost:${port}/headers`, {
            headers: requestHeaders,
        }, async (response) => {
            const body = await getStream(response);
            const headers = JSON.parse(body);

            expect(headers.Cookie).toBe(requestHeaders.cookie);
            expect(headers['User-Agent']).toBe(requestHeaders['user-agent']);
            if (NODE_MAJOR_VERSION >= 19) {
                expect(headers.Connection).toBe('keep-alive');
            } else {
                expect(headers.Connection).toBe('close');
            }

            done();
        });

        const transformAgent = new TransformHeadersAgent(agent);
        transformAgent.transformRequest(request, { sortHeaders: true });

        request.end();
    });

    test('leaves x-header as it is', (done) => {
        const request = http.request(`http://localhost:${port}/headers`, {
            headers: {
                'x-foo': 'bar',
                'x-this-doesnt-exist': 'definitely',
            },
        }, async (response) => {
            const body = await getStream(response);
            const headers = JSON.parse(body);

            expect(headers['x-foo']).toBe('bar');
            expect(headers['x-this-doesnt-exist']).toBe('definitely');

            done();
        });

        const transformAgent = new TransformHeadersAgent(agent);
        transformAgent.transformRequest(request, { sortHeaders: true });

        request.end();
    });

    test('http.request with agent', (done) => {
        const transformAgent = new TransformHeadersAgent(new http.Agent({
            keepAlive: true,
        }));

        const request = http.request(`http://localhost:${port}/headers`, {
            agent: transformAgent,
        }, async (response) => {
            const body = await getStream(response);
            const headers = JSON.parse(body);

            expect(headers.Connection).toBe('keep-alive');

            transformAgent.destroy();

            done();
        });

        request.end();
    });

    test('first header in sortedHeaders is always first', (done) => {
        const transformAgent = new TransformHeadersAgent(new http.Agent({
            keepAlive: true,
        }));

        const request = http.request(`http://localhost:${port}/headers`, {
            agent: transformAgent,
        }, async (response) => {
            const body = await getStream(response);
            const headers = JSON.parse(body);

            expect(Object.keys(headers)[0]).toBe('Host');
            expect(headers.Host).toBe(`localhost:${port}`);

            transformAgent.destroy();

            done();
        });

        request.end();
    });

    describe('respects native behavior', () => {
        test('content-length removal', (done) => {
            const transformAgent = new TransformHeadersAgent(new http.Agent({
                keepAlive: true,
            }));

            const request = http.request(`http://localhost:${port}/headers`, {
                agent: transformAgent,
            }, async (response) => {
                const body = await getStream(response);
                const headers = JSON.parse(body);

                expect(headers['Transfer-Encoding']).toBe('chunked');

                transformAgent.destroy();

                done();
            });

            request.removeHeader('content-length');

            request.end();
        });

        test('transfer-encoding removal', (done) => {
            const transformAgent = new TransformHeadersAgent(new http.Agent({
                keepAlive: true,
            }));

            const request = http.request(`http://localhost:${port}/headers`, {
                agent: transformAgent,
            }, async (response) => {
                const body = await getStream(response);
                const headers = JSON.parse(body);

                expect(headers['Transfer-Encoding']).toBe(undefined);
                expect(headers['Content-Length']).toBe(undefined);

                transformAgent.destroy();

                done();
            });

            request.removeHeader('content-length');
            request.removeHeader('transfer-encoding');

            request.end();
        });

        test('explicit content-length', (done) => {
            const transformAgent = new TransformHeadersAgent(new http.Agent({
                keepAlive: true,
            }));

            const request = http.request(`http://localhost:${port}/headers`, {
                agent: transformAgent,
                headers: {
                    'content-length': 5,
                },
            }, async (response) => {
                const body = await getStream(response);
                const headers = JSON.parse(body);

                expect(headers['Content-Length']).toBe('5');

                transformAgent.destroy();

                done();
            });

            request.write('hello');
            request.end();
        });

        test('explicit connection', (done) => {
            const transformAgent = new TransformHeadersAgent(new http.Agent({
                keepAlive: true,
            }));

            const request = http.request(`http://localhost:${port}/headers`, {
                agent: transformAgent,
                headers: {
                    connection: 'close',
                },
            }, async (response) => {
                const body = await getStream(response);
                const headers = JSON.parse(body);

                expect(headers.Connection).toBe('close');

                transformAgent.destroy();

                done();
            });

            request.end();
        });
    });
});
