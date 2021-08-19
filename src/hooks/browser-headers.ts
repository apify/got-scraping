import { URL } from 'url';
import { Options } from 'got-cjs';
import http2 from 'http2-wrapper';
import { Context } from '../context';
import { createResolveProtocol } from '../resolve-protocol';

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

export async function browserHeadersHook(options: Options): Promise<void> {
    const { context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
        proxyUrl,
    } = context as Context;

    if (!useHeaderGenerator || !headerGenerator) return;

    const url = options.url as URL;

    const resolveProtocol = proxyUrl ? createResolveProtocol(proxyUrl) : http2.auto.resolveProtocol;

    let alpnProtocol;
    if (url.protocol === 'https:') {
        alpnProtocol = (await resolveProtocol({
            host: url.hostname,
            port: url.port || 443,
            rejectUnauthorized: false,
            // @ts-expect-error Open an issue in http2-wrapper
            ALPNProtocols: ['h2', 'http/1.1'],
            servername: url.hostname,
        })).alpnProtocol;
    }

    const mergedHeaderGeneratorOptions = {
        httpVersion: alpnProtocol === 'h2' ? '2' : '1',
        ...headerGeneratorOptions,
    };

    const generatedHeaders = headerGenerator.getHeaders(mergedHeaderGeneratorOptions);

    // TODO: Remove this when Got supports Headers class.
    options.headers = mergeHeaders(generatedHeaders, options.headers as Record<string, string>);
}
