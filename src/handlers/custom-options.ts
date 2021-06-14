import { Options as GotOptions, HandlerFunction } from 'got-cjs';
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

    console.log('wat', options);
    const finalOptions = new GotOptions({ context: newContext }, undefined, options);
    console.log('wat', finalOptions);

    return next(finalOptions);
};
