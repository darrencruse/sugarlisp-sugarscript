var sl = require('sugarlisp-core/sl-types'),
    reader = require('sugarlisp-core/reader');

// the opening paren is treated as an operator in sugarscript
// A normal parenthesized expression "(x)" is considered a prefix operator
// But when used postfix e.g. "fn(x)" this is understood to be a function
// call read in as an s-expression list of the form "(fn x)".  And likewise
// something more complex e.g. "obj.fn(x)" gets read as "((. obj fn) x)".
//
// Note the reader already understands that spaces *are* significant with postfix
// operators i.e. "fn(x)" will be seen as a call whereas "fn (x)" will not for
// the same reason "i++ j" is not confused with "i ++j".

exports['('] = reader.operator({
  prefix: reader.operator('prefix', 'unary', readparenthesizedlist, 1),
  // 17.5 is lower precedence than '.' and '~' (this is important!)
  postfix: reader.operator('postfix', 'binary', tradfncalltosexpr, 17.5)
});

// this is just a helper for the above
function readparenthesizedlist(lexer, opSpec, openingParenForm) {
  // note since '(' is defined as a prefix operator the '(' has already been read
  // read_delimited_list infers this because we pass openingParenForm below
  return reader.read_delimited_list(lexer, openingParenForm, ')');
}

// NOT SURE WE NEEDED THIS AFTER ALL
// sugarscript (esp) has customized read handlers for paren-free
// "function(", "if(", etc. This "beforeRead" function makes sure
// the reader doesn't treat those as normal function calls.
// function noCustomReader(lexer, opSpec, leftForm) {
//   var retry;
//   var dialect = reader.get_current_dialect(lexer);
//   if(sl.isAtom(leftForm) &&
//     dialect.syntax[leftForm.text] &&
//     !dialect.syntax[leftForm.text] == reader.symbol)
//   {
//     // let the other handlers take it:
//     retry = reader.retry;
//   }
//   return retry;
// }

//  postfix: reader.operator('postfix', 'unary', tradfncalltosexpr, 17.5, {altprefix: "fncall("})

// this is just a helper for the above
// note the reader calls tradfncalltosexpr *after* reading the opening paren
function tradfncalltosexpr(lexer, opSpec, leftForm, openingParenForm) {

// do we really need this?
  // if(opSpec.options.altprefix) {
  //   opForm = utils.clone(opForm);
  //   opForm.value = opSpec.options.altprefix;
  //   opForm.text = opSpec.options.altprefix;
  // }

  // whatever preceded the opening paren becomes the beginning of the list:
  return reader.read_delimited_list(lexer, openingParenForm, ')', [leftForm]);
}

// parenfree function declarations
function handleFuncs(lexer, text) {

  // note we use "text" so we can handle both "function" and "function*"
  var functionToken = lexer.next_token(text);
  var list = sl.list(sl.atom(text, {token: functionToken}));

  // the next form tells if it's a named, anonymous, or match function
  // note the use of next_token here (as oppsed to reader.read) ensures "fn(x)"
  // in e.g. "function fn(x)" isn't read as a *call* i.e. "(fn x)".
  var fName;
  // note here we can only allow valid *javascript* function names
  // (because this ultimately generates real javascript named functions)
  if(lexer.on(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g)) {
    var token = lexer.next_token(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g);
    fName = sl.atom(token.text, {token: token});
    list.push(fName);
  }
  // args
  if(lexer.on('(')) {
    var fArgs = reader.read_delimited_list(lexer, '(', ')', undefined);
    list.push(fArgs);
  }
  else if(lexer.on('~')) {
    // a macro declaring a function with unquoted args:
    list.push(reader.read(lexer));
  }
  var fBody;
  if(lexer.on('{')) {
    // read what's inside the curly braces as a (begin..) block:
    fBody = reader.read_delimited_list(lexer, '{', '}', ["begin"]);
    list.push(fBody);
  } else if(lexer.on('(')) {
    fBody = reader.read(lexer);
    list.push(fBody);
  }

  if(!(fName || fBody)) {
    lexer.error("malformed function declaration - missing arguments or body");
  }

  list.__parenoptional = true;
  return list;
};

// named and anonymous functions
exports['function'] = handleFuncs;

