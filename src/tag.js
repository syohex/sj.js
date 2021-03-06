const Compiler = require('./compiler');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
const Aggregator = require('./aggregator.js');

var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

function tag(tagName, opts) {
  const template = opts.template;
  delete opts['template'];
  if (!template) {
    throw "Missing template";
  }

  const scope = opts['default'] || {};
  let compiled;

  const elementClassPrototype = Object.create(HTMLElement.prototype);
  const elementClass = class extends HTMLElement {
    createdCallback() {
      if (!compiled) {
        const html = document.createElement("div");
        html.innerHTML = (function () {
          if (typeof(template) === 'function') {
            return unwrapComment.exec(template.toString())[1];
          } else {
            return template;
          }
        })();
        new Aggregator(html).aggregate(scope);
        compiled = new Compiler().compile(html);
      }

      for (const key in scope) {
        if (scope.hasOwnProperty(key)) {
          this[key] = scope[key];
        }
      }

      if (opts.initialize) {
        opts.initialize.apply(this);
      }
      this.update();
    }

    attributeChangedCallback(key) {
      this[key] = this.getAttribute(key);
      this.update();
    }

    update() {
      IncrementalDOM.patch(this, () => {
        compiled.apply(this, [IncrementalDOM]);
      });
    }

    dump() {
      const scope = {};
      Object.keys(this).forEach(key => {
        if (key !== 'renderer') {
          scope[key] = this[key];
        }
      });
      return scope;
    }
  };

  if (opts.methods) {
    for (const name in opts.methods) {
      elementClass.prototype[name] = opts.methods[name];
    }
  }

  if (opts.accessors) {
    for (const name in opts.accessors) {
      Object.defineProperty(elementClass.prototype, name, {
        get: opts.accessors[name].get,
        set: opts.accessors[name].set
      });
    }
  }

  customElements.define(tagName, elementClass);
}

module.exports = tag;

