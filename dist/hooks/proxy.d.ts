import QuickLRU = require('quick-lru');
import { Options } from 'got-cjs';
/**
 * @param {object} options
 */
export declare function proxyHook(options: Options): Promise<void>;
export declare const agentCache: QuickLRU<unknown, unknown>;
