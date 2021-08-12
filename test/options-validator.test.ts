import {
    optionsValidationHandler,
} from '../dist/hooks/options-validation';

describe('Options validation', () => {
    let options: any;

    beforeEach(() => {
        options = {
        };
    });

    test('should validate proxyUrl', () => {
        expect(() => optionsValidationHandler(options)).not.toThrow();

        options.proxyUrl = 'test';

        expect(() => optionsValidationHandler(options)).toThrow(/Expected property string/);

        options.proxyUrl = 'http://user:password@localhost:8000';

        expect(() => optionsValidationHandler(options)).not.toThrow();
    });

    test('should validate useHeaderGenerator', () => {
        expect(() => optionsValidationHandler(options)).not.toThrow();

        options.useHeaderGenerator = 'test';

        expect(() => optionsValidationHandler(options)).toThrow(/Expected property `useHeaderGenerator` to be of type `boolean`/);

        options.useHeaderGenerator = true;

        expect(() => optionsValidationHandler(options)).not.toThrow();
    });

    test('should validate headerGeneratorOptions', () => {
        expect(() => optionsValidationHandler(options)).not.toThrow();

        options.headerGeneratorOptions = 'test';

        expect(() => optionsValidationHandler(options)).toThrow(/Expected property `headerGeneratorOptions` to be of type `object`/);

        options.headerGeneratorOptions = {};

        expect(() => optionsValidationHandler(options)).not.toThrow();
    });
});
