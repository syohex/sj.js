var test = require('tape');
var Element = require('../src/element.js');
require('../src/polyfill.js');

test('es6', t => {
  customElements.define('test-es6', class extends Element {
    template() {
      return `<input type="text" sj-model="this.filter" value="hoge">`;
    }
  });

  const elem = document.createElement('test-es6');
  t.plan(1);
  t.equal(elem.filter, 'hoge');
});

