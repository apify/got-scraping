import { URL } from 'url';
import { Options } from 'got-cjs';
import http2 from 'http2-wrapper';
import { Context } from '../context';

/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 */
export function mergeHeaders(original: Record<string, string>, overrides: Record<string, string>) {
    const fixedHeaders = new Map();

    for (const entry of Object.entries(original)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    for (const entry of Object.entries(overrides)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    return Object.fromEntries(fixedHeaders.values());
}

export async function browserHeadersHook(options: Options) {
    const { context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
    } = context as unknown as Context;

    if (!useHeaderGenerator) return;

    const url = options.url as URL;

    let alpnProtocol;
    if (url.protocol === 'https:') {
        alpnProtocol = (await http2.auto.resolveProtocol({
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

    const generatedHeaders = (headerGenerator as any).getHeaders(mergedHeaderGeneratorOptions);

    // TODO: Remove this when Got supports Headers class.
    options.headers = mergeHeaders(generatedHeaders, options.headers as Record<string, string>);
}
