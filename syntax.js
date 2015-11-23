var sl = require('sugarlisp-core/types'),
    src = require('sugarlisp-core/source'),
    reader = require('sugarlisp-core/reader'),
    corerfuncs = require('sugarlisp-core/readfuncs'),
    coresyntax = require('sugarlisp-core/syntax');

/*
// traditional function call style with name then paren i.e. fn(args..)
// note:  they *must* omit spaces between function name and opening arg paren
exports['__sugarscript_tradfncall'] =
{
  // function name then paren
  // note we're allowing for lispy names e.g. "null?", "int->str", "<-alts" etc.
  match:  /[a-zA-Z\$\?\*\+\-\~\_\<\>][0-9a-zA-Z\$\?\*\+\-\~\_\<\>]*\(/g,
  // set priority early so e.g. "each(" is matched not "each"
  priority: 100,
  read:
    function(source) {
      var form;
      // note: can't use peek_token below
      //   (since that uses the syntax table that's an infinite loop!)
      var token = source.peek_delimited_token(undefined, "(");
      if(token) {
        if(source.on(token.text + '(')) {
          // here we make sure we don't take over from *explicit* handlers though
          // e.g. we can't have e.g. "function(", "if(", etc. handled by this!
          // (after all in sugarscript these are *paren-free*)
          var dialect = reader.get_current_dialect(source);
          if(!dialect.syntax[token.text] || dialect.syntax[token.text] == reader.symbol) {
            // we are on a ( that had no space between it and the preceding symbol
            // treat it as a normal list but make the symbol be the first element
            token = source.next_token(/[a-zA-Z\$\?\*\+\-\~\_\<\>][0-9a-zA-Z\$\?\*\+\-\~\_\<\>]/g);
            var list = corerfuncs.read_delimited_list(source, '(', ')',
                                        [sl.atom(token.text, {token: token})]);
            return list;
          }
          else {
            // let the other handlers take it:
            return reader.retry_match;
          }
        }
        else {
          // this should never happen since our regex includes the "(":
          form = sl.atom(token.text, {token: token});
        }
      }
      return form;
    }
};
*/

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

//  postfix: reader.operator('postfix', 'binary', tradfncalltosexpr, 17.5, {beforeRead: noCustomReader})

function readparenthesizedlist(source, opSpec, openingParenForm) {
  // note since '(' is defined as a prefix operator the '(' has already been read
  // read_delimited_list infers this because we pass openingParenForm below
  return corerfuncs.read_delimited_list(source, openingParenForm, ')');
}

// NOT SURE WE NEEDED THIS AFTER ALL
// sugarscript (esp) has customized read handlers for paren-free
// "function(", "if(", etc. This "beforeRead" function makes sure
// the reader doesn't treat those as normal function calls.
// function noCustomReader(source, opSpec, leftForm) {
//   var retry;
//   var dialect = reader.get_current_dialect(source);
//   if(sl.isAtom(leftForm) &&
//     dialect.syntax[leftForm.text] &&
//     !dialect.syntax[leftForm.text] == reader.symbol)
//   {
//     // let the other handlers take it:
//     retry = reader.retry_match;
//   }
//   return retry;
// }

//  postfix: reader.operator('postfix', 'unary', tradfncalltosexpr, 17.5, {altprefix: "fncall("})

// note the reader calls tradfncalltosexpr *after* reading the opening paren
function tradfncalltosexpr(source, opSpec, leftForm, openingParenForm) {

// do we really need this?
  // if(opSpec.options.altprefix) {
  //   opForm = utils.clone(opForm);
  //   opForm.value = opSpec.options.altprefix;
  //   opForm.text = opSpec.options.altprefix;
  // }

  // whatever preceded the opening paren becomes the beginning of the list:
  return corerfuncs.read_delimited_list(source, openingParenForm, ')', [leftForm]);
}

