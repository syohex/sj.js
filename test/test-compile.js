var test = require('tape');
var Compiler = require('../src/sj');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

test('foo', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = '<div id="foo"></div>';
  const code = new Compiler().compile(div);
  var target = document.createElement('target');
  target.update = function () { };
  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });
  t.equal(target.querySelector('div').getAttribute('id'), 'foo');
});
test('sj-if', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    <div id="foo" sj-if="this.foo"></div>
    <div id="bar" sj-if="this.bar"></div>
  `;
  const code = new Compiler().compile(div);
  var target = document.createElement('target');
  target.update = function () { };
  target.foo = true;
  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });
  t.ok(target.querySelector('#foo'));
  t.ok(!target.querySelector('#bar'));
});
test('sj-repeat', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-repeat="book in this.books">
      <div class="book">{{book.name}}</div>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.books = [{name: 'hoge'}, {name: 'fuga'}];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });


  const books = target.querySelectorAll('.book');
  t.equal(books.length, 2);
});
test('sj-click', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-click="this.called = true"></div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.books = [{name: 'hoge'}, {name: 'fuga'}];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  target.querySelector('div').click();

  t.ok(target.called);
});
test('sj-disabled', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    <div class="t" sj-disabled="true"></div>
    <div class="f" sj-disabled="false"></div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  t.equal(target.querySelector('.t').getAttribute('disabled'), 'disabled');
  t.ok(!target.querySelector('.f').getAttribute('disabled'));
});
test('replace {{}}', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    {{this.foo}}
    <div>{{this.bar}}</div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.foo = 'foo';
  target.bar = 'bar';

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  t.ok(target.innerHTML.match(/foo/));
  t.ok(target.innerHTML.match(/bar/));
});

