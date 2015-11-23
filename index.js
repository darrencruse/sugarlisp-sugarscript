var ctx = require('sugarlisp-core/transpiler-context');

module.exports = {
  syntax: require('./syntax'),
  keywords: require('./keywords'),
  "__sugarscript_init": function(source) {
    // sugarscript allows semi's as statement terminators like javascript
    // note: without this semi's get treated as comments and cause problems!
    source.setLinecommentRE(/\/\//g);
    // and sugarscript does not treat commas as whitespace (e.g. in "var x,y"
    // there's an indeterminate number of vars so comma is used to know
    // when the var form ends)
    source.setWhitespaceRE(/[\s;]/);
  }
};
