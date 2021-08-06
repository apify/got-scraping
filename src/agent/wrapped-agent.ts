/**
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L129-L162
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L234-L246
 * @see https://github.com/nodejs/node/blob/533cafcf7e3ab72e98a2478bc69aedfdf06d3a5e/lib/_http_client.js#L304-L305
 * @description Wraps an existing Agent instance,
 *              so there's no need to replace `agent.addRequest`.
 */
class WrappedAgent {
    constructor(agent) {
        this.agent = agent;
    }

    addRequest(request, options) {
        return this.agent.addRequest(request, options);
    }

    get keepAlive() {
        return this.agent.keepAlive;
    }

    get maxSockets() {
        return this.agent.maxSockets;
    }

    get options() {
        return this.agent.options;
    }

    get defaultPort() {
        return this.agent.defaultPort;
    }

    get protocol() {
        return this.agent.protocol;
    }

    destroy() {
        this.agent.destroy();
    }
}

export default WrappedAgent;
