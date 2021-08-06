"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.got = exports.CancelError = exports.RetryError = exports.ReadError = exports.TimeoutError = exports.UploadError = exports.CacheError = exports.HTTPError = exports.MaxRedirectsError = exports.RequestError = exports.parseBody = exports.ParseError = exports.isResponseOk = exports.parseLinkHeader = exports.create = exports.calculateRetryDelay = exports.Options = void 0;
const http = require("http");
const https = require("https");
const got_cjs_1 = require("got-cjs");
Object.defineProperty(exports, "Options", { enumerable: true, get: function () { return got_cjs_1.Options; } });
Object.defineProperty(exports, "calculateRetryDelay", { enumerable: true, get: function () { return got_cjs_1.calculateRetryDelay; } });
Object.defineProperty(exports, "create", { enumerable: true, get: function () { return got_cjs_1.create; } });
Object.defineProperty(exports, "parseLinkHeader", { enumerable: true, get: function () { return got_cjs_1.parseLinkHeader; } });
Object.defineProperty(exports, "isResponseOk", { enumerable: true, get: function () { return got_cjs_1.isResponseOk; } });
Object.defineProperty(exports, "ParseError", { enumerable: true, get: function () { return got_cjs_1.ParseError; } });
Object.defineProperty(exports, "parseBody", { enumerable: true, get: function () { return got_cjs_1.parseBody; } });
Object.defineProperty(exports, "RequestError", { enumerable: true, get: function () { return got_cjs_1.RequestError; } });
Object.defineProperty(exports, "MaxRedirectsError", { enumerable: true, get: function () { return got_cjs_1.MaxRedirectsError; } });
Object.defineProperty(exports, "HTTPError", { enumerable: true, get: function () { return got_cjs_1.HTTPError; } });
Object.defineProperty(exports, "CacheError", { enumerable: true, get: function () { return got_cjs_1.CacheError; } });
Object.defineProperty(exports, "UploadError", { enumerable: true, get: function () { return got_cjs_1.UploadError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return got_cjs_1.TimeoutError; } });
Object.defineProperty(exports, "ReadError", { enumerable: true, get: function () { return got_cjs_1.ReadError; } });
Object.defineProperty(exports, "RetryError", { enumerable: true, get: function () { return got_cjs_1.RetryError; } });
Object.defineProperty(exports, "CancelError", { enumerable: true, get: function () { return got_cjs_1.CancelError; } });
// @ts-expect-error Missing types
const HeaderGenerator = require("header-generator");
const transform_headers_agent_1 = require("./agent/transform-headers-agent");
const scraping_defaults_1 = require("./scraping-defaults");
const options_validation_1 = require("./hooks/options-validation");
const custom_options_1 = require("./hooks/custom-options");
const browser_headers_1 = require("./hooks/browser-headers");
const proxy_1 = require("./hooks/proxy");
const http2_1 = require("./hooks/http2");
const got = got_cjs_1.got.extend({
    mutableDefaults: true,
    ...scraping_defaults_1.SCRAPING_DEFAULT_OPTIONS,
    context: {
        headerGenerator: new HeaderGenerator(),
        useHeaderGenerator: true,
    },
    agent: {
        http: new transform_headers_agent_1.TransformHeadersAgent(http.globalAgent),
        https: new transform_headers_agent_1.TransformHeadersAgent(https.globalAgent),
    },
    hooks: {
        init: [
            options_validation_1.optionsValidationHandler,
            custom_options_1.customOptionsHook,
        ],
        beforeRequest: [
            http2_1.http2Hook,
            proxy_1.proxyHook,
            browser_headers_1.browserHeadersHook,
        ],
    },
});
exports.got = got;
exports.default = got;
__exportStar(require("./context"), exports);
// CommonJS compatibility
module.exports = got;
module.exports.default = got;
module.exports.__esModule = true;
Object.assign(got, {
    Options: got_cjs_1.Options,
    calculateRetryDelay: got_cjs_1.calculateRetryDelay,
    create: got_cjs_1.create,
    parseLinkHeader: got_cjs_1.parseLinkHeader,
    isResponseOk: got_cjs_1.isResponseOk,
    ParseError: got_cjs_1.ParseError,
    parseBody: got_cjs_1.parseBody,
    RequestError: got_cjs_1.RequestError,
    MaxRedirectsError: got_cjs_1.MaxRedirectsError,
    HTTPError: got_cjs_1.HTTPError,
    CacheError: got_cjs_1.CacheError,
    UploadError: got_cjs_1.UploadError,
    TimeoutError: got_cjs_1.TimeoutError,
    ReadError: got_cjs_1.ReadError,
    RetryError: got_cjs_1.RetryError,
    CancelError: got_cjs_1.CancelError,
    got,
});
