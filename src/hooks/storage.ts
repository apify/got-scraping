import { Options } from 'got';

class Storage {
    storage: WeakMap<object, unknown>;

    constructor() {
        this.storage = new WeakMap();
    }

    get<T extends object>(token: object | undefined): T | undefined {
        if (!token) {
            return;
        }

        if (!this.storage.has(token)) {
            this.storage.set(token, {});
        }

        return this.storage.get(token) as T | undefined;
    }
}

const storage = new Storage();

export const sessionDataHook = (options: Options): void => {
    options.context.sessionData = storage.get(options.context.sessionToken as object | undefined);
};
