/// <reference types="node" />
import { ClientRequest, ClientRequestArgs } from 'http';
import { WrappedAgent } from './wrapped-agent';
/**
 * @description Transforms the casing of the headers to Pascal-Case.
 */
declare class TransformHeadersAgent extends WrappedAgent {
    /**
     * @description Transforms the request via header normalization.
     * @see {TransformHeadersAgent.toPascalCase}
     * @param {ClientRequest} request
     * @param {string[]} sortedHeaders - headers in order, optional
     */
    transformRequest(request: ClientRequest, sortedHeaders: string[]): void;
    addRequest(request: ClientRequest, options: ClientRequestArgs): any;
    /**
     * @param {string} header - header with unknown casing
     * @returns {string} - header in Pascal-Case
     */
    toPascalCase(header: string): string;
    /**
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param {string} a - header a
     * @param {string} b - header b
     * @param {string[]} sortedHeaders - array of headers in order
     * @returns header a or header b, depending which one is more important
     */
    sort(a: string, b: string, sortedHeaders: string[]): 0 | 1 | -1;
    /**
     *
     * @param {string[]} sortedHeaders - array of headers in order
     * @returns {Function} - sort function
     */
    createSort(sortedHeaders: string[]): (a: string, b: string) => 0 | 1 | -1;
}
export { TransformHeadersAgent };
