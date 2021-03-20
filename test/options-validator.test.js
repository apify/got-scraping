const {
    optionsValidationHandler,
} = require('../src/handlers/options-validation');

describe('Options validation', () => {
    let nextHolder;
    let options;

    beforeEach(() => {
        nextHolder = {
            next() { },
        };
        options = {
        };
    });

    test('should validate proxyUrl', () => {
        expect(() => optionsValidationHandler(options, nextHolder.next)).not.toThrow();

        options.proxyUrl = 'test';

        expect(() => optionsValidationHandler(options, nextHolder.next)).toThrow(/Expected property string/);

        options.proxyUrl = 'http://user:password@localhost:8000';

        expect(() => optionsValidationHandler(options, nextHolder.next)).not.toThrow();
    });

    test('should validate useHeaderGenerator', () => {
        expect(() => optionsValidationHandler(options, nextHolder.next)).not.toThrow();

        options.useHeaderGenerator = 'test';

        expect(() => optionsValidationHandler(options, nextHolder.next)).toThrow(/Expected property `useHeaderGenerator` to be of type `boolean`/);

        options.useHeaderGenerator = true;

        expect(() => optionsValidationHandler(options, nextHolder.next)).not.toThrow();
    });

    test('should validate headerGeneratorOptions', () => {
        expect(() => optionsValidationHandler(options, nextHolder.next)).not.toThrow();

        options.headerGeneratorOptions = 'test';

        expect(() => optionsValidationHandler(options, nextHolder.next)).toThrow(/Expected property `headerGeneratorOptions` to be of type `object`/);

        options.headerGeneratorOptions = {};

        expect(() => optionsValidationHandler(options, nextHolder.next)).not.toThrow();
    });
});
