// A script that makes got-scraping esm compatible with TS configs that use ES2022 for module/moduleResolution
// instead of Node16/NodeNext. What used to work no longer does because TypeScript made its module resolution much stricter

import { readFile, writeFile } from 'node:fs/promises';

const fileToAlter = new URL('../dist/index.d.ts', import.meta.url);

const raw = await readFile(fileToAlter, 'utf-8');

const output = [];

for (const line of raw.split('\n')) {
    if (line.includes("from 'got'")) {
        output.push('// @ts-ignore Patch needed for ES20xx compatibility while this module uses Node16/NodeNext resolutions');
    }
    output.push(line);
}

await writeFile(fileToAlter, output.join('\n'));
