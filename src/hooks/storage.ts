import { Options } from 'got-cjs/dist/source';

class Storage {
    // eslint-disable-next-line @typescript-eslint/ban-types
    storage: WeakMap<object, any>;

    constructor() {
        this.storage = new WeakMap();
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    get<T extends object>(token: object | undefined): T | undefined {
        if (!token) {
            return;
        }

        if (!this.storage.has(token)) {
            this.storage.set(token, {});
        }

        return this.storage.get(token);
    }
}

const storage = new Storage();

export const sessionDataHook = (options: Options): void => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    options.context.sessionData = storage.get(options.context.sessionToken as object | undefined);
};
