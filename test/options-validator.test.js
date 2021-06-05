import { optionsValidationHandler } from '../lib/handlers/options-validation';

describe('Options validation', () => {
    const nextMock = () => {};
    let options;

    beforeEach(() => {
        options = {
        };
    });

    test('should validate proxyUrl', () => {
        expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();

        options.proxyUrl = 'test';

        expect(() => optionsValidationHandler(options, nextMock)).rejects.toThrow(/Expected property string/);

        options.proxyUrl = 'http://user:password@localhost:8000';

        expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();
    });

    test('should validate useHeaderGenerator', () => {
        expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();

        options.useHeaderGenerator = 'test';

        expect(() => optionsValidationHandler(options, nextMock))
            .rejects
            .toThrow(/Expected property `useHeaderGenerator` to be of type `boolean`/);

        options.useHeaderGenerator = true;

        expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();
    });

    test('should validate headerGeneratorOptions', () => {
        expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();

        options.headerGeneratorOptions = 'test';

        expect(() => optionsValidationHandler(options, nextMock))
            .rejects
            .toThrow(/Expected property `headerGeneratorOptions` to be of type `object`/);

        options.headerGeneratorOptions = {};

        expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();
    });
});
