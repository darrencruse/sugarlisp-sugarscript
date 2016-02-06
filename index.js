var ctx = require('sugarlisp-core/transpiler-context');

module.exports = {
  name: "sugarscript",
  extends: "plus",
  lextab: require('./lextab'),
  readtab: require('./readtab'),
  gentab: require('./gentab'),
  "__sugarscript_init": function(lexer) {
    // for transpiling statements (as opposed to expressions)
    ctx.options.transpile.statements = true;
    ctx.options.transpile.implicitReturns = true;
  }
};
