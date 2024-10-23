4.0.7 / 2024/10/23
====================
- Handles proxy authentication consistently throughout the codebase (solves e.g. this [`http2-wrapper`](https://github.com/szmarczak/http2-wrapper/issues/108) issue).

4.0.6 / 2024/05/22
====================
- Logging `CONNECT` error response body instead of the length only

4.0.5 / 2024/04/03
====================
- Fixed processing `http://` requests over `https://` proxies correctly

4.0.4 / 2024/02/16
====================
- Fixed passing the timeout to the `resolveProtocol` calls

4.0.3 / 2023/12/11
====================
- Fixed missing extended types for `gotScraping.stream` and `gotScraping.paginate`
- Fixed general type issues with `got-scraping`, including not reporting incorrect types for known properties like `proxyUrl`

4.0.2 / 2023/11/29
====================
- Fixed runtime exceptions when using `got-scraping` in a project with older versions of node.js 16

4.0.1 / 2023/11/16
====================
- Fix compilation errors when this module is used in TypeScript with a project that isn't using `Node16`/`NodeNext` `module`/`moduleResolution`

4.0.0 / 2023/11/07
====================
- **BREAKING**: This module is now ESM only.
  - You will need to either migrate your projects to ESM, or import `got-scraping` in an async context via `await import('got-scraping');`
- Update `got` to v13

3.1.0 / 2021/08/23
====================
- Add `sessionToken` option to persist generated headers

3.0.1 / 2021/08/20
====================
- Use own proxy agent

3.0.0 / 2021/08/19
====================
- Switch to TypeScript
- Enable insecure parser by default
- Use `header-generator` to order headers
- Remove `default` export in favor of `import { gotScraping }`
- Fix leaking ALPN negotiation

2.1.2 / 2021/08/06
====================
- Mimic `got` interface

2.1.1 / 2021/08/06
====================
- Use `header-generator` v1.0.0

2.1.0 / 2021/08/06
====================
- Add `TransfomHeadersAgent`
- Optimizations
- Use Got 12
- docs: fix instances anchor

2.0.2-beta / 2021/08/04
====================
- Use `TransfomHeadersAgent` internally to transform headers to `Pascal-Case`

2.0.1 / 2021/07/22
====================
- pin `http2-wrapper` version as the latest was causing random CI failures

2.0.0 / 2021/07/22
====================
- **BREAKING**: Require Node.js >=15.10.0 because HTTP2 support on lower Node.js versions is very buggy.
- Fix various issues by refactoring from got handlers to hooks.

1.0.4 / 2021/05/17
====================
- HTTP2 protocol resolving fix

1.0.3 / 2021/04/27
====================
- HTTP2 wrapper fix

1.0.2 / 2021/04/18
====================
- Fixed TLS

1.0.1 / 2021/04/15
====================
- Improved ciphers
- Fixed request payload sending

1.0.0 / 2021/04/07
====================
- Initial release
