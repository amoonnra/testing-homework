module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  "moduleNameMapper": {
    "\\.(css|less)$": "<rootDir>/CSSStub.js"
  }
};
