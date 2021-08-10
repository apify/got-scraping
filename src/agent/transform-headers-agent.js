/* eslint-disable no-underscore-dangle */
const HeaderGenerator = require('header-generator');
const http = require('http');
const WrappedAgent = require('./wrapped-agent');

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

            if (sortHeaders) {
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

        const transformedHeaders = sortHeaders ? generator.orderHeaders(headers) : headers;

        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in transformedHeaders) {
            request.setHeader(key, transformedHeaders[key]);
        }
    }

    addRequest(request, options) {
        // See https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L373
        // Note: This overrides the private `_storeHeader`.
        //       This is required, because the function copies
        //       the `connection`, `content-length` and `trasfer-encoding` headers
        //       directly to the underlying buffer.
        request._storeHeader = (...args) => {
            this.transformRequest(request, true);

            return _storeHeader.call(request, ...args);
        };

        // `agent-base` isn't able to detect the protocol correctly
        options.secureEndpoint = options.protocol === 'https:';

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
}

module.exports = TransformHeadersAgent;
