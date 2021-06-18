import ow from 'ow';
import type { HandlerFunction } from 'got-cjs';

export const optionsValidationHandler: HandlerFunction = (options, next) => {
    const validationSchema = {
        proxyUrl: ow.optional.string.url,
        useHeaderGenerator: ow.optional.boolean,
        headerGeneratorOptions: ow.optional.object,
    };

    const { context, http2 } = options;

    ow(context, ow.object.partialShape(validationSchema));

    if (context.proxyUrl && http2) {
        if (isUnsupportedNodeVersion()) {
            throw new Error('Proxy with HTTP2 target is supported only in node v12+. Please upgrade your node version to fix this error.');
        }
    }

    return next(options);
};

function isUnsupportedNodeVersion(): boolean {
    const nodeVersion = parseFloat(process.versions.node);

    return nodeVersion < 12;
}
