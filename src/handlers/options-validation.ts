import ow from 'ow';
import type { NormalizedOptions, HandlerFunction } from 'got';

export const optionsValidationHandler: HandlerFunction = async (options, next) => {
    const validationSchema = {
        proxyUrl: ow.optional.string.url,
        useHeaderGenerator: ow.optional.boolean,
        headerGeneratorOptions: ow.optional.object,
    };

    ow(options, ow.object.partialShape(validationSchema));

    const { proxyUrl, http2 } = options;

    if (proxyUrl && http2) {
        if (isUnsupportedNodeVersion()) {
            throw new Error('Proxy with HTTP2 target is supported only in node v12+. Please upgrade your node version to fix this error.');
        }
    }

    return next(options as unknown as NormalizedOptions);
};

function isUnsupportedNodeVersion(): boolean {
    const nodeVersion = parseFloat(process.versions.node);

    return nodeVersion < 12;
}
