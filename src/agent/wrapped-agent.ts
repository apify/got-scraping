import { Agent as HttpAgent, ClientRequest, ClientRequestArgs } from 'http';

/**
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L129-L162
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L234-L246
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L304-L305
 * Wraps an existing Agent instance,
 * so there's no need to replace `agent.addRequest`.
 */
class WrappedAgent<T extends HttpAgent> {
    agent: T;

    constructor(agent: T) {
        this.agent = agent;
    }

    addRequest(request: ClientRequest, options: ClientRequestArgs) {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.addRequest(request, options);
    }

    get keepAlive() {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.keepAlive;
    }

    get maxSockets() {
        return this.agent.maxSockets;
    }

    get options() {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.options;
    }

    get defaultPort() {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.defaultPort;
    }

    get protocol() {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.protocol;
    }

    destroy() {
        this.agent.destroy();
    }
}

export { WrappedAgent };
