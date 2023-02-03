/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest/presets/js-with-babel',
    testEnvironment: 'node',
    transformIgnorePatterns: [
      "/node_modules/(?!(formdata-polyfill|form-data-encoder|node-fetch|data-uri-to-buffer|fetch-blob)/)",
    ],
    noStackTrace: false
  };