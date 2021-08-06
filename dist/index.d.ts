import { Options, calculateRetryDelay, create, parseLinkHeader, isResponseOk, ParseError, parseBody, RequestError, MaxRedirectsError, HTTPError, CacheError, UploadError, TimeoutError, ReadError, RetryError, CancelError } from 'got-cjs';
declare const got: import("got-cjs").Got;
export default got;
export { Options, calculateRetryDelay, create, parseLinkHeader, isResponseOk, ParseError, parseBody, RequestError, MaxRedirectsError, HTTPError, CacheError, UploadError, TimeoutError, ReadError, RetryError, CancelError, got, };
export * from './context';
