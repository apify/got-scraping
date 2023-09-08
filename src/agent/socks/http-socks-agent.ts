import { SocksProxyAgent } from 'socks-proxy-agent';

export class HttpSocksAgent extends SocksProxyAgent {
    override get protocol(): string {
        return 'http:';
    }

    override set protocol(value: string) {
        super.protocol = value;
    }
}
