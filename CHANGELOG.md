2.0.2 / 2021/08/04
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
