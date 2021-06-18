import { optionsValidationHandler } from '../lib/handlers/options-validation';

describe('Options validation', () => {
    const nextMock = () => {};
    let options;

    beforeEach(() => {
        options = {
            context: {}
        };
    });

    test('should validate proxyUrl', async () => {
        await expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();

        options.context.proxyUrl = 'test';

        await expect(() => optionsValidationHandler(options, nextMock)).rejects.toThrow(/Expected property string/);

        options.context.proxyUrl = 'http://user:password@localhost:8000';

        await expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();
    });

    test('should validate useHeaderGenerator', async () => {
        await expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();

        options.context.useHeaderGenerator = 'test';

        await expect(() => optionsValidationHandler(options, nextMock))
            .rejects
            .toThrow(/Expected property `useHeaderGenerator` to be of type `boolean`/);

        options.context.useHeaderGenerator = true;

        await expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();
    });

    test('should validate headerGeneratorOptions', async () => {
        await expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();

        options.context.headerGeneratorOptions = 'test';

        await expect(() => optionsValidationHandler(options, nextMock))
            .rejects
            .toThrow(/Expected property `headerGeneratorOptions` to be of type `object`/);

        options.context.headerGeneratorOptions = {};

        await expect(optionsValidationHandler(options, nextMock)).resolves.toBeUndefined();
    });
});
