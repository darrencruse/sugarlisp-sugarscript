var sl = require('sugarlisp-core/types'),
    corerfuncs = require('sugarlisp-core/readfuncs');

// read the expression *inside* delimiters in the javascript style
// e.g. read an if or while's (condition) etc.
// This is needed to avoid some problems consider e.g. that a simple
// usage of lispy core's reader of e.g. if(true) see's that as a
// *call* of the *function* true.  This function corrects that.
//
exports.read_wrapped_delimited_list = function(source, start, end, initial, separatorRE) {

  var list = corerfuncs.read_delimited_list(source, start, end, initial, separatorRE);
  if(list.length === 1 &&
    (sl.isList(list[0]) || sl.typeOf(list[0]) === 'boolean'))
  {
      // there's an extra nesting level than needed:
      list = list[0];
  }
  return list;
}
