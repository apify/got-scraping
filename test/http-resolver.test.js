/* eslint-disable no-underscore-dangle */
const http2 = require('http2-wrapper');

describe('HTTP resolver', () => {
    const protocol = 'h2';
    const proxyUrl = new URL('http://localhost:1234');

    let httpResolver;

    beforeEach(() => {
        httpResolver = require('../src/http-resolver'); // eslint-disable-line
        jest.spyOn(http2.auto, 'resolveProtocol').mockResolvedValue({ alpnProtocol: protocol });
    });

    afterEach(() => {
        httpResolver._cache = new Map(); // empty cache after each test
    });

    describe('caching', () => {
        test('should save to cache', async () => {
            jest.spyOn(httpResolver, '_setToCache');
            const returned = await httpResolver.resolveHttpVersion(proxyUrl);

            expect(returned).toBe(protocol);
            expect(httpResolver._setToCache).toBeCalledWith('localhost:1234', protocol);
            expect(httpResolver._cache.has('localhost:1234')).toBe(true);
        });

        test('should get from cache', async () => {
            jest.spyOn(httpResolver, '_getFromCache');
            const fromMock = await httpResolver.resolveHttpVersion(proxyUrl);
            const fromCache = await httpResolver.resolveHttpVersion(proxyUrl);

            expect(httpResolver._getFromCache).toBeCalledWith('localhost:1234');
            expect(httpResolver._getFromCache).toHaveBeenCalledTimes(2);
            expect(fromMock).toBe(fromCache);
        });

        test('should allow max 1000 items in cache', async () => {
            const promises = [];
            for (let i = 0; i < httpResolver._maxCacheSize; i++) {
                promises.push(
                    httpResolver.resolveHttpVersion(new URL(`http://localhost:${i}`)),
                );
            }
            await Promise.all(promises);
            expect(httpResolver._cache.size).toBe(promises.length);

            expect(httpResolver._cache.has('localhost:0')).toBe(true);
            await httpResolver.resolveHttpVersion(new URL('http://localhost:1234'));
            expect(httpResolver._cache.has('localhost:0')).toBe(false);
            expect(httpResolver._cache.has('localhost:1234')).toBe(true);
            expect(httpResolver._cache.size).toBe(httpResolver._maxCacheSize);
        });
    });
});
