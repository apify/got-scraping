import { auto } from 'http2-wrapper';

/**
 * The HttpResolver resolves server's prefered HTTP version and caches the results.
 */
class HttpResolver {
    _cache = new Map();
    _maxCacheSize = 1000;

    async resolveHttpVersion(parsedUrl: URL, rejectUnauthorized?: boolean): Promise<string> {
        const { hostname, port } = parsedUrl;
        const cacheKey = `${hostname}:${port}`;

        let httpVersion = this._getFromCache(cacheKey);

        if (!httpVersion) {
            const result = await (auto as any).resolveProtocol({
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
    _getFromCache(key: string): string {
        return this._cache.get(key);
    }

    /**
     * @param {string} key - proxy host unique key
     * @param {string} value - http version
     */
    _setToCache(key: string, value: string) {
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

export default new HttpResolver();
