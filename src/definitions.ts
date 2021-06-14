import type { Options as GotOptions } from 'got-cjs';

export interface Options extends GotOptions {
    proxyUrl?: string,
    headerGeneratorOptions?: Record<string, any>,
    useHeaderGenerator?: boolean,
}
