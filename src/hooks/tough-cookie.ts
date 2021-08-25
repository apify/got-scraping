import { CookieJar } from 'tough-cookie';
import { Options } from 'got-cjs';

interface CookieData {
    toughCookie?: CookieJar;
}

export const toughCookieHook = (options: Options): void => {
    const sessionData = options.context.sessionData as CookieData | undefined;
    if (sessionData) {
        if (!sessionData.toughCookie) {
            sessionData.toughCookie = new CookieJar();
        }

        options.cookieJar = sessionData.toughCookie;
    }
};
