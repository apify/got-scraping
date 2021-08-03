/**
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
}

module.exports = WrappedAgent;
