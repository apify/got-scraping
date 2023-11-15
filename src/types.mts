import type { CancelableRequest, ExtendOptions, Got, HTTPAlias, Options, Request, Response } from 'got';

import type { OptionsInit } from './context.mjs';

type Except<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>;
type Merge<FirstType, SecondType> = Except<FirstType, Extract<keyof FirstType, keyof SecondType>> & SecondType;

export interface ExtendedGotRequestFunction {
    (url: string | URL, options?: ExtendedOptionsOfTextResponseBody): CancelableRequest<Response<string>>;
    <T>(url: string | URL, options?: ExtendedOptionsOfJSONResponseBody): CancelableRequest<Response<T>>;
    (url: string | URL, options?: ExtendedOptionsOfBufferResponseBody): CancelableRequest<Response<Buffer>>;
    (url: string | URL, options?: ExtendedOptionsOfUnknownResponseBody): CancelableRequest<Response>;
    (options: ExtendedOptionsOfTextResponseBody): CancelableRequest<Response<string>>;
    <T>(options: ExtendedOptionsOfJSONResponseBody): CancelableRequest<Response<T>>;
    (options: ExtendedOptionsOfBufferResponseBody): CancelableRequest<Response<Buffer>>;
    (options: ExtendedOptionsOfUnknownResponseBody): CancelableRequest<Response>;
    (url: string | URL, options?: (Merge<ExtendedOptionsOfTextResponseBody, ResponseBodyOnly>)): CancelableRequest<string>;
    <T>(url: string | URL, options?: (Merge<ExtendedOptionsOfJSONResponseBody, ResponseBodyOnly>)): CancelableRequest<T>;
    (url: string | URL, options?: (Merge<ExtendedOptionsOfBufferResponseBody, ResponseBodyOnly>)): CancelableRequest<Buffer>;
    (options: (Merge<ExtendedOptionsOfTextResponseBody, ResponseBodyOnly>)): CancelableRequest<string>;
    <T>(options: (Merge<ExtendedOptionsOfJSONResponseBody, ResponseBodyOnly>)): CancelableRequest<T>;
    (options: (Merge<ExtendedOptionsOfBufferResponseBody, ResponseBodyOnly>)): CancelableRequest<Buffer>;
    (url: string | URL, options?: Merge<OptionsInit, {
        isStream: true;
    }>): Request;
    (options: Merge<OptionsInit, {
        isStream: true;
    }>): Request;
    (url: string | URL, options?: OptionsInit): CancelableRequest | Request;
    (options: OptionsInit): CancelableRequest | Request;
    (url: undefined, options: undefined, defaults: Options): CancelableRequest | Request;
}

export type ExtendedOptionsOfTextResponseBody = Merge<OptionsInit, {
    isStream?: false;
    resolveBodyOnly?: false;
    responseType?: 'text';
}>

export type ExtendedOptionsOfJSONResponseBody = Merge<OptionsInit, {
    isStream?: false;
    resolveBodyOnly?: false;
    responseType?: 'json';
}>;

export type ExtendedOptionsOfBufferResponseBody = Merge<OptionsInit, {
    isStream?: false;
    resolveBodyOnly?: false;
    responseType: 'buffer';
}>;

export type ExtendedOptionsOfUnknownResponseBody = Merge<OptionsInit, {
    isStream?: false;
    resolveBodyOnly?: false;
}>;

export type ResponseBodyOnly = {
    resolveBodyOnly: true;
};

export type ExtendedExtendOptions = ExtendOptions & OptionsInit;

export interface GotScraping extends Record<HTTPAlias, ExtendedGotRequestFunction>, ExtendedGotRequestFunction {
    stream: Got['stream'];
    paginate: Got['paginate'];
    defaults: Got['defaults'];
    extend: (...instancesOrOptions: Array<GotScraping | ExtendedExtendOptions>) => GotScraping;
}
