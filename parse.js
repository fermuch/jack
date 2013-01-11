var Parser = require("jison").Parser;

var grammar = {
  lex: {
    rules: [
      ["\\s*$",                  "return 'EOF';"],
      ["<<\\s*",                 "return '<<';"],
      ["\\s*>>",                 "return '>>';"],
      ["<\\[\\s*",               "return '<[';"],
      ["\\s*\\]>",               "return ']>';"],
      ["\\{\\s*",                "return '{';"],
      ["\\s*\\}",                "return '}';"],
      ["\\(\\s*",                "return '(';"],
      ["\\s*\\)",                "return ')';"],
      ["\\s*\\n\\s*",            "return 'TERMINATOR';"],
      ["[ \t]*;[ \t]*",          "return 'TERMINATOR';"],
      ["(nil|true|false)\\b",    "return 'CONSTANT';"],
      ["while\\b",               "return 'WHILE';"],
      ["from\\b",                "return 'FROM';"],
      ["to\\b",                  "return 'TO';"],
      ["by\\b",                  "return 'BY';"],
      ["return\\b",              "return 'RETURN';"],
      ["if\\b",                  "return 'IF';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*", "return 'IDENT';"],
      ["-?[1-9][0-9]*",          "return 'INTEGER';"],
      ["0",                      "return 'INTEGER';"],
      ["\"((?:\\.|[^\"])*)\"",   "return 'STRING';"],
      ["'((?:\\.|[^'])*)'",      "return 'STRING';"],
      ["[ \t]+",                 "/* skip whitespace */"],
      [":=",                     "return ':=';"],
      ["!",                      "return '!';"],
      ["\\+",                    "return '+';"],
      ["-",                      "return '-';"],
      ["\\*",                    "return '*';"],
      ["\\/",                    "return '/';"],
      ["\\?",                    "return '?';"],
      [":",                      "return ':';"],
      ["<=",                     "return '<=';"],
      ["<",                      "return '<';"],
      [">=",                     "return '>=';"],
      [">",                      "return '>';"],
      ["~=",                     "return '~=';"],
      ["~",                      "return '~';"],
      ["==",                     "return '==';"],
      ["=",                      "return '=';"],
      ["&&",                     "return '&&';"],
      ["\\.",                    "return '.';"],
      ["\\[",                    "return '[';"],
      ["\\]",                    "return ']';"],
      ["\\|\\|",                 "return '||';"],
      ["\\^\\^",                 "return '^^';"],
      ["\\|\\s*",                "return '|';"],
    ]
  },

  operators: [
    ["right", '='],
    ["right", "?", ":"],
    ["left", '||', '^^'],
    ["left", '&&'],
    ["left", '<', '<=', '>', '>=', '==', '~='],
    ["left", '+', '-'],
    ["left", '*', '/'],
    ["left", '~'],
    ["left", '!'],
    ["left", '.', "[", "]"],
  ],

  bnf: {
    // The program is 0 or more items
    root: [
      ["block0 EOF", "return $1"],
    ],
    // Zero or more items with terminators in-between
    block0: [
      ["", "$$ = []"],
      ["block1", "$$ = $1"],
    ],
    // One or more items with terminators in-between
    block1: [
      ["item", "$$ = [$1]"],
      ["block1 term item", "$$ = $1.concat([$3])"],
    ],
    // Two or more items with terminators in-between
    block2: [
      ["item term item", "$$ = [$1, $3]"],
      ["block2 term item", "$$ = $1.concat([$3])"],
    ],
    // One or more terminators
    term: [
      "TERMINATOR", "term TERMINATOR",
    ],
    item: [
      // ["LINECOMMENT", "$$ = ['COMMENT', $1]"],
      ["expr", "$$ = $1"],
      ["statement", "$$ = $1"],
    ],
    params: [
      ["IDENT", "$$ = [$1]"],
      ["params IDENT", "$$ = $1.concat([$2])"],
    ],
    pair: [
      ["IDENT = basic", "$$ = ['PAIR', ['VALUE', $1], $3]"],
      ["string = basic", "$$ = ['PAIR', $1, $3]"],
      ["[ basic ] = basic", "$$ = ['PAIR', $2, $5]"],
    ],
    map: [
      ["", "$$ = []"],
      ["map pair", "$$ = $1.concat([$2])"],
      ["map pair term", "$$ = $1.concat([$2])"],
    ],
    list: [
      ["", "$$ = []"],
      ["list basic", "$$ = $1.concat([$2])"],
      ["list basic term", "$$ = $1.concat([$2])"],
    ],
    string: [
      ["STRING", "$$ = ['VALUE', eval($1)];"],
    ],
    // expressions that can be used at function arguments or list items or map literal values.
    basic: [
      ["{ block0 }", "$$ = ['FUNCTION', [], $2]"],
      ["{ | params | block0 }", "$$ = ['FUNCTION', $3, $5]"],
      ["<< map >>", "$$ = ['MAP', $2]"],
      ["IDENT", "$$ = ['IDENT', $1]"],
      ["( expr )", "$$ = $2"],
      ["( block2 )", "$$ = ['BLOCK', $2]"],
      ["INTEGER", "$$ = ['VALUE', parseInt($1, 10)];"],
      ["CONSTANT", "$$ = ['VALUE', $1 === 'true' ? true : $1 === 'false' ? false : null];"],
      ["string", "$$ = $1"],
      ["<[ list ]>", "$$ = ['LIST', $2]"],
      ["basic !", "$$ = ['EXEC', $1, []]"],
      ["basic [ basic ]", "$$ = ['LOOKUP', $1, $3];"],
      ["basic . IDENT", "$$ = ['LOOKUP', $1, ['VALUE', $3]];"],
      ["~ basic", "$$ = ['NOT', $2];"],
      ["basic ? basic : basic", "$$ = ['COND', $1, $3, $5];"],
      ["basic + basic", "$$ = ['ADD', $1, $3];"],
      ["basic - basic", "$$ = ['SUB', $1, $3];"],
      ["basic * basic", "$$ = ['MUL', $1, $3];"],
      ["basic / basic", "$$ = ['DIV', $1, $3];"],
      ["basic < basic", "$$ = ['LT', $1, $3];"],
      ["basic <= basic", "$$ = ['LTE', $1, $3];"],
      ["basic > basic", "$$ = ['GT', $1, $3];"],
      ["basic >= basic", "$$ = ['GTE', $1, $3];"],
      ["basic == basic", "$$ = ['EQ', $1, $3];"],
      ["basic ~= basic", "$$ = ['NEQ', $1, $3];"],
      ["basic && basic", "$$ = ['AND', $1, $3];"],
      ["basic || basic", "$$ = ['OR', $1, $3];"],
      ["basic ^^ basic", "$$ = ['XOR', $1, $3];"],
    ],
    // calls with arguments can only exist at the toplevel of blocks
    // or as return values or assignment values.
    // use parens to use them elsewhere
    // Same goes for assignments when using as expressions
    expr: [
      ["basic", "$$ = $1"],
      ["basic ! args", "$$ = ['EXEC', $1, $3]"],
      ["basic = expr", "$$ = ['ASSIGN', $1, $3];"],
    ],
    args: [
      ["basic", "$$ = [$1]"],
      ["args basic", "$$ = $1.concat([$2])"],
    ],
    statement: [
      ["RETURN", "$$ = ['RETURN', ['VALUE', null]];"],
      ["RETURN expr", "$$ = ['RETURN', $2];"],
      ["IDENT := expr", "$$ = ['DEF', $1, $3]"],
      ["IF basic item", "$$ = ['IF', $2, $3]"],
      ["FROM basic TO basic basic", "$$ = ['FROM', $2, $4, ['VALUE', 1], $5]"],
      ["FROM basic TO basic BY basic basic", "$$ = ['FROM', $2, $4, $6, $7]"],
      ["WHILE basic basic", "$$ = ['WHILE', $2, $3]"],
    ],
  }
};

