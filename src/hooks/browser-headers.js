const http2 = require('http2-wrapper');

/**
 * @param {object} options
 */
exports.browserHeadersHook = async function (options) {
    const { context } = options;
    const {
        headerGeneratorOptions,
        useHeaderGenerator,
        headerGenerator,
    } = context;

    if (!useHeaderGenerator) return;

    let alpnProtocol;
    if (options.url.protocol === 'https:') {
        alpnProtocol = (await http2.auto.resolveProtocol({
            host: options.url.hostname,
            port: options.url.port || 443,
            rejectUnauthorized: false,
            ALPNProtocols: ['h2', 'http/1.1'],
        })).alpnProtocol;
    }

    const mergedHeaderGeneratorOptions = {
        httpVersion: alpnProtocol === 'h2' ? '2' : '1',
        ...headerGeneratorOptions,
    };

    const generatedHeaders = headerGenerator.getHeaders(mergedHeaderGeneratorOptions);
    const fixedHeaders = new Map();

    for (const entry of Object.entries(generatedHeaders)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    for (const entry of Object.entries(options.headers)) {
        fixedHeaders.set(entry[0].toLowerCase(), entry);
    }

    const headers = {};
    for (const [key, value] of fixedHeaders.values()) {
        headers[key] = value;
    }

    options.headers = headers;
};