// es6 generator functions
exports['function*'] = handleFuncs;

// parenfree yield
exports['yield'] = reader.parenfree(1);
exports['yield*'] = reader.parenfree(1);

// sugarscript lets them omit parens on "export"
exports['export'] = reader.parenfree(2);

// "var" precedes a comma separated list of either:
//    name
// or:
//    name = val
//

exports['var'] = function(lexer, text) {

  var varToken = lexer.next_token(text);
  var list = sl.list(sl.atom("var", {token: varToken}));
  var moreVars = true;
  while(moreVars) {
    var varNameToken = lexer.next_token();
    var validName = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
    if (!validName.test(varNameToken.text)) {
      lexer.error("Invalid character in var name", varNameToken);
    }

    var varNameSym = sl.atom(varNameToken);
    list.push(varNameSym);

    if(lexer.on('=')) {
      // it's got an initializer
      lexer.skip_text('=');
      list.push(reader.read(lexer));
    }
    else {
      list.push("undefined");
    }

    moreVars = lexer.on(',');
    if(moreVars) {
      lexer.skip_text(',');
    }
  }

  return list;
};

// paren-free new keyword
// note lispy core expects e.g. (new Date), (new Date "October 13, 1975 11:13")
exports['new'] = function(lexer, text) {
  var newToken = lexer.next_token(text);
  var list = sl.list(sl.atom("new", {token: newToken}));
  var classConstructor = reader.read(lexer);
  // if(sl.isList(classConstructor)) {
  //   // splice the values in
  //   list.pushFromArray(classConstructor);
  // }
  // else {
    // push in the class name
    list.push(classConstructor);
//  }

  return list;
};

// parenfree template declarations
// note:  the "template" overlaps the newer html dialect, but
//   we still support "template" for backward compatibility.
exports['template'] = function(lexer) {

  var templateToken = lexer.next_token('template');
  var list = sl.list(sl.atom("template", {token: templateToken}));

  var tName;
  if(lexer.on(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g)) {
    var token = lexer.next_token(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g);
    tName = sl.atom(token.text, {token: token});
    list.push(tName);
  }
  else {
    lexer.error("invalid template name");
  }
  // args
  if(lexer.on('(')) {
    list.push(reader.read(lexer));
  }
  else {
    lexer.error("template arguments should be enclosed in parentheses");
  }

  if(lexer.on('{')) {
    var tBody = reader.read(lexer);
    tBody.forEach(function(expr,i) {
        if(i > 0) {
          list.push(expr);
        }
    });
  }
  else {
    lexer.error("template bodies in sugarscript are enclosed in {}");
  }

  list.__parenoptional = true;
  return list;
};


// parenfree macro declarations
exports['macro'] = function(lexer) {

  var macroToken = lexer.next_token('macro');
  var list = sl.list(sl.atom("macro", {token: macroToken}));

  // the next form tells if it's a named or anonymous macro
  var mName;
  // note here we do allow "lispy names" (i.e. more legal chars than javascript)
  if(lexer.on(/[a-zA-Z_$][0-9a-zA-Z_$\.\?\-\>]*/g)) {
    var token = lexer.next_token(/[a-zA-Z_$][0-9a-zA-Z_$\.\?\-\>]*/g);
    mName = sl.atom(token.text, {token: token});
    list.push(mName);
  }
  // args are surrounded by parens (even in sugarlisp core)
  if(lexer.on('(')) {
    list.push(reader.read(lexer));
  }
  else {
    lexer.error("a macro declaration's arguments should be enclosed in ()");
  }

  // in sugarscript the macro body is wrapped in {...}
  // note this is purely a grammar thing (it is *not* saying every macro is a "do")
  // also note that the reading of the macro body uses whatever dialects are
  // current i.e. the macro body is written in the dialect of the containing file.
  if(lexer.on('{')) {
    list.push(reader.read_wrapped_delimited_list(lexer, '{', '}'));
  }
  else {
    lexer.error("a macro declaration's body should be enclosed in {}");
  }

  list.__parenoptional = true;
  return list;
};

