import { describe, beforeEach, test } from 'vitest';
import {
    optionsValidationHandler,
} from '../src/hooks/options-validation.js';

describe('Options validation', () => {
    let options: any;

    beforeEach(() => {
        options = {
        };
    });

    test('should validate proxyUrl', (t) => {
        t.expect(() => optionsValidationHandler(options)).not.toThrow();

        options.proxyUrl = 'test';

        t.expect(() => optionsValidationHandler(options)).toThrow(/Expected property string/);

        options.proxyUrl = 'http://user:password@localhost:8000';

        t.expect(() => optionsValidationHandler(options)).not.toThrow();
    });

    test('should validate useHeaderGenerator', (t) => {
        t.expect(() => optionsValidationHandler(options)).not.toThrow();

        options.useHeaderGenerator = 'test';

        t.expect(() => optionsValidationHandler(options)).toThrow(/Expected property `useHeaderGenerator` to be of type `boolean`/);

        options.useHeaderGenerator = true;

        t.expect(() => optionsValidationHandler(options)).not.toThrow();
    });

    test('should validate headerGeneratorOptions', (t) => {
        t.expect(() => optionsValidationHandler(options)).not.toThrow();

        options.headerGeneratorOptions = 'test';

        t.expect(() => optionsValidationHandler(options)).toThrow(/Expected property `headerGeneratorOptions` to be of type `object`/);

        options.headerGeneratorOptions = {};

        t.expect(() => optionsValidationHandler(options)).not.toThrow();
    });
});
