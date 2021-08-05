const http2 = require('http2-wrapper');

const [major, minor] = process.versions.node.split('.').map((version) => Number(version));

exports.http2Hook = (options) => {
    if (options.http2) {
        if (major < 15 || (major === 15 && minor < 10)) {
            throw new Error(`Unsupported Node.js version: ${process.versions.node}. Required: >=15.10'`);
        }

        options.request = http2.auto;
    }
};
