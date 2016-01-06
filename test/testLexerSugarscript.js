// Exercise the SugarLisp Lexer
// note: this should be changed to be a proper test with pass/fail asserts

var lex = require('sugarlisp-core/lexer'),
    reader = require('sugarlisp-core/reader')
    sl = require('sugarlisp-core/sl-types');

function testLexer(msg, src) {
  console.log('* ' + msg + ' ' + src);
  var tokens = reader.nonlocal_tokens(src, 'testLexer.sugar');
  console.log(lex.formatTokenDump(tokens, lex.formatTokenSexp, "(tokens ", ")\n"));
}

// repeat of sugarlisp "plus" lexer tests
// (confirm "sugarscript" doesn't affect "plus"/"core")

testLexer('a symbol:', 'sym');
testLexer('a string:', '"str"');
testLexer('a number:', '13');
testLexer('a number:', '173.97');
testLexer('a negative number:', '-13');
testLexer('a negative number:', '-173.97');
testLexer('nil:', 'nil');
testLexer('null:', 'null');
testLexer('true:', 'true');
testLexer('false:', 'false');

// start of sugarscript style lexer tests

testLexer('var declaration:', 'var x');
testLexer('var with initializer:', 'var x = 2');
testLexer('var declaration ending with semicolon:', 'var x;');
testLexer('var with initializer ending with semicolon:', 'var x = 3;');
testLexer('lispy style function call:', '(console.log "hello");');
testLexer('javascript style function call (no space rule):', 'console.log("hello");');
testLexer('javascript style function call with space (will stop on the symbol):', 'console.log ("hello");');
testLexer('zero arg (no space rule):', 'stat.isDirectory()');
testLexer('if (no else):', 'if (true) console.log("true");');
testLexer('if (no else) code block and semi:', 'if (true) { console.log("true"); }');
testLexer('if with else:', 'if (> 3 4) console.log("true") else console.log("false")');
testLexer('if with else and code blocks:', 'if (> 3 4) { set(flag,true); console.log("true"); } else { set(flag,false); console.log("false"); }');
testLexer('function declaration (anonymous):', 'function(x) { log(x); }');
testLexer('function declaration (named):', 'function mylog(x) { log(x); }');

testLexer('a list of all atom types:', '(list "string1" \'string2\' 123 123.23 nil null true false)');
testLexer('function:', 'var f = function (x y) { (+ x y) }');
testLexer('function:', 'var f = function (x y) { (- x y) }');
testLexer('arrow function:', '(x y) => (+ x y)');
testLexer('html symbol overlap test 1:', 'var f = function (x y z) { if (= x y) y else if (< x y) x else if (<= x z) z }');
testLexer('html symbol overlap test 2:', 'var f = function (x y z) { if (= x y) y else if (> x y) x else if (>= x z) z }');
testLexer('some javascript:', '(javascript "alert(\'hello\');")');

testLexer('js comment by itself:', '\n// a comment\n');
testLexer('js comments:', '(do "hello"\n// a comment\n(+ 2 3))\n// another comment');
testLexer('js block comment one line:', '(do "hello"\n/* a comment */\n(+ 2 3))\n/* another comment */');
testLexer('js block comment multi line:', '/*\n* multi line\n* comment */\n(do "hello" /* a \ncomment\n*/\n(+ 2 3))');
testLexer('an array:', 'var arr = [1 2 3]');
testLexer('js object literal:', '{ first: "fred", last: "flintstone", age: 54, cartoon: true, toString: () => @first }');
testLexer('json with quoted keys:', '{ "first": "fred", "last": "flintstone", "age": 54, "cartoon": true }');
testLexer('code block:', '{ (console.log "hello") }');
