import { Options } from 'got-cjs';
/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 * @param {object} original
 * @param {object} overrides
 * @returns
 */
export declare function mergeHeaders(original: Record<string, string>, overrides: Record<string, string>): Record<string, string>;
/**
 * @param {object} options
 */
export declare function browserHeadersHook(options: Options): Promise<void>;
