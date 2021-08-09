const auto = require('../http2auto');
const httpResolver = require('../http-resolver');

/**
 * @param {object} options
 * @param {function} next
 * @returns {import('got').GotReturn}
 */
async function alpnHandler(options, next) {
    if (options.http2) {
        const parsedUrl = new URL(options.url);

        if (parsedUrl.protocol === 'https:') {
            const protocol = await httpResolver.resolveHttpVersion(parsedUrl);

            options.http2 = protocol === 'h2';

            if (options.http2) {
                options.request = auto;
            }
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
