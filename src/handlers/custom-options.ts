import { HandlerFunction } from 'got-cjs';
import { Options } from '../definitions';

export const customOptionsHandler: HandlerFunction = async (options: Options, next) => {
    const {
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
        context,
    } = options;

    // Got expects custom properties inside the context option.
    const newContext = {
        ...context,
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
    };

    delete options.proxyUrl;
    delete options.headerGeneratorOptions;
    delete options.useHeaderGenerator;
    options.context = newContext;

    return next(options);
};
