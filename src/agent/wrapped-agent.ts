import type { NetConnectOpts } from 'net';
import { ClientRequest, Agent as HttpAgent, type AgentOptions, type ClientRequestArgs } from 'node:http';
import type { Duplex } from 'stream';

/**
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L129-L162
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L234-L246
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L304-L305
 * Wraps an existing Agent instance,
 * so there's no need to replace `agent.addRequest`.
 */
export class WrappedAgent<T extends HttpAgent> implements HttpAgent {
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

    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.on(eventName, listener);
        return this;
    }

    once(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.once(eventName, listener);
        return this;
    }

    off(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.off(eventName, listener);
        return this;
    }

    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.addListener(eventName, listener);
        return this;
    }

    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.removeListener(eventName, listener);
        return this;
    }

    removeAllListeners(eventName?: string | symbol): this {
        this.agent.removeAllListeners(eventName);
        return this;
    }

    setMaxListeners(n: number): this {
        this.agent.setMaxListeners(n);
        return this;
    }

    getMaxListeners(): number {
        return this.agent.getMaxListeners();
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    listeners(eventName: string | symbol): Function[] {
        return this.agent.listeners(eventName);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    rawListeners(eventName: string | symbol): Function[] {
        return this.agent.rawListeners(eventName);
    }

    emit(eventName: string | symbol, ...args: any[]): boolean {
        return this.agent.emit(eventName, ...args);
    }

    eventNames(): (string | symbol)[] {
        return this.agent.eventNames();
    }

    listenerCount(eventName: string | symbol): number {
        return this.agent.listenerCount(eventName);
    }

    prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.prependListener(eventName, listener);
        return this;
    }

    prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.agent.prependOnceListener(eventName, listener);
        return this;
    }

    createConnection(options: NetConnectOpts, callback?: (err: Error | null, stream: Duplex) => void): Duplex {
        return this.agent.createConnection(options, callback);
    }

    keepSocketAlive(socket: Duplex): void {
        this.agent.keepSocketAlive(socket);
    }

    reuseSocket(socket: Duplex, request: ClientRequest): void {
        this.agent.reuseSocket(socket, request);
    }

    getName(options?: any): string {
        return this.agent.getName(options);
    }
}
