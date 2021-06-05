import got, { HandlerFunction } from 'got';
import { Options } from '../definitions';

export const customOptionsHandler: HandlerFunction = async (options, next) => {
    const {
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
        context,
    } = (options as unknown as Options);

    // Got expects custom properties inside the context option.
    const newContext = {
        ...context,
        proxyUrl,
        headerGeneratorOptions,
        useHeaderGenerator,
    };

    delete (options as unknown as Options).proxyUrl;
    delete (options as unknown as Options).headerGeneratorOptions;
    delete (options as unknown as Options).useHeaderGenerator;

    const finalOptions = got.mergeOptions(options, { context: newContext });

    return next(finalOptions);
};