// sugarscript's "cond" and "switch" are paren free but they put {} around the body
// and use case/default in front of each condition
// note: text will be either "cond" or "switch"
/*
DELETE?
handleCondCase = function(lexer, text) {
  var condToken = lexer.next_token(text);
  var list = sl.list(sl.atom(text, {token: condToken}));
  if(text === "case") {
    // switch has the item to match (cond does not)
    // as with javascript - the switch value is wrapped in parens
    list.push(reader.read_wrapped_delimited_list(lexer, '(',')'));
  }
  if(lexer.on('{')) {
    var body = reader.read_delimited_list(lexer, '{', '}');
    if((body.length % 2) === 0) {
      body.forEach(function(caseForm) {
        // the body has pairs:
        if(sl.isList(caseForm)) {
          if(sl.valueOf(caseForm[0]) === 'case') {
            list.push(caseForm[1]);
            list.push(caseForm[2]);
          }
          else if(sl.valueOf(caseForm[0]) === 'default') {
            list.push(sl.atom(true));
            list.push(caseForm[1]);
          }
          else {
            lexer.error('a ' + text + ' expects "case" or "default" in its body');
          }
        }
        else {
          lexer.error('a ' + text + ' expects "case" or "default" in its body');
        }
      })
    }
    else {
      lexer.error("a " + text + " requires an even number of match pairs in it's body");
    }
  }
  else {
    lexer.error("a " + text + " body should be enclosed in {}");
  }

  list.__parenoptional = true;
  return list;
};

exports['cond'] = handleCondCase;
exports['case'] = handleCondCase;
*/

// we're doing cond and case in a *slightly* more javascripty syntax like e.g.
//   cond { (x === 0) "zero"; (x > 0) "positive"; }
// and
//   case(x) { 0 "zero"; 1 "one"; true "other"; }
exports['cond'] = reader.parenfree(1, {
  bracketed: 1,
  validate: function(lexer, forms) {
    // note the forms list *starts* with 'cond' hence the -1:
    if(((forms.length-1) % 2) !== 0) {
      lexer.error("a cond requires an even number of match pairs in it's body");
    }
  }
});

exports['case'] = reader.parenfree(2, {
  parenthesized: 1,
  bracketed: 2,
  validate: function(lexer, forms) {
    // note the forms list *starts* with 'case' and match hence the -2:
    if(((forms.length-2) % 2) !== 0) {
      lexer.error("a case requires an even number of match pairs in it's body");
    }
  }
});

// sugarscript's "match" is paren free except for parens around
// the thing to match (like the parens in "switch", "if", etc)
exports['match'] = function(lexer) {
  var matchToken = lexer.next_token('match');
  var matchAgainstList = reader.read(lexer);
  if(!(sl.isList(matchAgainstList))) {
    lexer.error("the expression to match must be surrounded by parentheses");
  }
  // the parens are just syntax sugar - reach inside:
  var matchAgainst = matchAgainstList[0];

  var list = sl.list(sl.atom("match", {token: matchToken}));
  list.push(matchAgainst);

  // the match cases are expected to be a single form surrounded by {}
  list.push(reader.read(lexer));

  list.__parenoptional = true;
  return list;
};

// match case/default do not need parens in sugarscript:
//exports['case'] = reader.parenfree(2);
//exports['default'] = reader.parenfree(1);

// sugarscript's "try" is paren free
// note: lispy core's treats all but the final catch function as the body
//   but sugarscript requires that a multi-expression body be wrapped in {}
exports['try'] = function(lexer) {
  var tryToken = lexer.next_token('try');
  var tryBody = reader.read(lexer);
  if(!(sl.isList(tryBody))) {
    lexer.error("try expects a body enclosed in () or {}");
  }
  var catchToken = lexer.next_token('catch');
  var catchArgs = reader.read(lexer);
  if(!(sl.isList(catchArgs))) {
    lexer.error("give a name to the exception to catch enclosed in ()");
  }
  var catchBody = reader.read(lexer);
  if(!(sl.isList(catchBody))) {
    lexer.error("the catch body must be enclosed in () or {}");
  }

  var list = sl.list(sl.atom("try", {token: tryToken}));
  list.push(tryBody);
  list.push(sl.list(sl.atom('function'), catchArgs, catchBody));

  list.__parenoptional = true;
  return list;
};

exports['throw'] = reader.parenfree(1);

