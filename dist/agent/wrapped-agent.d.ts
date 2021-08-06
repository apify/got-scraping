/// <reference types="node" />
import { Agent as HttpAgent, ClientRequest, ClientRequestArgs } from 'http';
import { Agent as HttpsAgent } from 'https';
/**
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L129-L162
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L234-L246
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L304-L305
 * @description Wraps an existing Agent instance,
 *              so there's no need to replace `agent.addRequest`.
 */
declare class WrappedAgent {
    agent: HttpAgent | HttpsAgent;
    constructor(agent: HttpAgent | HttpsAgent);
    addRequest(request: ClientRequest, options: ClientRequestArgs): any;
    get keepAlive(): any;
    get maxSockets(): number;
    get options(): any;
    get defaultPort(): any;
    get protocol(): any;
    destroy(): void;
}
export { WrappedAgent };
