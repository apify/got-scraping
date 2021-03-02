const http2 = require('http2-wrapper');

class HttpResolver {
    constructor() {
        this.cache = new Map();
    }

    /**
     *
     * @param {string} url
     * @returns {Promise<import('got/dist/source').HandlerFunction>} - got handler
     */
    async createResolverHandler(url) {
        const httpVersion = await this._resolveHttpVersion(url);

        return (options, next) => {
            options.http2 = httpVersion === 'h2';
            return next(options);
        };
    }

    async _resolveHttpVersion(url) {
        const parsedUrl = new URL(url);
        const cacheKey = parsedUrl.hostname;

        let httpVersion = this.cache.get(cacheKey);

        if (!httpVersion) {
            const result = await http2.auto.resolveProtocol({
                host: parsedUrl.hostname,
                servername: parsedUrl.hostname,
                port: 443,
                ALPNProtocols: ['h2', 'http/1.1'],
                rejectUnauthorized: false,
            });
            httpVersion = result.alpnProtocol;
            this.cache.set(cacheKey, httpVersion);
        }

        return httpVersion;
    }
}

module.exports = new HttpResolver();
