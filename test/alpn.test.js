import { alpnHandler } from '../lib/handlers/alpn';
import httpResolver from '../lib/http-resolver';

describe('ALPN', () => {
    let next;
    let options;

    beforeEach(() => {
        options = {
            context: {},
            https: {},
        };
        next = () => { };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should start alpn only if http2 and https', async () => {
        options.url = 'https://test.com';
        options.http2 = true;
        jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('h2');

        await alpnHandler(options, next);
        expect(options.http2).toBe(true);

        jest.spyOn(httpResolver, 'resolveHttpVersion').mockResolvedValue('http/1.1');

        await alpnHandler(options, next);
        expect(options.http2).toBe(false);
    });

    test('should skip alpn and assume http/1.1 if not https', async () => {
        options.url = 'http://test.com';
        options.http2 = true;
        jest.spyOn(httpResolver, 'resolveHttpVersion');

        await alpnHandler(options, next);
        expect(httpResolver.resolveHttpVersion).toBeCalledTimes(0);
        expect(options.http2).toBe(false);
    });
});
