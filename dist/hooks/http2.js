"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.http2Hook = void 0;
const http2_wrapper_1 = require("http2-wrapper");
function http2Hook(options) {
    if (options.http2 && options.url.protocol !== 'http:') {
        // @ts-expect-error FIXME
        options.request = http2_wrapper_1.auto;
    }
}
exports.http2Hook = http2Hook;
