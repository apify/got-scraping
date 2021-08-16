import { Agent as HttpAgent, AgentOptions, ClientRequest, ClientRequestArgs } from 'http';

/**
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L129-L162
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L234-L246
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L304-L305
 * Wraps an existing Agent instance,
 * so there's no need to replace `agent.addRequest`.
 */
class WrappedAgent<T extends HttpAgent> implements HttpAgent {
    agent: T;

    constructor(agent: T) {
        this.agent = agent;
    }

    addRequest(request: ClientRequest, options: ClientRequestArgs): void {
        // @ts-expect-error @types/node has incorrect types
        this.agent.addRequest(request, options);
    }

    get keepAlive(): boolean {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.keepAlive;
    }

    get maxSockets(): HttpAgent['maxSockets'] {
        return this.agent.maxSockets;
    }

    get options(): AgentOptions {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.options;
    }

    get defaultPort(): number {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.defaultPort;
    }

    get protocol(): string {
        // @ts-expect-error @types/node has incorrect types
        return this.agent.protocol;
    }

    destroy(): void {
        this.agent.destroy();
    }

    // Let's implement `HttpAgent` so we don't have to
    // type `WrappedAgent as unknown as HttpAgent`
    get maxFreeSockets(): HttpAgent['maxFreeSockets'] {
        return this.agent.maxFreeSockets;
    }

    get maxTotalSockets(): HttpAgent['maxTotalSockets'] {
        return this.agent.maxTotalSockets;
    }

    get freeSockets(): HttpAgent['freeSockets'] {
        return this.agent.freeSockets;
    }

    get sockets(): HttpAgent['sockets'] {
        return this.agent.sockets;
    }

    get requests(): HttpAgent['requests'] {
        return this.agent.requests;
    }
}

export { WrappedAgent };
