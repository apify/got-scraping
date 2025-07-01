> # ⚠️⚠️⚠️ `got-scraping` is EOL ⚠️⚠️⚠️
>
> After many years of development, we decided to deprecate the `got-scraping` package.
> The package will no longer receive updates or support.
>
> For new projects, we recommend using [`impit`](https://github.com/apify/impit). `impit` is a modern, powerful, and flexible HTTP client with `fetch` API based on Rust's `reqwest` library. It provides a similar feature set to `got-scraping`, including browser-like request headers, proxy support, and more.
>


## Got Scraping

Got Scraping is a small but powerful [`got` extension](https://github.com/sindresorhus/got) with the purpose of sending browser-like requests out of the box. This is very essential in the web scraping industry to blend in with the website traffic.

## Installation

```
$ npm install got-scraping
```

# The module is now ESM only

This means you have to import it by using an `import` expression, or the `import()` method. You can do so by either migrating your project to ESM, or importing `got-scraping` in an async context

```diff
-const { gotScraping } = require('got-scraping');
+import { gotScraping } from 'got-scraping';
```

If you cannot migrate to ESM, here's an example of how to import it in an async context:

```javascript
let gotScraping;

async function fetchWithGotScraping(url) {
    gotScraping ??= (await import('got-scraping')).gotScraping;

    return gotScraping.get(url);
}
```

**Note:**
> - Node.js >=16 is required due to instability of HTTP/2 support in lower versions.

## API

Got scraping package is built using the [`got.extend(...)`](https://github.com/sindresorhus/got/blob/main/documentation/10-instances.md) functionality, therefore it supports all the features Got has.

Interested what's [under the hood](#under-the-hood)?

```javascript
import { gotScraping } from 'got-scraping';

gotScraping
    .get('https://apify.com')
    .then( ({ body }) => console.log(body));
```

### options

#### `proxyUrl`

Type: **`string`**

URL of the HTTP or HTTPS based proxy. HTTP/2 proxies are supported as well.

```javascript
import { gotScraping } from 'got-scraping';

gotScraping
    .get({
        url: 'https://apify.com',
        proxyUrl: 'http://usernamed:password@myproxy.com:1234',
    })
    .then(({ body }) => console.log(body));
```

#### `useHeaderGenerator`

Type: **`boolean`**\
Default: **`true`**

Whether to use the generation of the browser-like headers.

#### `headerGeneratorOptions`

See the [`HeaderGeneratorOptions`](https://github.com/apify/fingerprint-suite/tree/master/packages/header-generator#headergeneratoroptions) docs.

```javascript
const response = await gotScraping({
    url: 'https://api.apify.com/v2/browser-info',
    headerGeneratorOptions:{
        browsers: [
            {
                name: 'chrome',
                minVersion: 87,
                maxVersion: 89
            }
        ],
        devices: ['desktop'],
        locales: ['de-DE', 'en-US'],
        operatingSystems: ['windows', 'linux'],
    }
});
```

#### `sessionToken`

A non-primitive unique object which describes the current session. By default, it's `undefined`, so new headers will be generated every time. Headers generated with the same `sessionToken` never change.

## Under the hood

Thanks to the included [`header-generator`](https://github.com/apify/fingerprint-suite/tree/master/packages/header-generator) package, you can choose various browsers from different operating systems and devices. It generates all the headers automatically so you can focus on the important stuff instead.

Yet another goal is to simplify the usage of proxies. Just pass the `proxyUrl` option and you are set. Got Scraping automatically detects the HTTP protocol that the proxy server supports. After the connection is established, it does another ALPN negotiation for the end server. Once that is complete, Got Scraping can proceed with HTTP requests.

Using the same HTTP version that browsers do is important as well. Most modern browsers use HTTP/2, so Got Scraping is making a use of it too. Fortunately, this is already supported by Got - it automatically handles [ALPN protocol negotiation](https://en.wikipedia.org/wiki/Application-Layer_Protocol_Negotiation) to select the best available protocol.

HTTP/1.1 headers are always automatically formatted in [`Pascal-Case`](https://pl.wikipedia.org/wiki/PascalCase). However, there is an exception: [`x-`](https://datatracker.ietf.org/doc/html/rfc7231#section-8.3.1) headers are not modified in *any* way.

By default, Got Scraping will use an insecure HTTP parser, which allows to access websites with non-spec-compliant web servers.

Last but not least, Got Scraping comes with updated TLS configuration. Some websites make a fingerprint of it and compare it with real browsers. While Node.js doesn't support OpenSSL 3 yet, the current configuration still should work flawlessly.

To get more detailed information about the implementation, please refer to the [source code](https://github.com/apify/got-scraping/blob/master/src/index.ts).

## Tips

This package can only generate all the standard attributes. You might want to add the [`referer` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) if necessary. Please bear in mind that these headers are made for GET requests for HTML documents. If you want to make POST requests or GET requests for any other content type, you should alter these headers according to your needs. You can do so by passing a headers option or writing a custom [Got handler](https://github.com/sindresorhus/got/blob/main/documentation/10-instances.md).

This package should provide a solid start for your browser request emulation process. All websites are built differently, and some of them might require some additional special care.

### Overriding request headers

```javascript
const response = await gotScraping({
    url: 'https://apify.com/',
    headers: {
        'user-agent': 'test',
    },
});
```

For more advanced usage please refer to the [Got documentation](https://github.com/sindresorhus/got/#documentation).

### JSON mode

You can parse JSON with this package too, but please bear in mind that the request header generation is done specifically for `HTML` content type. You might want to alter the generated headers to match the browser ones.

```javascript
const response = await gotScraping({
    responseType: 'json',
    url: 'https://api.apify.com/v2/browser-info',
});
```

### Error recovery

This section covers possible errors that might happen due to different site implementations.

```
RequestError: Client network socket disconnected before secure TLS connection was established
```

The error above can be a result of the server not supporting the provided TLS setings. Try changing the ciphers parameter to either `undefined` or a custom value.
