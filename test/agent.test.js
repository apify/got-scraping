const http = require('http');
const getStream = require('get-stream');
const TransformHeadersAgent = require('../src/agent/transform-headers-agent');

const agent = new http.Agent({
    keepAlive: true,
});

const { startDummyServer } = require('./helpers/dummy-server');

describe('TransformHeadersAgent', () => {
    let server;
    let port;

    beforeAll(async () => {
        server = await startDummyServer();
        port = server.address().port;
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
            expect(headers.Connection).toBe('close');

            done();
        });

        const transformAgent = new TransformHeadersAgent(agent);
        transformAgent.transformRequest(request);

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

    test('sorted headers', (done) => {
        const transformAgent = new TransformHeadersAgent(new http.Agent({
            keepAlive: true,
        }));

        const request = http.request(`http://localhost:${port}/headers`, {
            agent: transformAgent,
            sortedHeaders: ['Connection'],
        }, async (response) => {
            const body = await getStream(response);
            const headers = JSON.parse(body);

            expect(Object.keys(headers)[0]).toBe('Connection');
            expect(headers.Connection).toBe('keep-alive');

            transformAgent.destroy();

            done();
        });

        request.end();
    });

    describe('respects native behavior', () => {
        test('transfer-encoding removal', (done) => {
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
