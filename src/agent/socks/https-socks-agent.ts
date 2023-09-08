import { SocksProxyAgent } from 'socks-proxy-agent';

export class HttpsSocksAgent extends SocksProxyAgent {
    override get protocol(): string {
        return 'https:';
    }

    override set protocol(value: string) {
        super.protocol = value;
    }
}
