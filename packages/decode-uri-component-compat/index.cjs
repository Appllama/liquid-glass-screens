// Preserve query-string 7's CommonJS function export with the patched upstream decoder.
const decoder = require('upstream-decoder');

module.exports = decoder.default ?? decoder;
