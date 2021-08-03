/* eslint-disable no-underscore-dangle */
const http = require('http');
const WrappedAgent = require('./wrapped-agent');

const { _storeHeader } = http.OutgoingMessage.prototype;

class TransformHeadersAgent extends WrappedAgent {
    transformRequest(request) {
        const headers = {};
        const hasConnection = request.hasHeader('connection');
        const hasContentLength = request.hasHeader('content-length');
        const hasTransferEncoding = request.hasHeader('transfer-encoding');
        const hasTrailer = request.hasHeader('trailer');
        const keys = request.getHeaderNames();

        for (const key of keys) {
            headers[key] = request.getHeader(key);
            request.removeHeader(key);
        }

        if (!hasConnection) {
            const shouldSendKeepAlive = request.shouldKeepAlive && (hasContentLength || request.useChunkedEncodingByDefault || request.agent);
            if (shouldSendKeepAlive) {
                headers[this.transformHeader('connection')] = 'keep-alive';
            } else {
                headers[this.transformHeader('connection')] = 'close';
            }
        }

        if (!hasContentLength && !hasTransferEncoding) {
            if (!hasTrailer && !request._removedContLen && typeof request._contentLength === 'number') {
                headers[this.transformHeader('content-length')] = request._contentLength;
            } else if (!request._removedTE) {
                headers[this.transformHeader('transfer-encoding')] = 'chunked';
            }
        }

        const sorted = Object.keys(headers)/* .sort(this.sort) */;

        for (const key of sorted) {
            request.setHeader(this.transformHeader(key), headers[key]);
        }
    }

    addRequest(request, options) {
        request._storeHeader = (...args) => {
            this.transformRequest(request);

            return _storeHeader.call(request, ...args);
        };

        return super.addRequest(request, options);
    }

    transformHeader(header) {
        return header.split('-').map((part) => {
            return part[0].toUpperCase() + part.slice(1);
        }).join('-');
    }

    sort(a, b) {
        const { sortedHeaders } = this;

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
}

module.exports = TransformHeadersAgent;
