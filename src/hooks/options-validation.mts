import ow from 'ow';

const validationSchema = {
    proxyUrl: ow.optional.string.url,
    useHeaderGenerator: ow.optional.boolean,
    headerGeneratorOptions: ow.optional.object,
    insecureHTTPParser: ow.optional.boolean,
    sessionToken: ow.optional.object,
};

export function optionsValidationHandler(options: unknown): void {
    ow(options, ow.object.partialShape(validationSchema));
}
