/* eslint-disable no-underscore-dangle */
// @ts-expect-error TODO: Type `header-generator`
import HeaderGenerator from 'header-generator';
import { OutgoingMessage, Agent, ClientRequest, ClientRequestArgs } from 'http';
import { WrappedAgent } from './wrapped-agent';

// @ts-expect-error Private property
const { _storeHeader } = OutgoingMessage.prototype;

const generator = new HeaderGenerator();

/**
 * Transforms the casing of the headers to Pascal-Case.
 */
class TransformHeadersAgent<T extends Agent> extends WrappedAgent<T> {
    // Rewritten from https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L442-L479
    /**
     * Transforms the request via header normalization.
     */
    transformRequest(request: ClientRequest, sortHeaders: boolean): void {
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
            if (!hasTrailer && !typedRequest._removedContLen && typeof typedRequest._contentLength === 'number') {
                headers['Content-Length'] = typedRequest._contentLength;
            } else if (!typedRequest._removedTE) {
                headers['Transfer-Encoding'] = 'chunked';
            }
        }

        const transformedHeaders: Record<string, string | number | string[]> = sortHeaders ? generator.orderHeaders(headers) : headers;

        for (const [key, value] of Object.entries(transformedHeaders)) {
            request.setHeader(key, value);
        }
    }

    override addRequest(request: ClientRequest, options: ClientRequestArgs): void {
        const typedRequest = request as ClientRequest & {
            _storeHeader: (firstLine: string, headers: Record<string, string>) => void;
        };

        // See https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_outgoing.js#L373
        // Note: This overrides the private `_storeHeader`.
        //       This is required, because the function copies
        //       the `connection`, `content-length` and `trasfer-encoding` headers
        //       directly to the underlying buffer.
        typedRequest._storeHeader = (...args) => {
            this.transformRequest(request, true);

            return _storeHeader.call(request, ...args);
        };

        // `agent-base` isn't able to detect the protocol correctly
        (options as any).secureEndpoint = options.protocol === 'https:';

        return super.addRequest(request, options);
    }

    toPascalCase(header: string): string {
        return header.split('-').map((part) => {
            return part[0]!.toUpperCase() + part.slice(1).toLowerCase();
        }).join('-');
    }
}

export { TransformHeadersAgent };
