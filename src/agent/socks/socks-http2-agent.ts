import http2, { Agent } from 'http2-wrapper';
import tls from 'tls';
import { URL } from 'url';

import { SocksClient } from 'socks';

export class SocksHttp2Agent extends Agent {
    proxy: URL;

    constructor(options: {
        proxyOptions: {
            url: URL,
            rejectUnauthorized: boolean
        },
        maxFreeSockets: number,
        maxEmptySessions: number,
    }) {
        super(options);
        this.proxy = options.proxyOptions.url;
    }

    override async createConnection(origin: URL, options: http2.SecureClientSessionOptions): Promise<tls.TLSSocket> {
        const port = Number(origin.port) || 443;
        const host = origin.hostname;
        const { socket } = await SocksClient.createConnection({
            proxy: {
                host: this.proxy.hostname,
                port: parseInt(this.proxy.port, 10),
                password: decodeURIComponent(this.proxy.password),
                // determine type 4 or 5 based on protocol, may be different like socks4, socks5, socks5h, socks
                type: this.proxy.protocol.includes('4') ? 4 : 5,
            },
            command: 'connect',
            destination: {
                host,
                port,
            },
            existing_socket: options.socket,
            timeout: options.timeout,
        });
        return super.createConnection(origin, {
            ...options,
            socket,
        });
    }
}