var filename = process.argv[2] || "sample.jk";
console.log("Parsing: " + filename);
var code = require('fs').readFileSync(filename, "utf8");

// strip comments and normalize line-endings
code = code.split(/(?:\n|\r\n|\r)/g).map(function (line) {
  var state = false;
  for (var i = 0, l = line.length; i < l; i++) {
    var c = line.charAt(i);
    switch (state) {
      case false:
        if (c === "'" || c === '"') {
          state = c;
        }
        else if (c === "-") {
          state = "-";
        }
        break;
      case '\\':
        state = false;
        break;
      case '"': case "'":
        if (c === "\\") {
          state = "\\";
        }
        else if (c === state) {
          state = false;
        }
        break;
      case '-':
        if (c === "-") {
          return line.substr(0, i - 1).replace(/\s+$/, '');
        }
        state = false;
        break;
    }
  }
  return line.replace(/\s+$/, '');
}).join("\n");

// Trim lines at beginning and record how many there were
var lineOffset = 0;
var match = code.match(/^([ \t]*\n)*/)[0];
if (match) {
  lineOffset = match.match(/\n/g).length;
  code = code.substr(match.length);
}
// Trim all trailing whitespace
code = code.replace(/\s*$/, "");

var parser = new Parser(grammar, {type: "lalr"});
var tree = parser.parse(code);
console.log(require('util').inspect(tree, false, 10, true));
