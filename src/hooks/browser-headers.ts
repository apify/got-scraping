import { URL } from 'url';
import { Options } from 'got-cjs';
import http2 = require('http2-wrapper');

/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 * @param {object} original
 * @param {object} overrides
 * @returns
 */
export function mergeHeaders(original: Record<string, string>, overrides: Record<string, string>) {
    const fixedHeaders = new Map();

    for (const entry of Object.entries(original)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    for (const entry of Object.entries(overrides)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    const headers: Record<string, string> = {};
    for (const [key, value] of fixedHeaders.values()) {
        headers[key] = value;
    }

    return headers;
}

/**
 * @param {object} options
 */
export async function browserHeadersHook(options: Options) {
    const { context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
    } = context;

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

    const mergedHeaderGeneratorOptions: Record<string, string> = {
        httpVersion: alpnProtocol === 'h2' ? '2' : '1',
        ...(headerGeneratorOptions as {[key: string]: unknown}),
    };

    const generatedHeaders = (headerGenerator as any).getHeaders(mergedHeaderGeneratorOptions);

    // TODO: Remove this when Got supports Headers class.
    options.headers = mergeHeaders(generatedHeaders, options.headers as Record<string, string>);
}