// assignment
exports['='] = reader.infix(6, {altprefix:"set"});

// the following can be used infix or prefix
// precedence from:  http://www.scriptingmaster.com/javascript/operator-precedence.asp
// since for us higher precedence is a higher (not lower) number, ours are
// 20 - the numbers you see in the table on the page above
exports['*'] = reader.infix(17);
// DELETE exports['/'] = reader.infix(17); // what about regexes !!??
exports['%'] = reader.infix(17);
exports['+'] = reader.infix(16);

// note that right now in sugarscript e.g. "(- 1 5)" gets parsed as "((- 1) 5)"
// have not found an easy fix - ignoring for now (after all they would most likely
// use infix in sugarscript anyway).  Possibly some special case handling is
// needed - though it may be best in the end to *not* support prefix notation
// in sugarscript at all ("simplicity" and "reliability" > "flexibility"!!)
exports['-'] = reader.operator({
  prefix: reader.prefix(18, { assoc: "right" }),
  infix: reader.infix(16)
});

exports[">>"] = reader.infix(15);
exports["<<"] = reader.infix(15);
exports[">>>"] = reader.infix(15);
exports[">"] = reader.infix(14);
exports[">="] = reader.infix(14);
exports["<"] = reader.infix(14);
exports["<="] = reader.infix(14);
exports['==='] = reader.infix(13);
exports['=='] = reader.infix(13);
exports['!='] = reader.infix(13);
exports['!=='] = reader.infix(13);
exports["&&"] = reader.infix(9);
exports["||"] = reader.infix(8);
exports["+="] = reader.infix(7);
exports["-="] = reader.infix(7);
exports["*="] = reader.infix(7);
exports["/="] = reader.infix(7);
exports["%="] = reader.infix(7);
exports["<<="] = reader.infix(7);
exports[">>="] = reader.infix(7);
exports[">>>="] = reader.infix(7);

exports['/'] = reader.operator({
  prefix: reader.operator('prefix', 'unary', regex2expr, 18, { assoc: "right" }),
  infix: reader.infix(17)
});

function regex2expr(lexer, opSpec, openingSlashForm) {
  // desugar to core (regex ..)
  return sl.list("regex",
                sl.addQuotes(sl.valueOf(reader.read_delimited_text(lexer, undefined, "/",
                  {includeDelimiters: false}))));
}

exports["?"] = reader.operator('infix', 'binary', ternary2prefix, 7);

function ternary2prefix(lexer, opSpec, conditionForm, questionMarkForm) {

  var thenForm = reader.read(lexer);
  lexer.skip_token(":");
  var elseForm = reader.read(lexer, opSpec.precedence-1);
  return sl.list("ternary", conditionForm, thenForm, elseForm);
}

// if? expression
exports['if?'] = function(lexer) {
  var ifToken = lexer.next_token('if?');
// OLD DELETE  var condition = reader.read(lexer);

  // as with javascript - the condition is wrapped in parens
  var condition = reader.read_wrapped_delimited_list(lexer, '(',')');

  // if in core *is* an expression (a ternary)
  var list = sl.list(sl.atom("if?", {token: ifToken}));
  list.push(condition);
  list.push(reader.read(lexer));

  // note: if there's an else they *must* use the keyword "else"
  if(lexer.on('else')) {
    // there's an else clause
    lexer.skip_text('else');
    list.push(reader.read(lexer));
  }

  list.__parenoptional = true;
  return list;
};

// statements ///////////////////////////////////////////////////////
// the following are paren-free readers for commands that support use
// of javascript *statements*.  Even "return" is supported.  And yes -
// this is really weird for a "lisp"!

// if statement
exports['if'] = function(lexer) {
  var ifToken = lexer.next_token('if');
  condition = reader.read_wrapped_delimited_list(lexer, '(', ')');

  // note: scripty generates if *statements* - so we use "ifs" (not just "if")
  var list = sl.list(sl.atom("if", {token: ifToken}));
  list.push(condition);

  if(lexer.on('{')) {
    // we use "begin" here to avoid an an IIFE wrapper:
    list.push(reader.read_delimited_list(lexer, '{', '}', [sl.atom('begin')]));
  }
  else {
    // a single form for the true path:
    list.push(reader.read(lexer));
  }

  // note: if there's an else they *must* use the keyword "else"
  if(lexer.on('else')) {
    // there's an else clause
    lexer.skip_text('else');
    if(lexer.on('{')) {
      // we use "begin" here to avoid an an IIFE wrapper:
      list.push(reader.read_delimited_list(lexer, '{', '}', [sl.atom('begin')]));
    }
    else {
      // a single form for the else path:
      list.push(reader.read(lexer));
    }
  }

  list.__parenoptional = true;
  return list;
};

