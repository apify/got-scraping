/**
 * Returns the Basic auth string based on the `username` and `password` parts of the given URL.
 * If the URL does not contain neither username nor password, returns `null`.
 * @param url URL object to process
 * @returns `Basic BASE64` string
 */
export function getBasic(url: URL): string | null {
    if (!url.username && !url.password) {
        return null;
    }

    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);

    const basic = Buffer.from(`${username}:${password}`).toString('base64');

    return `Basic ${basic}`;
}
