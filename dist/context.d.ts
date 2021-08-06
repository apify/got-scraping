import { OptionsInit as GotOptionsInit } from 'got-cjs';
export { GotOptionsInit };
export interface Context {
    proxyUrl?: string;
    headerGeneratorOptions: unknown;
    useHeaderGenerator?: boolean;
}
export interface OptionsInit extends Context, GotOptionsInit {
}
