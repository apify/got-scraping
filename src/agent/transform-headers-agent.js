/* eslint-disable no-underscore-dangle */
const http = require('http');
const WrappedAgent = require('./wrapped-agent');

const { _storeHeader } = http.OutgoingMessage.prototype;

/**
 * @description Transforms the casing of the headers to Pascal-Case.
 */
class TransformHeadersAgent extends WrappedAgent {
    // Rewritten from https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L442-L479
    /**
     * @description Transforms the request via header normalization.
     * @see {TransformHeadersAgent.toPascalCase}
     * @param {http.ClientRequest} request
     * @param {string[]} sortedHeaders - headers in order, optional
     */
    transformRequest(request, sortedHeaders) {
        const headers = {};
        const hasConnection = request.hasHeader('connection');
        const hasContentLength = request.hasHeader('content-length');
        const hasTransferEncoding = request.hasHeader('transfer-encoding');
        const hasTrailer = request.hasHeader('trailer');
        const keys = request.getHeaderNames();

        for (const key of keys) {
            if (key.toLowerCase().startsWith('x-')) {
                headers[key] = request.getHeader(key);
            } else {
                headers[this.toPascalCase(key)] = request.getHeader(key);
            }

            if (sortedHeaders) {
                // Removal is required in order to change the order of the properties
                request.removeHeader(key);
            }
        }

        if (!hasConnection) {
            const shouldSendKeepAlive = request.shouldKeepAlive && (hasContentLength || request.useChunkedEncodingByDefault || request.agent);
            if (shouldSendKeepAlive) {
                headers.Connection = 'keep-alive';
            } else {
                headers.Connection = 'close';
            }
        }

        if (!hasContentLength && !hasTransferEncoding) {
            // Note: This uses private `_removedContLen` property.
            //       This property tells us whether the content-length was explicitly removed or not.
            //
            // Note: This uses private `_removedTE` property.
            //       This property tells us whether the transfer-encoding was explicitly removed or not.
            if (!hasTrailer && !request._removedContLen && typeof request._contentLength === 'number') {
                headers['Content-Length'] = request._contentLength;
            } else if (!request._removedTE) {
                headers['Transfer-Encoding'] = 'chunked';
            }
        }

        const normalizedKeys = Object.keys(headers);
        const sorted = sortedHeaders ? normalizedKeys.sort(this.createSort(sortedHeaders)) : normalizedKeys;

        for (const key of sorted) {
            request.setHeader(key, headers[key]);
        }
    }

    addRequest(request, options) {
        // See https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L373
        // Note: This overrides the private `_storeHeader`.
        //       This is required, because the function directly copies
        //       the `connection`, `content-length` and `trasfer-encoding` headers
        //       directly to the underlying buffer.
        request._storeHeader = (...args) => {
            this.transformRequest(request, options.sortedHeaders);

            return _storeHeader.call(request, ...args);
        };

        return super.addRequest(request, options);
    }

    /**
     * @param {string} header - header with unknown casing
     * @returns {string} - header in Pascal-Case
     */
    toPascalCase(header) {
        return header.split('-').map((part) => {
            return part[0].toUpperCase() + part.slice(1).toLowerCase();
        }).join('-');
    }

    /**
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param {string} a - header a
     * @param {string} b - header b
     * @param {string[]} sortedHeaders - array of headers in order
     * @returns header a or header b, depending which one is more important
     */
    sort(a, b, sortedHeaders) {
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
    createSort(sortedHeaders) {
        const sortWithSortedHeaders = (a, b) => this.sort(a, b, sortedHeaders);

        return sortWithSortedHeaders;
    }
}

module.exports = TransformHeadersAgent;
