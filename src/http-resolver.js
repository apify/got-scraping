const http2 = require('http2-wrapper');

/**
 * The HttpResolver resolves server's prefered HTTP version and caches the results.
 */
class HttpResolver {
    constructor() {
        this._cache = new Map();
        this._maxCacheSize = 1000;
    }

    /**
     * @param {URL} parsedUrl
     * @param {boolean} rejectUnauthorized
     * @returns {string} resolved protocol
     */
    async resolveHttpVersion(parsedUrl, rejectUnauthorized) {
        const { hostname, port } = parsedUrl;
        const cacheKey = `${hostname}:${port}`;

        let httpVersion = this._getFromCache(cacheKey);

        if (!httpVersion) {
            const result = await http2.auto.resolveProtocol({
                host: hostname,
                servername: hostname,
                port: port || 443,
                ALPNProtocols: ['h2', 'http/1.1'],
                rejectUnauthorized,
            });
            httpVersion = result.alpnProtocol;

            this._setToCache(cacheKey, httpVersion); // more than => 1000 removed oldest using iterator
        }

        return httpVersion;
    }

    /**
     * @param {string} key - proxy host unique key
     * @returns {string} - http version
     */
    _getFromCache(key) {
        return this._cache.get(key);
    }

    /**
     * @param {string} key - proxy host unique key
     * @param {string} value - http version
     */
    _setToCache(key, value) {
        this._maybeRemoveOldestKey();

        this._cache.set(key, value);
    }

    /**
     * Removes the oldest record from the cache to free memory for new record.
     */
    _maybeRemoveOldestKey() {
        if (this._cache.size >= this._maxCacheSize) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
        }
    }
}

module.exports = new HttpResolver();
