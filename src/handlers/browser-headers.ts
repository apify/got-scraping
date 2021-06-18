import got, { Options, HandlerFunction } from 'got-cjs';

export const browserHeadersHandler: HandlerFunction = (options, next) => {
    const { http2, headers = {}, context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
    } = context!;

    if (!useHeaderGenerator) {
        return next(options);
    }

    deleteDefaultGotUserAgent(headers);

    const mergedHeaderGeneratorOptions = {
        httpVersion: http2 ? '2' : '1',
        ...(headerGeneratorOptions as any),
    };
    const generatedHeaders = (headerGenerator as any).getHeaders(mergedHeaderGeneratorOptions);

    let newOptions: any;

    if (http2) { // generate http2 headers
        newOptions = {
            headers: mergeHeaders(generatedHeaders, headers),
        };
    } else {
        newOptions = createOptionsWithBeforeRequestHook(generatedHeaders);
    }

    options.merge(newOptions);
    return next(options);
};

function deleteDefaultGotUserAgent(headers: Record<string, any>) {
    const gotDefaultUserAgent = got.defaults.options.headers['user-agent'];
    if (headers['user-agent'] === gotDefaultUserAgent) {
        delete headers['user-agent'];
    }
}

/**
 * Creates options with beforeRequestHooks in order to have case-sensitive headers.
 */
function createOptionsWithBeforeRequestHook(generatedHeaders: any) {
    return {
        hooks: {
            beforeRequest: [
                (gotOptions) => {
                    // We need to set directly to the internal property of options,
                    // because the headers setter lowercases the headers.
                    // eslint-disable-next-line no-underscore-dangle
                    (gotOptions as any)._internals.headers = mergeHeaders(generatedHeaders, gotOptions.headers);
                },
            ],
        },
    } as Partial<Options>;
}

/**
 * Merges original generated headers and user provided overrides.
 * All header overrides will have the original header case, because of antiscraping.
 */
export function mergeHeaders(original: any, overrides: any) {
    const mergedHeaders = new Map();

    Object.entries(original).forEach(([nameSensitive, value]) => mergedHeaders.set(nameSensitive.toLowerCase(), { nameSensitive, value }));

    Object.entries(overrides).forEach(([nameSensitive, value]) => {
        const headerRecord = mergedHeaders.get(nameSensitive.toLowerCase());

        if (headerRecord) {
            const { nameSensitive: oldNameSensitive } = headerRecord;

            mergedHeaders.set(nameSensitive.toLowerCase(), { nameSensitive: oldNameSensitive, value });
        } else {
            mergedHeaders.set(nameSensitive.toLowerCase(), { nameSensitive, value });
        }
    });

    const finalHeaders: Record<string, any> = {};

    mergedHeaders.forEach(({ nameSensitive, value }) => { finalHeaders[nameSensitive] = value; });

    return finalHeaders;
}
