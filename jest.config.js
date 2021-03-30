const path = require('path');

module.exports = {
    testEnvironment: 'node',
    verbose: true,
    rootDir: path.join(__dirname, './'),
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    setupFilesAfterEnv: ['jest-extended'],
};
