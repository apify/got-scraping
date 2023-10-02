import { Options } from 'got';
import http2 from 'http2-wrapper';
import { URL } from 'node:url';
import type { Context } from '../context.js';
import { createResolveProtocol } from '../resolve-protocol.js';

/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 */
export function mergeHeaders(original: Record<string, string>, overrides: Record<string, string | undefined>): {[k: string]: string} {
    const fixedHeaders = new Map();

    for (const entry of Object.entries(original)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    for (const entry of Object.entries(overrides)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    return Object.fromEntries(fixedHeaders.values());
}

interface StoredHeaders {
    1: Record<string, string>;
    2: Record<string, string>;
}

interface HeadersData {
    headers?: StoredHeaders;
}

const getResolveProtocolFunction = (options: Options, proxyUrl: string | undefined, sessionData: unknown) => {
    const { resolveProtocol } = options as any;

    if (resolveProtocol) {
        return resolveProtocol;
    }

    if (proxyUrl) {
        return createResolveProtocol(proxyUrl, sessionData as any);
    }

    return http2.auto.resolveProtocol;
};

export async function browserHeadersHook(options: Options): Promise<void> {
    const { context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
        proxyUrl,
    } = context as Context;
    const sessionData = context.sessionData as HeadersData | undefined;

    if (!useHeaderGenerator || !headerGenerator) return;

    const createHeadersPair = () => ({
        1: headerGenerator.getHeaders({
            httpVersion: '1',
            ...headerGeneratorOptions,
        }),
        2: headerGenerator.getHeaders({
            httpVersion: '2',
            ...headerGeneratorOptions,
        }),
    });

    const url = options.url as URL;

    const resolveProtocol = getResolveProtocolFunction(options, proxyUrl, sessionData);

    let alpnProtocol;
    if (url.protocol === 'https:') {
        alpnProtocol = (await resolveProtocol({
            host: url.hostname,
            port: url.port || 443,
            rejectUnauthorized: false,
            ALPNProtocols: ['h2', 'http/1.1'],
            servername: url.hostname,
        })).alpnProtocol;
    }

    const httpVersion = alpnProtocol === 'h2' ? '2' : '1';

    let generatedHeaders: Record<string, string>;
    if (sessionData) {
        if (!sessionData.headers) {
            sessionData.headers = createHeadersPair();
        }

        generatedHeaders = sessionData.headers[httpVersion];
    } else {
        generatedHeaders = headerGenerator.getHeaders({
            httpVersion,
            ...headerGeneratorOptions,
        });
    }

    if (!options.decompress) {
        for (const key of Object.keys(generatedHeaders)) {
            if (key.toLowerCase() === 'accept-encoding') {
                delete generatedHeaders[key];
            }
        }
    }

    // TODO: Use `options.merge({headers: generatedHeaders})` instead
    options.headers = mergeHeaders(generatedHeaders, options.headers as Record<string, string>);
}
