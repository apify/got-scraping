const httpResolver = require('../http-resolver');

/**
 * @param {object} options
 * @param {function} next
 * @returns {import('got').GotReturn}
 */
async function alpnHandler(options, next) {
    const { url, http2 } = options;

    if (http2) {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol === 'https:') {
            const protocol = await httpResolver.resolveHttpVersion(parsedUrl);

            options.http2 = protocol === 'h2';
        } else {
            // http2 is https
            options.http2 = false;
        }
    }

    return next(options);
}

module.exports = {
    alpnHandler,
};
