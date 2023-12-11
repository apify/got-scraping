import type { CancelableRequest, ExtendOptions, Got, HTTPAlias, Options, PaginateData, PaginationOptions, Request, Response } from 'got';
import type { OptionsInit } from './context.js';

type Except<ObjectType, KeysType extends keyof ObjectType> = Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>;
type Merge<FirstType, SecondType> = Except<FirstType, Extract<keyof FirstType, keyof SecondType>> & SecondType;

export type ExtendedGotRequestFunction = {
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
};

export type ExtendedOptionsOfTextResponseBody = Merge<OptionsInit, {
    isStream?: false;
    resolveBodyOnly?: false;
    responseType?: 'text';
}>;

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

export type ExtendedGotStreamFunction = ((url?: string | URL, options?: Merge<OptionsInit, {
    isStream?: true;
}>) => Request) & ((options?: Merge<OptionsInit, {
    isStream?: true;
}>) => Request);

export type ExtendedExtendOptions = ExtendOptions & OptionsInit;

export type ExtendedGotStream = ExtendedGotStreamFunction & Record<HTTPAlias, ExtendedGotStreamFunction>;

export type ExtendedPaginationOptions<ElementType, BodyType> = PaginationOptions<ElementType, BodyType> & {
    paginate?: (data: PaginateData<BodyType, ElementType>) => OptionsInit | false;
};

export type ExtendedOptionsWithPagination<T = unknown, R = unknown> = Merge<OptionsInit, {
    pagination?: ExtendedPaginationOptions<T, R>;
}>;

export type ExtendedGotPaginate = {
    /**
    Same as `GotPaginate.each`.
    */
    <T, R = unknown>(url: string | URL, options?: ExtendedOptionsWithPagination<T, R>): AsyncIterableIterator<T>;
    /**
    Same as `GotPaginate.each`.
    */
    <T, R = unknown>(options?: ExtendedOptionsWithPagination<T, R>): AsyncIterableIterator<T>;
    /**
    Returns an async iterator.

    See pagination.options for more pagination options.

    @example
    ```
    import { gotScraping } from 'got-scraping';

    const countLimit = 10;

    const pagination = gotScraping.paginate('https://api.github.com/repos/sindresorhus/got/commits', {
        pagination: { countLimit }
    });

    console.log(`Printing latest ${countLimit} Got commits (newest to oldest):`);

    for await (const commitData of pagination) {
        console.log(commitData.commit.message);
    }
    ```
    */
    each: (<T, R = unknown>(url: string | URL, options?: ExtendedOptionsWithPagination<T, R>) => AsyncIterableIterator<T>)
        & (<T, R = unknown>(options?: ExtendedOptionsWithPagination<T, R>) => AsyncIterableIterator<T>);
    /**
    Returns a Promise for an array of all results.

    See pagination.options for more pagination options.

    @example
    ```
    import { gotScraping } from 'got-scraping';

    const countLimit = 10;

    const results = await gotScraping.paginate.all('https://api.github.com/repos/sindresorhus/got/commits', {
        pagination: { countLimit }
    });

    console.log(`Printing latest ${countLimit} Got commits (newest to oldest):`);
    console.log(results);
    ```
    */
    all: (<T, R = unknown>(url: string | URL, options?: ExtendedOptionsWithPagination<T, R>) => Promise<T[]>)
        & (<T, R = unknown>(options?: ExtendedOptionsWithPagination<T, R>) => Promise<T[]>);
};

export type GotScraping = {
    stream: ExtendedGotStream;
    paginate: ExtendedGotPaginate;
    defaults: Got['defaults'];
    extend: (...instancesOrOptions: Array<GotScraping | ExtendedExtendOptions>) => GotScraping;
} & Record<HTTPAlias, ExtendedGotRequestFunction> & ExtendedGotRequestFunction;
