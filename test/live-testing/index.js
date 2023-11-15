import { setTimeout } from 'timers/promises';

import got from 'got';

import { gotScraping } from '../../dist/index.js';

async function processUrls(gotImplementation, urls) {
    let passed = 0;
    let blocked = 0;
    let failed = 0;

    let url = urls.shift();
    while (url) {
        try {
            // console.log(`crawling ${url}`);
            const request = gotImplementation.get(url);

            const result = await Promise.race([
                request,
                setTimeout(5000),
            ]);

            if (!result?.body) {
                request.cancel();
                throw new Error('timeout');
            }

            // console.log(`crawled ${url}`);

            if (result.body.includes('Just a moment...')) {
                blocked++;
            } else {
                passed++;
            }
        } catch (e) {
            failed++;
            // console.error(e.message);
        }

        url = urls.shift();
    }

    // console.log('done!');
    return { passed, blocked, failed };
}

async function runInParallel(implementation, urls) {
    const localUrls = [...urls];
    const partialResults = await Promise.all(Array.from({ length: 5 }, () => processUrls(implementation, localUrls)));

    return partialResults.reduce((acc, { passed, blocked, failed }) => {
        acc.passed += passed;
        acc.blocked += blocked;
        acc.failed += failed;
        return acc;
    }, { passed: 0, blocked: 0, failed: 0 });
}

(async () => {
    const { body } = await got.get('https://raw.githubusercontent.com/apify/fingerprint-suite/master/test/antibot-services/live-testing/cloudflare-websites.csv');
    const urls = body.split('\n');

    const [gotScrapingResults, gotResults] = await Promise.all([
        runInParallel(gotScraping, urls),
        runInParallel(got, urls),
    ]);

    console.log('got-scraping');
    console.log(gotScrapingResults);

    console.log('---');
    console.log('got');
    console.log(gotResults);

    process.exit(0);
})();
