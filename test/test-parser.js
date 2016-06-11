const Parser = require('../src/sj-parser.js');
const test = require('tape');

const cases = [
  ['x', ['IDENT', 'x'], true],
  ['x.y', [ 'MEMBER', [ 'IDENT', 'x' ], [ [ '.', [ 'IDENT', 'y' ] ] ] ]],
  ['x.y.z', [ 'MEMBER', [ 'IDENT', 'x' ], [ [ '.', [ 'IDENT', 'y' ] ], [ '.', [ 'IDENT', 'z' ] ] ] ]],
  ['$x', ['IDENT', '$x']],
  ['x()', [ 'CALL', [ 'IDENT', 'x' ], [], [] ]],
  ['x(y)', [ 'CALL', [ 'IDENT', 'x' ], [ [ 'IDENT', 'y' ] ], [] ]],
  ['x.y(3,5)', [ 'CALL', [ 'MEMBER', [ 'IDENT', 'x' ], [ [ '.', [ 'IDENT', 'y' ] ] ] ], [ [ 'NUMBER', '3' ], [
   'NUMBER', '5' ] ], [] ]],
  ['add(3,5)', [ 'CALL', [ 'IDENT', 'add' ], [ [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [] ]],
  ['!add(3,5)', [ '!', [ 'CALL', [ 'IDENT', 'add' ], [ [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [] ] ]],
  ['3+5', [ '+', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3-5', [ '-', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['(3-5)', [ '-', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3||5', [ '||', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3||5||9', [ '||', [ '||', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [ 'NUMBER', '9' ] ]],
  ['3&&5&&9', [ '&&', [ '&&', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [ 'NUMBER', '9' ] ]],
  ['3|5|9', [ '|', [ '|', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [ 'NUMBER', '9' ] ]],
  ['3^5^9', [ '^', [ '^', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [ 'NUMBER', '9' ] ]],
  ['3&5&9', [ '&', [ '&', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ], [ 'NUMBER', '9' ] ]],
  ['3==5', [ '==', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3===5', [ '===', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3!=5', [ '!=', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3!==5', [ '!==', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3>=5', [ '>=', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3<=5', [ '<=', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3<5', [ '<', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3>5', [ '>', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
  ['3 instanceof 5', [ 'instanceof', [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ]],
];

for (const c of cases) {
  const [expr, expected, debug] = c;
  test(expr, t => {
    t.plan(1);
    const parser = new Parser(expr);
    parser.debug = debug;
    const got = parser.parse();
    t.deepEqual(got, expected, expr);
  });
}
