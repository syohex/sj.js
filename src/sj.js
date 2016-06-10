const sjExpression = require('./sj-expression.js');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

require('String.prototype.startsWith');

const sj_attr2event = {
  'sj-click': 'onclick',
  'sj-blur': 'onblur',
  'sj-checked': 'onchecked',
  'sj-dblclick': 'ondblclick',
  'sj-focus': 'onfocus',
  'sj-keydown': 'onkeydown',
  'sj-keypress': 'onkeypress',
  'sj-keyup': 'onkeyup',
  'sj-mousedown': 'onmousedown',
  'sj-mouseenter': 'onmouseenter',
  'sj-mouseleave': 'onmouseleave',
  'sj-mousemove': 'onmousemove',
  'sj-mouseover': 'onmouseover',
  'sj-mouseup': 'onmouseup',
  'sj-paste': 'onpaste',
  'sj-selected': 'onselected',
  'sj-submit': 'onsubmit'
};

function isFormElement(elem) {
  return elem instanceof HTMLInputElement
    || elem instanceof HTMLTextAreaElement
      || elem instanceof HTMLSelectElement;
}

// babel hacks
// See https://phabricator.babeljs.io/T1548
if (typeof HTMLElement !== 'function') {
  var _HTMLElement = function () {
  };
  _HTMLElement.prototype = HTMLElement.prototype;
  HTMLElement = _HTMLElement;
}

class ForRenderer {
  constructor(renderer, element, items, scope, varName) {
    this.renderer = renderer;
    this.element = element;
    this.items = items;
    this.scope = scope;
    this.varName = varName;
  }

  render() {
    let i = 0;
    for (const item of this.items) {
      const currentScope = Object.assign({}, this.scope);
      currentScope[this.varName] = item;
      currentScope['$index'] = i++;
      this.renderer.renderDOM(this.element, currentScope);
    }
  }
}

class SJRenderer {
  constructor(targetElement, templateElement, scope) {
    this.targetElement = targetElement;
    this.templateElement = templateElement;
    this.scope = scope;
  }

  render() {
    if (this.rendering) {
      return;
    }

    try {
      this.rendering = true;

      IncrementalDOM.patch(this.targetElement, () => {
        const children = this.templateElement.children;
        for (let i = 0; i < children.length; ++i) {
          this.renderDOM(children[i], this.scope);
        }
      });
    } finally {
      this.rendering = false;
    }
  }

  renderDOM(elem, scope) {
    if (elem.nodeType === Node.TEXT_NODE) {
      IncrementalDOM.text(this.replaceVariables(elem.textContent, scope));
      return;
    }
    if (this.shouldHideElement(elem, scope)) {
      return;
    }

    const tagName = elem.tagName.toLowerCase();

    IncrementalDOM.elementOpenStart(tagName);
    const [modelName, forRenderer] = this.renderAttributes(elem, scope);
    const modelValue = modelName? sjExpression.getValueByPath(scope, modelName, this.targetElement) : null;
    const isForm = isFormElement(elem);
    if (modelName && modelValue && scope[modelName] && isForm) {
      IncrementalDOM.attr("value", modelValue);
    }
    IncrementalDOM.elementOpenEnd(tagName);
    const children = elem.childNodes;
    if (forRenderer) {
      forRenderer.render();
    } else {
      for (let i = 0, l = children.length; i < l; ++i) {
        const child = children[i];
        if (child.nodeType === Node.TEXT_NODE) {
          if (!modelName) {
            IncrementalDOM.text(this.replaceVariables(child.textContent, scope));
          }
        } else {
          this.renderDOM(child, scope);
        }
      }
    }
    if (modelName && modelValue && !isForm) {
      IncrementalDOM.text(modelValue);
    }
    IncrementalDOM.elementClose(tagName);
  }

  shouldHideElement(elem, scope) {
    const cond = elem.getAttribute('sj-if');
    if (cond) {
      const val = sjExpression.getValueByPath(scope, cond, this.targetElement);
      if (!val) {
        return true;
      }
    }
    return false;
  }

  renderAttributes(elem, scope) {
    let modelName;
    const attrs = elem.attributes;
    let forRenderer;
    for (let i = 0, l = attrs.length; i < l; ++i) {
      const attr = attrs[i];
      const attrName = attr.name;
      let hasModelAttribute;
      [hasModelAttribute, forRenderer] = this.renderAttribute(attrName, attr, elem, scope);
      if (hasModelAttribute) {
        modelName = attr.value;
      }
    }
    return [modelName, forRenderer];
  }

  renderAttribute(attrName, attr, elem, scope) {
    let isModelAttribute;
    let forRenderer;
    if (attrName.startsWith('sj-')) {
      const event = sj_attr2event[attrName];
      if (event) {
        IncrementalDOM.attr(event, (e) => {
          const currentScope = Object.assign({}, scope);
          currentScope['$event'] = e;
          sjExpression.getValueByPath(currentScope, attr.value, this.targetElement);
        });
      } else if (attr.name === 'sj-model') {
        isModelAttribute = attr.value;
        IncrementalDOM.attr("onchange", (e) => {
          sjExpression.setValueByPath(scope, attr.value, e.target.value);
          this.render();
        });
        if (!scope[attr.value]) {
          scope[attr.value] = elem.value;
        }
      } else if (attr.name === 'sj-repeat') {
        const m = attr.value.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/);
        if (!m) {
          throw "Invalid sj-repeat value: " + m;
        }

        const varName = m[1];
        const container = m[2];

        const e = elem.querySelector('*');
        forRenderer = new ForRenderer(this, e, scope[container], scope, varName);
      }
    } else {
      const labelValue = this.replaceVariables(attr.value, scope);
      IncrementalDOM.attr(attr.name, labelValue);
    }
    return [isModelAttribute, forRenderer];
  }

  replaceVariables(label, scope) {
    return label.replace(/\{\{([$A-Za-z0-9_.-]+)\}\}/g, (m, s) => {
      if (s === '$_') {
        return JSON.stringify(scope);
      } else {
        return sjExpression.getValueByPath(scope, s, this.targetElement);
      }
    });
  }

}

class SJElement extends HTMLElement {
  createdCallback() {
    this.scope = {};

    // parse template
    var template = this.template();
    if (template instanceof Function) {
      template = template.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
  }
  const html = document.createElement("div");
  html.innerHTML = template;
  this.renderer = new SJRenderer(this, html, this.scope);

  this.initialize();

  this.update();
}

template() {
  throw "Please implement 'template' method";
}

attributeChangedCallback(key) {
  this[key] = this.getAttribute(key);
  this.update();
}

initialize() {
  // nop. abstract method.
}

update() {
  this.renderer.render();
}
  }

  module.exports.SJElement = SJElement;
  module.exports.SJRenderer = SJRenderer;

