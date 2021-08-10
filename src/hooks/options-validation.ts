import ow from 'ow';

export function optionsValidationHandler(options: unknown): void {
    const validationSchema = {
        proxyUrl: ow.optional.string.url,
        useHeaderGenerator: ow.optional.boolean,
        headerGeneratorOptions: ow.optional.object,
        insecureHTTPParser: ow.optional.boolean,
    };

    ow(options, ow.object.partialShape(validationSchema));
}
