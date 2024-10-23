/* eslint-disable max-classes-per-file */
import http, { ClientRequest, type ClientRequestArgs } from 'node:http';
import https from 'node:https';
import { isIPv6 } from 'node:net';
import tls, { type ConnectionOptions } from 'node:tls';
import { URL } from 'node:url';
import { buildBasicAuthHeader } from '../auth.js';

interface AgentOptions extends http.AgentOptions {
    proxy: string | URL;
    disableConnect?: boolean;
}

const initialize = (self: http.Agent & { proxy: URL }, options: AgentOptions) => {
    self.proxy = typeof options.proxy === 'string' ? new URL(options.proxy) : options.proxy;
};

const getPort = (url: URL): number => {
    if (url.port !== '') {
        return Number(url.port);
    }

    if (url.protocol === 'http:') {
        return 80;
    }

    if (url.protocol === 'https:') {
        return 443;
    }

    throw new Error(`Unexpected protocol: ${url.protocol}`);
};

export class HttpRegularProxyAgent extends http.Agent {
    proxy!: URL;

    constructor(options: AgentOptions) {
        super(options);

        initialize(this, options);
    }

    addRequest(request: ClientRequest, options: ClientRequestArgs): void {
        if (options.socketPath) {
            // @ts-expect-error @types/node is missing types
            super.addRequest(request, options);
            return;
        }

        let hostport = `${options.host}:${options.port}`;

        if (isIPv6(options.host!)) {
            hostport = `[${options.host}]:${options.port}`;
        }

        const url = new URL(`${request.protocol}//${hostport}${request.path}`);

        options = {
            ...options,
            host: this.proxy.hostname,
            port: getPort(this.proxy),
        };

        request.path = url.href;

        const basic = buildBasicAuthHeader(this.proxy);
        if (basic) {
            request.setHeader('proxy-authorization', basic);
        }

        // @ts-expect-error @types/node is missing types
        super.addRequest(request, options);
    }
}

export class HttpProxyAgent extends http.Agent {
    proxy!: URL;

    constructor(options: AgentOptions) {
        super(options);

        initialize(this, options);
    }

    createConnection(options: ConnectionOptions, callback: (error: Error | undefined, socket?: unknown) => void): void {
        if (options.path) {
            // @ts-expect-error @types/node is missing types
            super.createConnection(options, callback);
            return;
        }

        const fn = this.proxy.protocol === 'https:' ? https.request : http.request;

        let hostport = `${options.host}:${options.port}`;

        if (isIPv6(options.host!)) {
            hostport = `[${options.host}]:${options.port}`;
        }

        const headers: Record<string, string> = {
            host: hostport,
        };

        const basic = buildBasicAuthHeader(this.proxy);
        if (basic) {
            headers['proxy-authorization'] = basic;
            headers.authorization = basic;
        }

        const connectRequest = fn(this.proxy, {
            method: 'CONNECT',
            headers,
            path: hostport,
            agent: false,

            rejectUnauthorized: false,
        });

        connectRequest.once('connect', (response, socket, head) => {
            if (head.length > 0 || response.statusCode !== 200) {
                socket.destroy();

                const error = new Error(`The proxy responded with ${response.statusCode} ${response.statusMessage}: ${head.toString()}`);
                callback(error);
                return;
            }

            if ((options as any).protocol === 'https:') {
                callback(undefined, tls.connect({
                    ...options,
                    socket,
                }));
                return;
            }

            callback(undefined, socket);
        });

        connectRequest.once('error', (error) => {
            callback(error);
        });

        connectRequest.end();
    }
}

export class HttpsProxyAgent extends https.Agent {
    proxy!: URL;

    constructor(options: AgentOptions) {
        super(options);

        initialize(this, options);
    }

    createConnection(options: ConnectionOptions, callback: (error: Error | undefined, socket?: unknown) => void): void {
        HttpProxyAgent.prototype.createConnection.call(this, options, callback);
    }
}
