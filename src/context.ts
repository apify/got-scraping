import { OptionsInit as GotOptionsInit } from 'got-cjs';

export { GotOptionsInit };

export interface Context extends Record<string, unknown> {
    proxyUrl?: string;
    headerGeneratorOptions?: Record<string, unknown>;
    useHeaderGenerator?: boolean;
    headerGenerator?: { getHeaders: (options: Record<string, unknown>) => Record<string, string> };
    insecureHTTPParser?: boolean;
}

export interface OptionsInit extends Context, GotOptionsInit {}
