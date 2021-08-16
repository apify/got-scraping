import { OptionsInit as GotOptionsInit } from 'got-cjs';

export { GotOptionsInit };

export interface Context extends Record<string, unknown> {
    proxyUrl?: string;
    headerGeneratorOptions?: Record<string, unknown>;
    useHeaderGenerator?: boolean;
    headerGenerator?: unknown;
    insecureHTTPParser?: boolean;
}

export interface OptionsInit extends Context, GotOptionsInit {}
