import got, { Options, HandlerFunction } from 'got-cjs';

export const browserHeadersHandler: HandlerFunction = async (options, next) => {
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
        newOptions = createOptionsWithBeforeRequestHook(generatedHeaders, headers);
    }

    return next(new Options(newOptions, undefined, options));
};

function deleteDefaultGotUserAgent(headers: Record<string, any>) {
    const gotDefaultUserAgent = got.defaults.options.headers['user-agent'];
    if (headers['user-agent'] && headers['user-agent'] === gotDefaultUserAgent) {
        delete headers['user-agent'];
    }
}

/**
 * Creates options with beforeRequestHooks in order to have case-sensitive headers.
 */
function createOptionsWithBeforeRequestHook(generatedHeaders: any, headerOverrides: any) {
    return {
        hooks: {
            beforeRequest: [
                (gotOptions) => {
                    const mergedOriginalHeaders = mergeHeaders(generatedHeaders, gotOptions.headers);

                    gotOptions.headers = mergeHeaders(mergedOriginalHeaders, headerOverrides);
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
