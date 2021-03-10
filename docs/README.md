# Got Scraping
Got Scraping is a small, but powerful and extensible library, that allows you to seamlessly send browser-like requests with only a little configuration, and a single function call.

## Motivation
With the increasing popularity of web scraping, it is becoming more important to blend in with the typical internet traffic. This package implements multiple mimics to make document GET requests similar to browsers. Thanks to the `headers-generator` package, you can choose various browsers from different operating systems and devices. This package generates all the headers for you so that you can focus on the important stuff. But it doesn't end here. This package also tries to mimic the full request fingerprint, including the correct HTTP protocol and TLS ciphers.

Proxies are essential in the web scraping industry. Another goal of this package is to simplify the usage of `HTTP` and `HTTPS` proxies. All you have to do is pass the `proxyUrl` option.

There is one more good news for loyal `got` users. This package is modified got instance using handlers so that you can use the got interface as always. We've added just a few extras.

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
  - [API reference](#api-reference)

<!-- tocstop -->

## Simulating browser-like requests
The Got Scraping package's primary goal is to make the document GET request look like a real browser made it. The crucial part of this process is to send browser-like headers. This process is outsourced to the `header-generator` package, allowing you to customize browsers, devices, languages, and operating systems to generate the request headers. The generation of the request headers is based on real-world data, and the algorithm is periodically updated. For more information, see the header-generator readMe @TODO. This package can only generate all the standard attributes. There still might be site-specific attributes that you need to add. One of those attributes you might want to add is the Referer header. Referer header might add more credibility to your request and hence reduce the blocking. Check out more info about the referer header [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer). Please bear in mind that these headers are made for GET requests for HTML documents. If you want to make POST requests or GET requests for any other content type, you should alter these headers according to your needs. You can do so by passing a headers option or writing a custom got handler.

The second colossal factor is using the same HTTP version as browsers. Most modern browsers use HTTP v2, so using it when the server supports it takes you one more step further to look like a browser. Luckily you don't have to care about the server HTTP version support since got automatically handles [ALPN protocol negotiation](https://en.wikipedia.org/wiki/Application-Layer_Protocol_Negotiation) and uses the HTTP2 only if it is supported.
The last step is to have a browser-like TLS suite and ciphers. According to our research, the cipher `TLS_AES_256_GCM_SHA384` is used among all modern browsers. We use this cipher as a default one. However, feel free to change it.

This package should provide a solid start for your browser request emulation process. All websites are built differently, and some of them might require some additional special care.

## Proxies
Got Scraping package makes using proxies with your requests ridiculously easy. It supports multiple variations of connections and through HTTP1 and HTTP2 proxies to HTTP1 and HTTP2 servers. You can see the supported variations below. All you have to do is pass a valid `proxyUrl` option.

| Proxy type 	| Proxy HTTP version 	| Agents             	|
|------------	|--------------------	|--------------------	|
| https      	| http2              	| http2, https, http 	|
| https      	| http1              	| http2, https       	|
| http       	| http1              	| http2, https, http 	|

The proxy type and proxy HTTP version is a type of connection to a proxy, and the agents are supported connections from the proxy to the target, let's say, website.
## Installation

```bash
$ npm install got-scraping
```

## Examples
These examples should help you to grasp the concept of the `got-scraping` package quickly.
### Simple GET request
```javascript
const gotScraping = require('got-scraping');

gotScraping.get('https://apify.com').then( ({ body }) => console.log(body))
```

### GET request with proxy
```javascript
const gotScraping = require('got-scraping');

gotScraping({ url:'https://apify.com', proxyUrl: 'http://myproxy.com:1234' }).then( ({ body }) => console.log(body))
```

### Overriding request headers

// options

// handler 


## API reference

{{>all-docs~}}
