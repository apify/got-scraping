/* eslint-disable no-underscore-dangle */
import HeaderGenerator from 'header-generator';
import http, { Agent, ClientRequest, ClientRequestArgs } from 'http';
import WrappedAgent from './wrapped-agent';

// @ts-expect-error Private property
const { _storeHeader } = http.OutgoingMessage.prototype;

const generator = new HeaderGenerator();

/**
 * @description Transforms the casing of the headers to Pascal-Case.
 */
class TransformHeadersAgent extends WrappedAgent {
    // Rewritten from https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L442-L479
    /**
     * @description Transforms the request via header normalization.
     * @see {TransformHeadersAgent.toPascalCase}
     * @param {http.ClientRequest} request
     * @param {boolean} sortHeaders - if the headers should be sorted or not
     */
    transformRequest(request, sortHeaders) {
        const headers: Record<string, string | number | string[]> = {};
        const hasConnection = request.hasHeader('connection');
        const hasContentLength = request.hasHeader('content-length');
        const hasTransferEncoding = request.hasHeader('transfer-encoding');
        const hasTrailer = request.hasHeader('trailer');
        const keys = request.getHeaderNames();

        for (const key of keys) {
            if (key.toLowerCase().startsWith('x-')) {
                headers[key] = request.getHeader(key)!;
            } else {
                headers[this.toPascalCase(key)] = request.getHeader(key)!;
            }

            if (sortHeaders) {
                // Removal is required in order to change the order of the properties
                request.removeHeader(key);
            }
        }

        const typedRequest = request as ClientRequest & {
            _removedContLen: boolean;
            _contentLength: number;
            _removedTE: boolean;
            agent?: Agent;
        };

        if (!hasConnection) {
            const shouldSendKeepAlive = request.shouldKeepAlive && (hasContentLength || request.useChunkedEncodingByDefault || typedRequest.agent);
            if (shouldSendKeepAlive) {
                headers['Connection'] = 'keep-alive';
            } else {
                headers['Connection'] = 'close';
            }
        }

        if (!hasContentLength && !hasTransferEncoding) {
            // Note: This uses private `_removedContLen` property.
            //       This property tells us whether the content-length was explicitly removed or not.
            //
            // Note: This uses private `_removedTE` property.
            //       This property tells us whether the transfer-encoding was explicitly removed or not.
            if (!hasTrailer && !typedRequest._removedContLen && typeof typedRequest._contentLength === 'number') {
                headers['Content-Length'] = typedRequest._contentLength;
            } else if (!typedRequest._removedTE) {
                headers['Transfer-Encoding'] = 'chunked';
            }
        }

        const transformedHeaders = sortHeaders ? generator.orderHeaders(headers) : headers;

<<<<<<< HEAD
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in transformedHeaders) {
            request.setHeader(key, transformedHeaders[key]);
=======
        for (const key of sorted) {
            request.setHeader(key, headers[key]!);
>>>>>>> e1a2804 (Fix TypeScript errors)
        }
    }

    override addRequest(request: ClientRequest, options: ClientRequestArgs) {
        const typedRequest = request as ClientRequest & {
            _storeHeader: (firstLine: string, headers: Record<string, string>) => void;
        };

        // See https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L373
        // Note: This overrides the private `_storeHeader`.
        //       This is required, because the function copies
        //       the `connection`, `content-length` and `trasfer-encoding` headers
        //       directly to the underlying buffer.
<<<<<<< HEAD
        request._storeHeader = (...args) => {
            this.transformRequest(request, true);
=======
        typedRequest._storeHeader = (...args) => {
            this.transformRequest(request, (options as any).sortedHeaders);
>>>>>>> e1a2804 (Fix TypeScript errors)

            return _storeHeader.call(request, ...args);
        };

        // `agent-base` isn't able to detect the protocol correctly
        (options as any).secureEndpoint = options.protocol === 'https:';

        return super.addRequest(request, options);
    }

    /**
     * @param {string} header - header with unknown casing
     * @returns {string} - header in Pascal-Case
     */
    toPascalCase(header: string) {
        return header.split('-').map((part) => {
            return part[0]!.toUpperCase() + part.slice(1).toLowerCase();
        }).join('-');
    }
<<<<<<< HEAD
=======

    /**
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param {string} a - header a
     * @param {string} b - header b
     * @param {string[]} sortedHeaders - array of headers in order
     * @returns header a or header b, depending which one is more important
     */
    sort(a: string, b: string, sortedHeaders: string[]) {
        const rawA = sortedHeaders.indexOf(a);
        const rawB = sortedHeaders.indexOf(b);
        const indexA = rawA === -1 ? Number.POSITIVE_INFINITY : rawA;
        const indexB = rawB === -1 ? Number.POSITIVE_INFINITY : rawB;

        if (indexA < indexB) {
            return -1;
        }

        if (indexA > indexB) {
            return 1;
        }

        return 0;
    }

    /**
     *
     * @param {string[]} sortedHeaders - array of headers in order
     * @returns {Function} - sort function
     */
    createSort(sortedHeaders: string[]) {
        const sortWithSortedHeaders = (a: string, b: string) => this.sort(a, b, sortedHeaders);

        return sortWithSortedHeaders;
    }
>>>>>>> e1a2804 (Fix TypeScript errors)
}

export default TransformHeadersAgent;
