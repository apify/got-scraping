# Got Scraping
Got Scraping is a small but powerful `got` extension that allows you to send browser-like requests with only a little configuration seamlessly and with a single function call. [Got](https://github.com/sindresorhus/got) is a widely used and powerful client that provides extensibility and customization. Sending browser-like requests is essential in the web scraping industry to blend in with the website traffic. You can read more about the mimics [here](#simulating-browser-like-requests). To unleash its full potential, please use node 12+.

## Motivation
With the increasing popularity of web scraping, it is becoming more important to blend in with the typical internet traffic. This package implements multiple mimics to make GET requests similar to browsers. Thanks to the included [`header-generator`](https://github.com/apify/header-generator) package, you can choose various browsers from different operating systems and devices. The `header-generator` package generates all the headers for you so that you can focus on the important stuff.

But the `got-scraping` doesn't stop here. The `got-scraping` package also tries to mimic the full request fingerprint, including the correct HTTP protocol and TLS ciphers.

Proxies are essential in the web scraping industry. Another goal of this package is to simplify the usage of `HTTP` and `HTTPS` proxies. All you have to do is pass the `proxyUrl` option.

There is one more good news for loyal `got` users. This package is modified `got` instance using handlers so that you can use the `got` interface as always. We've added just a few extras.

<!-- toc -->

- [Got Scraping](#got-scraping)
  - [Motivation](#motivation)
  - [Simulating browser-like requests](#simulating-browser-like-requests)
  - [Proxies](#proxies)
  - [Installation](#installation)
  - [Examples](#examples)
    - [Simple GET request](#simple-get-request)
    - [GET request with proxy](#get-request-with-proxy)
    - [Overriding request headers](#overriding-request-headers)
    - [Customizing Header generator options](#customizing-header-generator-options)
    - [Get JSON](#get-json)
  - [API reference](#api-reference)
    - [Got scraping default values](#got-scraping-default-values)
    - [Got scraping extra options](#got-scraping-extra-options)
    - [Error recovery](#error-recovery)

<!-- tocstop -->

## Simulating browser-like requests
The Got Scraping package's primary goal is to make the document GET request look like a real browser made it. The crucial part of this process is to send browser-like headers. This process is outsourced to the `header-generator` package, allowing you to customize browsers, devices, languages, and operating systems to generate the request headers. The generation of the request headers is based on real-world data, and the algorithm is periodically updated. For more information, see the `header-generator` [README](https://github.com/apify/header-generator).

This package can only generate all the standard attributes. There still might be site-specific attributes that you need to add. One of those attributes you might want to add is the `referer` header. Referer header might add more credibility to your request and hence reduce the blocking. Check out more info about the `referer` header [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer). Please bear in mind that these headers are made for GET requests for HTML documents. If you want to make POST requests or GET requests for any other content type, you should alter these headers according to your needs. You can do so by passing a headers option or writing a custom [got handler](https://github.com/sindresorhus/got/blob/main/documentation/advanced-creation.md#examples).

The second colossal factor is using the same HTTP version as browsers. Most modern browsers use HTTP v2, so using it when the server supports it takes you one more step further to look like a browser. Luckily you don't have to care about the server HTTP version support since `got` automatically handles [ALPN protocol negotiation](https://en.wikipedia.org/wiki/Application-Layer_Protocol_Negotiation) and uses the HTTP v2 only if it is supported.
The last step is to have a browser-like TLS suite and ciphers. According to our research, the cipher `TLS_AES_256_GCM_SHA384` is used among all modern browsers. We use this cipher as a default one. However, feel free to change it.

This package should provide a solid start for your browser request emulation process. All websites are built differently, and some of them might require some additional special care.

## Proxies
Got Scraping package makes using proxies with your requests ridiculously easy. It supports multiple variations of connections through HTTP1 and HTTP2 proxies to HTTP1 and HTTP2 servers. You can see the supported variations below. All you have to do is pass a valid `proxyUrl` option.

| Proxy type 	| Proxy HTTP version 	| Agents             	|
|------------	|--------------------	|--------------------	|
| https      	| http2              	| http2, https, http 	|
| https      	| http1              	| http2, https       	|
| http       	| http1              	| http2, https, http 	|

The proxy type and proxy HTTP version is a type of connection to a proxy. The agents are supported connections from the proxy to the target, let's say, a website.
## Installation

We strongly recommend using Node 12+ because of the compatible TLS ciphers we use to emulate the browser. Also, HTTP2 over proxy is not supported in the Node version smaller than 12.

```bash
$ npm install got-scraping
```

## Examples
These examples should help you to grasp the concept of the `got-scraping` package quickly.
### Simple GET request
```javascript
const gotScraping = require('got-scraping');

gotScraping
    .get('https://apify.com')
    .then( ({ body }) => console.log(body))
```

### GET request with proxy
```javascript
const gotScraping = require('got-scraping');

gotScraping({
    url: 'https://apify.com',
    proxyUrl: 'http://myproxy.com:1234',
})
    .then(({ body }) => console.log(body));

```

### Overriding request headers

By passing options:
```javascript
const response = await gotScraping({
    url: 'https://apify.com/',
    headers: {
        'user-agent': 'test',
    },
});
```

You can check out how to override request headers using handlers in the original `got` repo under the [instances](https://github.com/sindresorhus/got#instances) section. 

### Customizing Header generator options

```javascript
const response = await gotScraping({
    url: 'https://api.apify.com/v2/browser-info',
    headerGeneratorOptions:{
        browsers:[
            {
                name: 'chrome',
                minVersion: 87,
                maxVersion: 89
            }
        ],
        devices: ['desktop'],
        languages: ['de-DE', 'en-US'],
        operatingSystems: ['windows', 'linux'] 
    }
});
```

### Get JSON
You can get `JSON` body with this package too, but please bear in mind that the request header generation is done specifically for `HTML` content type. You might want to alter the generated headers to match the browser ones.

```javascript
const response = await gotScraping({
    responseType: 'json',
    url: 'https://api.apify.com/v2/browser-info',
    ciphers: undefined,
});
```

## API reference

Got scraping package is built using `got.extend` functionality and supports all of the [got API](https://github.com/sindresorhus/got#api). On top of that, it adds few more options to the `got` once and then passes them by a handler to the `got` context object. This package also alters `got` defaults to be more scraping friendly.

### Got scraping default values
```javascript
const SCRAPING_DEFAULT_OPTIONS = {
    // Most of the new browsers use HTTP2
    http2: true,
    https: {
        // We usually don't want to fail because of SSL errors.
        // We want the content.
        rejectUnauthorized: false,
    },
    // This would fail all of 404, 403 responses.
    // We usually don't want to consider these as errors.
    // We want to take some action after this.
    throwHttpErrors: false,
    // Node js uses different TLS ciphers by default.
    ciphers: getCiphersBasedOnNode(),
    // We need to have browser-like headers to blend in.
    useHeaderGenerator: true,
    // Got has infinite timeout by default. In scraping we have to count with bad proxies. Without custom timeout it would just hang.
    timeout: 60000,
    // Retries should be handled by a crawler not the request package.
    retry: { retries: 0, maxRetryAfter: 0 },

};
```
### Got scraping extra options
`proxyUrl` - Url of HTTPS or HTTP based proxy. HTTP2 proxies are supported.

`useHeaderGenerator` - Turns on the generation of the browser-like header. By default, it is set to `true`.

`headerGeneratorOptions` - See the [HeaderGeneratorOptions](https://github.com/apify/header-generator/tree/master#headergeneratoroptions).

### Error recovery
This section covers possible errors that might happen due to different site implementations.

`RequestError: Client network socket disconnected before secure TLS connection was established` - Try changing the ciphers parameter to either `undefined` or a custom value.