// return
// it's odd to even consider having return in a lisp (where everything
// is an expression).  Yet the statement/expression distinction is
// ingrained in javascript programmers.  And the lack of statements
// makes sugarlisp's generated code more complex (lots of IIFEs) where
// it has to ensure everything can compose as an expression.
exports['return'] = function(lexer) {

  // is this a "return <value>" or a "return;" (i.e. return undefined)?
  // note:  we *require* the semicolon if they're returning undefined
  //   (otherwise they can literally do "return undefined")
  var returnNothing = lexer.on("return;");
  var list = sl.list(sl.atom("return", {token: lexer.next_token('return')}));
  if(!returnNothing) {
    list.push(reader.read(lexer));
  }
  list.__parenoptional = true;
  return list;
};

// for statement
exports['for'] = function(lexer) {

  var forToken = lexer.next_token('for');
  var list = sl.list(sl.atom("for", {token: forToken}));
  if(lexer.on('(')) {
    lexer.skip_text('(');
    // initializer
    list.push(reader.read(lexer));
    // condition
    list.push(reader.read(lexer));
    // final expr
    list.push(reader.read(lexer));
    if(!lexer.on(')')) {
      lexer.error("Missing expected ')'" + lexer.snoop(10));
    }
    lexer.skip_text(')');
    if(lexer.on('{')) {
      list.push(reader.read_delimited_list(lexer, '{', '}', [sl.atom("begin")]));
    }
    else {
      list.push(reader.read(lexer));
    }
  }
  else {
    lexer.error("A for loop must be surrounded by ()");
  }

  list.__parenoptional = true;
  return list;
};

// switch statement
exports['switch'] = function(lexer) {
  var switchToken = lexer.next_token('switch');
  var switchon = reader.read_wrapped_delimited_list(lexer, '(', ')');
  var list = sl.list(sl.atom("switch", {token: switchToken}));
  list.push(switchon);

  if(!lexer.on('{')) {
    lexer.error("The body of a switch must be wrapped in {}");
  }
  lexer.skip_token('{');

  var read_case_body = function(lexer) {
    var body = sl.list(sl.atom("begin"));
    // read up till the *next* case/default or the end:
    while(!lexer.eos() && !lexer.on(/case|default|}/g)) {
      var nextform = reader.read(lexer);
      // some "directives" don't return an actual form:
      if(!reader.isignorableform(nextform)) {
        body.push(nextform);
      }
    }
    return body;
  };

  var token;
  while (!lexer.eos() && (token = lexer.peek_token()) && token && token.text !== '}') {

    // the s-expression is like cond - in pairs:
    // (note the default can't be "true" like cond - switches match *values*)
    var casetoken = lexer.next_token();
    var caseval = casetoken.text === 'case' ?
                    reader.read(lexer) : sl.atom('default');
    if(!lexer.on(":")) {
      lexer.error('Missing ":" after switch case?');
    }
    lexer.skip_token(":");
    list.push(caseval);
    list.push(read_case_body(lexer));
  }
  if (!token || lexer.eos()) {
      lexer.error('Missing "}" on switch body?', switchToken);
  }
  var endToken = lexer.next_token('}'); // skip the '}' token
  list.setClosing(endToken);

  return list;
};

exports['do'] = reader.parenfree(1, {bracketed: 1});

// paren free "while" takes a condition and a body
exports['while'] = reader.parenfree(2, {parenthesized: 1, bracketed: 2});
// paren free "dotimes" takes (var, count) then body
exports['dotimes'] = reader.parenfree(2, {parenthesized: 1, bracketed: 2});
// paren free "each" takes a list/array plus a function called with: each element,
// the position in the list, and the whole list.
exports['each'] = reader.parenfree(2);
