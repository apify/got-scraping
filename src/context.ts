import type { OptionsInit as GotOptionsInit } from 'got';

export type { GotOptionsInit };

export interface Context {
    proxyUrl?: string;
    headerGeneratorOptions?: Record<string, unknown>;
    useHeaderGenerator?: boolean;
    headerGenerator?: { getHeaders: (options: Record<string, unknown>) => Record<string, string> };
    insecureHTTPParser?: boolean;
    sessionToken?: object;
    /** @private */
    sessionData?: unknown;
    /** @private */
    resolveProtocol?: (data: unknown) => { alpnProtocol: string } | Promise<{ alpnProtocol: string }>;
}

export type OptionsInit = GotOptionsInit & Context;
