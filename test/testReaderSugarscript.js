var reader = require('sugarlisp-core/reader');
var sl = require('sugarlisp-core/sl-types');

function testReader(msg, src) {
  console.log('* ' + msg + ' ' + src);
  var forms = reader.read_from_source(src, 'testReader.sugar');
  //console.log('lists:', JSON.stringify(forms.toJSON()));
  console.log('\n' + sl.pprintSEXP(forms.toJSON(),{omitTop: true, bareSymbols: true}) + '\n');
}

testReader('a symbol:', 'sym');
testReader('a string:', '"str"');
testReader('a number:', '13');
testReader('a number:', '173.97');
testReader('a negative number:', '-13');
testReader('a negative number:', '-173.97');
testReader('nil:', 'nil');
testReader('null:', 'null');
testReader('true:', 'true');
testReader('false:', 'false');
testReader('var declaration:', 'var x');
testReader('var with initializer:', 'var x = 2');
testReader('var declaration ending with semicolon:', 'var x;');
testReader('var with initializer ending with semicolon:', 'var x = 3;');
testReader('lispy style function call:', '(console.log "hello");');
testReader('traditional function call (no space rule):', 'console.log("hello");');
testReader('function call with space (stops on the symbol):', 'console.log ("hello");');
testReader('zero arg (no space rule):', 'stat.isDirectory()');
testReader('if (no else):', 'if (true) console.log("true");');
testReader('if (no else) code block and semi:', 'if (true) { console.log("true"); }');
testReader('if with else:', 'if (> 3 4) console.log("true") else console.log("false")');
testReader('if with else and code blocks:', 'if (> 3 4) { set(flag,true); console.log("true"); } else { set(flag,false); console.log("false"); }');
testReader('function declaration (anonymous):', 'function(x) { log(x); }');
testReader('function declaration (named):', 'function mylog(x) { log(x); }');
testReader('function with multi-statement body:', 'function mylog(x, y) { log(x); log(y); }');

testReader('a list of all atom types:', '(list "string1" \'string2\' 123 123.23 nil null true false)');
testReader('function:', 'var f = function (x y) { (+ x y) }');
testReader('function:', 'var f = function (x y) { (- x y) }');
testReader('arrow function:', '(x y) => (+ x y)');
testReader('html symbol overlap test 1:', 'var f = function (x y z) { if (=== x y) y else if (< x y) x else if (<= x z) z }');
testReader('html symbol overlap test 2:', 'var f = function (x y z) { if (=== x y) y else if (> x y) x else if (>= x z) z }');
testReader('some javascript:', '(javascript "alert(\'hello\');")');

testReader('js comment by itself:', '\n// a comment\n');
testReader('js comments:', '(do "hello"\n// a comment\n(+ 2 3))\n// another comment');
testReader('js block comment one line:', '(do "hello"\n/* a comment */\n(+ 2 3))\n/* another comment */');
testReader('js block comment multi line:', '/*\n* multi line\n* comment */\n(do "hello" /* a \ncomment\n*/\n(+ 2 3))');
testReader('an array:', 'var arr = [1 2 3]');
testReader('js object literal:', '{ first: "fred", last: "flintstone", age: 54, cartoon: true, toString: () => @first }');
testReader('json with quoted keys:', '{ "first": "fred", "last": "flintstone", "age": 54, "cartoon": true }');
testReader('code block:', '{ (console.log "hello") }');