// traditional array/object access with name then bracket i.e. arr[(index or prop)]
// note:  they *must* omit spaces between variable name and the opening bracket
exports['__sugarscript_objarraylookup'] =
{
  // legal variable name then square bracket
  match:  /[a-zA-Z_$][0-9a-zA-Z_$\.]*\[/g,
  // set priority early so e.g. "arr[" is matched not just "arr"
  priority: 99,
  read:
    function(source) {
      var form;
      // note: can't use peek_token below
      //   (since that uses the syntax table that's an infinite loop!)
      var token = source.next_delimited_token(undefined, "[");
      if(token) {
        form = sl.list(sl.atom('get', {token: token}),
                          reader.read(source),
                          sl.atom(token.text));
        source.skip_token("]");
      }
      return form;
    }
};

// parenfree function declarations
function handleFuncs(source, text) {

  // note we use "text" so we can handle both "function" and "function*"
  var functionToken = source.next_token(text);
  var list = sl.list(sl.atom(text, {token: functionToken}));

  // the next form tells if it's a named, anonymous, or match function
  // note the use of next_token here (as oppsed to reader.read) ensures "fn(x)"
  // in e.g. "function fn(x)" isn't read as a *call* i.e. "(fn x)".
  var fName;
  if(source.on(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g)) {
    var token = source.next_token(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g);
    fName = sl.atom(token.text, {token: token});
    list.push(fName);
  }
  // args
  if(source.on('(')) {
    var fArgs = corerfuncs.read_delimited_list(source, '(', ')', undefined);
    list.push(fArgs);
  }
  else if(source.on('~')) {
    // a macro declaring a function with unquoted args:
    list.push(reader.read(source));
  }
  var fBody;
  if(source.on('{')) {
    // by default we assume there's no need for a "do" IIFE wrapper -
    // so we read what's *inside* the curly braces:
    fBody = corerfuncs.read_delimited_list(source, '{', '}');
    // our infix translation sometimes leads to extra wrapper parens:
// COMMENTING I *THINK* THIS NOT NEEDED ANYMORE?
    // if(fBody.length === 1 && sl.isList(fBody[0])) {
    //    fBody = fBody[0]; // unwrap
    // }

    // sometimes we need an IIFE wrapper
    if(sl.isList(fBody) && fBody.length > 0 && sl.isList(fBody[0])) {
      // yet function* can't have it cause you can't yield in a normal function!
      fBody.unshift(sl.atom(text !== 'function*' ? "begin" : "begin"));
    }
    list.push(fBody);
  } else if(source.on('(')) {
    fBody = reader.read(source);
    list.push(fBody);
  }

  if(!(fName || fBody)) {
    source.error("malformed function declaration - missing arguments or body");
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

// commas are needed in sugarscript e.g. in something like "var x,y"
// to know where the unparenthesized-yet-variable-length form ends
exports[','] = reader.symbol;

// "var" precedes a comma separated list of either:
//    name
// or:
//    name = val
//

exports['var'] = function(source, text) {

  var varToken = source.next_token(text);
  var list = sl.list(sl.atom("var", {token: varToken}));
  var moreVars = true;
  while(moreVars) {
    var varNameToken = source.next_token();
    var validName = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
    if (!validName.test(varNameToken.text)) {
      source.error("Invalid character in var name", varNameToken);
    }

    var varNameSym = sl.atom(varNameToken);
    list.push(varNameSym);

    if(source.on('=')) {
      // it's got an initializer
      source.skip_text('=');
      list.push(reader.read(source));
    }
    else {
      list.push("undefined");
    }

    moreVars = source.on(',');
    if(moreVars) {
      source.skip_text(',');
    }
  }

  return list;
};

// paren-free new keyword
// note lispy core expects e.g. (new Date), (new Date "October 13, 1975 11:13")
exports['new'] = function(source, text) {
  var newToken = source.next_token(text);
  var list = sl.list(sl.atom("new", {token: newToken}));
  var classConstructor = reader.read(source);
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

// if expression
exports['if'] = function(source) {
  var ifToken = source.next_token('if');
  var condition = reader.read(source);

  // if in core *is* an expression (a ternary)
  var list = sl.list(sl.atom("if", {token: ifToken}));
  list.push(condition);
  list.push(reader.read(source));

  // note: if there's an else they *must* use the keyword "else"
  if(source.on('else')) {
    // there's an else clause
    source.skip_text('else');
    list.push(reader.read(source));
  }

  list.__parenoptional = true;
  return list;
};

// parenfree template declarations
// note:  the "template" overlaps the newer html dialect, but
//   we still support "template" for backward compatibility.
exports['template'] = function(source) {

  var templateToken = source.next_token('template');
  var list = sl.list(sl.atom("template", {token: templateToken}));

  var tName;
  if(source.on(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g)) {
    var token = source.next_token(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g);
    tName = sl.atom(token.text, {token: token});
    list.push(tName);
  }
  else {
    source.error("invalid template name");
  }
  // args
  if(source.on('(')) {
    list.push(reader.read(source));
  }
  else {
    source.error("template arguments should be enclosed in parentheses");
  }

  if(source.on('{')) {
    var tBody = reader.read(source);
    tBody.forEach(function(expr,i) {
        if(i > 0) {
          list.push(expr);
        }
    });
  }
  else {
    source.error("template bodies in sugarscript are enclosed in {}");
  }

  list.__parenoptional = true;
  return list;
};


// parenfree macro declarations
exports['macro'] = function(source) {

  var macroToken = source.next_token('macro');
  var list = sl.list(sl.atom("macro", {token: macroToken}));

  // the next form tells if it's a named or anonymous macro
  var mName;
  if(source.on(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g)) {
    var token = source.next_token(/[a-zA-Z_$][0-9a-zA-Z_$\.]*/g);
    mName = sl.atom(token.text, {token: token});
    list.push(mName);
  }
  // args
  if(source.on('(')) {
    list.push(reader.read(source));
  }
  else {
    source.error("a macro declaration's arguments should be enclosed in ()");
  }

  // in sugarscript the macro body is wrapped in either {} or ():
  if(source.on('{')) {
    list.push(corerfuncs.read_delimited_list(source, '{', '}'));
  }
  else if(source.on('(')) {
    list.push(reader.read(source));
  }
  else {
    source.error("a macro declaration's body should be enclosed in () or {}");
  }

  list.__parenoptional = true;
  return list;
};

// sugarscript's "cond" and "switch" are paren free but they put {} around the body
// and use case/default in front of each condition
// note: text will be either "cond" or "switch"
handleCondSwitch = function(source, text) {
  var condToken = source.next_token(text);
  var list = sl.list(sl.atom(text, {token: condToken}));
  if(text === "switch") {
    // switch has the item to match (cond does not)
    list.push(reader.read(source));
  }
  if(source.on('{')) {
    var condBody = corerfuncs.read_delimited_list(source, '{', '}');
    condBody.forEach(function(caseForm) {
      // our case/default are e.g. (case (!= 0) ...) but lispy core
      // expects simple pairs and no "case" or "default":
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
          source.error('a ' + text + ' expects "case" or "default" in its body');
        }
      }
      else {
        source.error('a ' + text + ' expects "case" or "default" in its body');
      }
    })
  }
  else {
    source.error("a " + text + " body should be enclosed in {}");
  }

  list.__parenoptional = true;
  return list;
};

exports['cond'] = handleCondSwitch;
exports['switch'] = handleCondSwitch;

// sugarscript's "match" is paren free except for parens around
// the thing to match (like the parens in "switch", "if", etc)
exports['match'] = function(source) {
  var matchToken = source.next_token('match');
  var matchAgainstList = reader.read(source);
  if(!(sl.isList(matchAgainstList))) {
    source.error("the expression to match must be surrounded by parentheses");
  }
  // the parens are just syntax sugar - reach inside:
  var matchAgainst = matchAgainstList[0];

  var list = sl.list(sl.atom("match", {token: matchToken}));
  list.push(matchAgainst);

  // the match cases are expected to be a single form surrounded by {}
  list.push(reader.read(source));

  list.__parenoptional = true;
  return list;
};

// match case/default do not need parens in sugarscript:
exports['case'] = reader.parenfree(2);
exports['default'] = reader.parenfree(1);

// sugarscript's "try" is paren free
// note: lispy core's treats all but the final catch function as the body
//   but sugarscript requires that a multi-expression body be wrapped in {}
exports['try'] = function(source) {
  var tryToken = source.next_token('try');
  var tryBody = reader.read(source);
  if(!(sl.isList(tryBody))) {
    source.error("try expects a body enclosed in () or {}");
  }
  var catchToken = source.next_token('catch');
  var catchArgs = reader.read(source);
  if(!(sl.isList(catchArgs))) {
    source.error("give a name to the exception to catch enclosed in ()");
  }
  var catchBody = reader.read(source);
  if(!(sl.isList(catchBody))) {
    source.error("the catch body must be enclosed in () or {}");
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

// have commented the prefix line below because with it, an
// example like "(- 1 5)" gets parsed as "((- 1) 5)" !!
// but without it the space between the "-" and the number
// becomes properly significant
exports['-'] = reader.operator({
//  prefix: reader.prefix(18, { assoc: "right" }),
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

function regex2expr(source, opSpec, openingSlashForm) {
  // desugar to core (regex ..)
  return sl.list("regex",
                sl.addQuotes(sl.valueOf(corerfuncs.read_delimited_text(source, undefined, "/",
                  {includeDelimiters: false}))));
}

exports["?"] = reader.operator('infix', 'binary', ternary2prefix, 7);

function ternary2prefix(source, opSpec, conditionForm, questionMarkForm) {

  var thenForm = reader.read(source);
  source.skip_token(":");
  var elseForm = reader.read(source, opSpec.precedence-1);
  return sl.list("ternary", conditionForm, thenForm, elseForm);
}

// paren free "while" takes a condition and a body
exports['while'] = reader.parenfree(2);
// paren free "times" takes a var, count, and body
exports['times'] = reader.parenfree(3);
// paren free "each" takes a list/array plus a function called with each element,
// (and optionally two args more - the position in the list, and the whole list)
exports['each'] = reader.parenfree(2);

/*
OLD
// disambiguate / for div versus regexes
// see .e.g.
//   http://stackoverflow.com/questions/5519596/when-parsing-javascript-what-determines-the-meaning-of-a-slash
exports['/'] = function(source, text) {

  var slashyregex = function(source) {
    var matched;
    // note the "last token" chars are those used by jslint
console.log("IN SLASHYREGEX lastToken is:", source.lastToken.text);
    if (source.on("/") && (source.lastToken &&
        "(,=:[!&|?{};".indexOf(source.lastToken.text) !== -1))
    {
      matched = source.peek_delimited_token("/");
      if(matched) {
        matched = matched.text;
      }
    }
    return matched;
  };

  if(slashyregex(source)) {
    // desugar to core (regex ..)
    return sl.list("regex",
                  sl.addQuotes(sl.valueOf(rfuncs.read_delimited_text(source, "/", "/",
                    {includeDelimiters: false}))));
  }
  else {
    // this was just a plain old '/' by itself
    return reader.symbol(source, text);
  }
}
*/
