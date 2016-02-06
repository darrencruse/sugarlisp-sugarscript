
module.exports = [

  // sugarscript allows semicolons as statement terminators like javascript,
  // so we add semicolons as a form of whitespace
  {
    category: 'whitespace',
    match: /[\s;]/g,
    replace: true
  },

  // and we no longer treat semicolons as line comments (like in core):
  {
    category: 'linecomment',
    match: /\/\//g,
    replace: true
  },

  // commas are needed in sugarscript e.g. in something like "var x, y"
  // to know where the unparenthesized-yet-variable-length form ends
  // (whereas in core they're ignored as whitespace)
  {
    category: 'punctuation',
    match: /(\,)/g
  }

];
