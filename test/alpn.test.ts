import dns from 'node:dns';
import { describe, test } from 'vitest';
import { gotScraping, type OptionsInit } from '../src/index.js';

const testWithApifyProxy = process.env.APIFY_PROXY_PASSWORD ? test : test.skip;

describe('ALPN negotiation', () => {
    testWithApifyProxy('does not leak alpn', async (t) => {
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

        // eslint-disable-next-line no-console
        console.log('dns', dnsQueries);
        t.expect(dnsQueries.includes('api.apify.com')).toBe(false);

        dns.lookup = lookup;
    });
});
