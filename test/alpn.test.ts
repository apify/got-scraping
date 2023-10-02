import dns from 'node:dns';
import { gotScraping, type OptionsInit } from '../src/index.js';

describe('ALPN negotiation', () => {
    test('does not leak alpn', async () => {
        const dnsQueries: string[] = [];
        const { lookup } = dns;

        // @ts-expect-error TypeScript is weird
        dns.lookup = (...args) => {
            dnsQueries.push(args[0]);

            // @ts-expect-error TypeScript is weird
            return lookup(...args);
        };

        const proxyPromise = gotScraping({
            responseType: 'json',
            url: 'https://api.apify.com/v2/browser-info',
            proxyUrl: `http://groups-SHADER:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
        } as OptionsInit);

        await proxyPromise;

        console.log('dns', dnsQueries);
        expect(dnsQueries.includes('api.apify.com')).toBe(false);

        dns.lookup = lookup;
    });
});
