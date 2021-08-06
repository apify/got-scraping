/**
 * @param {object} options
 */
export function customOptionsHook(raw, options) {
    if ('proxyUrl' in raw) {
        options.context.proxyUrl = raw.proxyUrl;
        delete raw.proxyUrl;
    }

    if ('headerGeneratorOptions' in raw) {
        options.context.headerGeneratorOptions = raw.headerGeneratorOptions;
        delete raw.headerGeneratorOptions;
    }

    if ('useHeaderGenerator' in raw) {
        options.context.useHeaderGenerator = raw.useHeaderGenerator;
        delete raw.useHeaderGenerator;
    }

    if ('insecureHTTPParser' in raw) {
        options.context.insecureHTTPParser = raw.insecureHTTPParser;
        delete raw.insecureHTTPParser;
    }
}
