(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sj = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.IncrementalDOM = {})));
}(this, function (exports) { 'use strict';

  /**
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /**
   * A cached reference to the hasOwnProperty function.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   * A cached reference to the create function.
   */
  var create = Object.create;

  /**
   * Used to prevent property collisions between our "map" and its prototype.
   * @param {!Object<string, *>} map The map to check.
   * @param {string} property The property to check.
   * @return {boolean} Whether map has property.
   */
  var has = function (map, property) {
    return hasOwnProperty.call(map, property);
  };

  /**
   * Creates an map object without a prototype.
   * @return {!Object}
   */
  var createMap = function () {
    return create(null);
  };

  /**
   * Keeps track of information needed to perform diffs for a given DOM node.
   * @param {!string} nodeName
   * @param {?string=} key
   * @constructor
   */
  function NodeData(nodeName, key) {
    /**
     * The attributes and their values.
     * @const {!Object<string, *>}
     */
    this.attrs = createMap();

    /**
     * An array of attribute name/value pairs, used for quickly diffing the
     * incomming attributes to see if the DOM node's attributes need to be
     * updated.
     * @const {Array<*>}
     */
    this.attrsArr = [];

    /**
     * The incoming attributes for this Node, before they are updated.
     * @const {!Object<string, *>}
     */
    this.newAttrs = createMap();

    /**
     * The key used to identify this node, used to preserve DOM nodes when they
     * move within their parent.
     * @const
     */
    this.key = key;

    /**
     * Keeps track of children within this node by their key.
     * {?Object<string, !Element>}
     */
    this.keyMap = null;

    /**
     * Whether or not the keyMap is currently valid.
     * {boolean}
     */
    this.keyMapValid = true;

    /**
     * The node name for this node.
     * @const {string}
     */
    this.nodeName = nodeName;

    /**
     * @type {?string}
     */
    this.text = null;
  }

  /**
   * Initializes a NodeData object for a Node.
   *
   * @param {Node} node The node to initialize data for.
   * @param {string} nodeName The node name of node.
   * @param {?string=} key The key that identifies the node.
   * @return {!NodeData} The newly initialized data object
   */
  var initData = function (node, nodeName, key) {
    var data = new NodeData(nodeName, key);
    node['__incrementalDOMData'] = data;
    return data;
  };

  /**
   * Retrieves the NodeData object for a Node, creating it if necessary.
   *
   * @param {Node} node The node to retrieve the data for.
   * @return {!NodeData} The NodeData for this Node.
   */
  var getData = function (node) {
    var data = node['__incrementalDOMData'];

    if (!data) {
      var nodeName = node.nodeName.toLowerCase();
      var key = null;

      if (node instanceof Element) {
        key = node.getAttribute('key');
      }

      data = initData(node, nodeName, key);
    }

    return data;
  };

  /**
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /** @const */
  var symbols = {
    default: '__default',

    placeholder: '__placeholder'
  };

  /**
   * @param {string} name
   * @return {string|undefined} The namespace to use for the attribute.
   */
  var getNamespace = function (name) {
    if (name.lastIndexOf('xml:', 0) === 0) {
      return 'http://www.w3.org/XML/1998/namespace';
    }

    if (name.lastIndexOf('xlink:', 0) === 0) {
      return 'http://www.w3.org/1999/xlink';
    }
  };

  /**
   * Applies an attribute or property to a given Element. If the value is null
   * or undefined, it is removed from the Element. Otherwise, the value is set
   * as an attribute.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {?(boolean|number|string)=} value The attribute's value.
   */
  var applyAttr = function (el, name, value) {
    if (value == null) {
      el.removeAttribute(name);
    } else {
      var attrNS = getNamespace(name);
      if (attrNS) {
        el.setAttributeNS(attrNS, name, value);
      } else {
        el.setAttribute(name, value);
      }
    }
  };

  /**
   * Applies a property to a given Element.
   * @param {!Element} el
   * @param {string} name The property's name.
   * @param {*} value The property's value.
   */
  var applyProp = function (el, name, value) {
    el[name] = value;
  };

  /**
   * Applies a style to an Element. No vendor prefix expansion is done for
   * property names/values.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {*} style The style to set. Either a string of css or an object
   *     containing property-value pairs.
   */
  var applyStyle = function (el, name, style) {
    if (typeof style === 'string') {
      el.style.cssText = style;
    } else {
      el.style.cssText = '';
      var elStyle = el.style;
      var obj = /** @type {!Object<string,string>} */style;

      for (var prop in obj) {
        if (has(obj, prop)) {
          elStyle[prop] = obj[prop];
        }
      }
    }
  };

  /**
   * Updates a single attribute on an Element.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {*} value The attribute's value. If the value is an object or
   *     function it is set on the Element, otherwise, it is set as an HTML
   *     attribute.
   */
  var applyAttributeTyped = function (el, name, value) {
    var type = typeof value;

    if (type === 'object' || type === 'function') {
      applyProp(el, name, value);
    } else {
      applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
    }
  };

  /**
   * Calls the appropriate attribute mutator for this attribute.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {*} value The attribute's value.
   */
  var updateAttribute = function (el, name, value) {
    var data = getData(el);
    var attrs = data.attrs;

    if (attrs[name] === value) {
      return;
    }

    var mutator = attributes[name] || attributes[symbols.default];
    mutator(el, name, value);

    attrs[name] = value;
  };

  /**
   * A publicly mutable object to provide custom mutators for attributes.
   * @const {!Object<string, function(!Element, string, *)>}
   */
  var attributes = createMap();

  // Special generic mutator that's called for any attribute that does not
  // have a specific mutator.
  attributes[symbols.default] = applyAttributeTyped;

  attributes[symbols.placeholder] = function () {};

  attributes['style'] = applyStyle;

  /**
   * Gets the namespace to create an element (of a given tag) in.
   * @param {string} tag The tag to get the namespace for.
   * @param {?Node} parent
   * @return {?string} The namespace to create the tag in.
   */
  var getNamespaceForTag = function (tag, parent) {
    if (tag === 'svg') {
      return 'http://www.w3.org/2000/svg';
    }

    if (getData(parent).nodeName === 'foreignObject') {
      return null;
    }

    return parent.namespaceURI;
  };

  /**
   * Creates an Element.
   * @param {Document} doc The document with which to create the Element.
   * @param {?Node} parent
   * @param {string} tag The tag for the Element.
   * @param {?string=} key A key to identify the Element.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element.
   * @return {!Element}
   */
  var createElement = function (doc, parent, tag, key, statics) {
    var namespace = getNamespaceForTag(tag, parent);
    var el = undefined;

    if (namespace) {
      el = doc.createElementNS(namespace, tag);
    } else {
      el = doc.createElement(tag);
    }

    initData(el, tag, key);

    if (statics) {
      for (var i = 0; i < statics.length; i += 2) {
        updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
      }
    }

    return el;
  };

  /**
   * Creates a Text Node.
   * @param {Document} doc The document with which to create the Element.
   * @return {!Text}
   */
  var createText = function (doc) {
    var node = doc.createTextNode('');
    initData(node, '#text', null);
    return node;
  };

  /**
   * Creates a mapping that can be used to look up children using a key.
   * @param {?Node} el
   * @return {!Object<string, !Element>} A mapping of keys to the children of the
   *     Element.
   */
  var createKeyMap = function (el) {
    var map = createMap();
    var child = el.firstElementChild;

    while (child) {
      var key = getData(child).key;

      if (key) {
        map[key] = child;
      }

      child = child.nextElementSibling;
    }

    return map;
  };

  /**
   * Retrieves the mapping of key to child node for a given Element, creating it
   * if necessary.
   * @param {?Node} el
   * @return {!Object<string, !Node>} A mapping of keys to child Elements
   */
  var getKeyMap = function (el) {
    var data = getData(el);

    if (!data.keyMap) {
      data.keyMap = createKeyMap(el);
    }

    return data.keyMap;
  };

  /**
   * Retrieves a child from the parent with the given key.
   * @param {?Node} parent
   * @param {?string=} key
   * @return {?Node} The child corresponding to the key.
   */
  var getChild = function (parent, key) {
    return key ? getKeyMap(parent)[key] : null;
  };

  /**
   * Registers an element as being a child. The parent will keep track of the
   * child using the key. The child can be retrieved using the same key using
   * getKeyMap. The provided key should be unique within the parent Element.
   * @param {?Node} parent The parent of child.
   * @param {string} key A key to identify the child with.
   * @param {!Node} child The child to register.
   */
  var registerChild = function (parent, key, child) {
    getKeyMap(parent)[key] = child;
  };

  /**
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /** @const */
  var notifications = {
    /**
     * Called after patch has compleated with any Nodes that have been created
     * and added to the DOM.
     * @type {?function(Array<!Node>)}
     */
    nodesCreated: null,

    /**
     * Called after patch has compleated with any Nodes that have been removed
     * from the DOM.
     * Note it's an applications responsibility to handle any childNodes.
     * @type {?function(Array<!Node>)}
     */
    nodesDeleted: null
  };

  /**
   * Keeps track of the state of a patch.
   * @constructor
   */
  function Context() {
    /**
     * @type {(Array<!Node>|undefined)}
     */
    this.created = notifications.nodesCreated && [];

    /**
     * @type {(Array<!Node>|undefined)}
     */
    this.deleted = notifications.nodesDeleted && [];
  }

  /**
   * @param {!Node} node
   */
  Context.prototype.markCreated = function (node) {
    if (this.created) {
      this.created.push(node);
    }
  };

  /**
   * @param {!Node} node
   */
  Context.prototype.markDeleted = function (node) {
    if (this.deleted) {
      this.deleted.push(node);
    }
  };

  /**
   * Notifies about nodes that were created during the patch opearation.
   */
  Context.prototype.notifyChanges = function () {
    if (this.created && this.created.length > 0) {
      notifications.nodesCreated(this.created);
    }

    if (this.deleted && this.deleted.length > 0) {
      notifications.nodesDeleted(this.deleted);
    }
  };

  /**
  * Makes sure that keyed Element matches the tag name provided.
  * @param {!string} nodeName The nodeName of the node that is being matched.
  * @param {string=} tag The tag name of the Element.
  * @param {?string=} key The key of the Element.
  */
  var assertKeyedTagMatches = function (nodeName, tag, key) {
    if (nodeName !== tag) {
      throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
    }
  };

  /** @type {?Context} */
  var context = null;

  /** @type {?Node} */
  var currentNode = null;

  /** @type {?Node} */
  var currentParent = null;

  /** @type {?Element|?DocumentFragment} */
  var root = null;

  /** @type {?Document} */
  var doc = null;

  /**
   * Returns a patcher function that sets up and restores a patch context,
   * running the run function with the provided data.
   * @param {function((!Element|!DocumentFragment),!function(T),T=)} run
   * @return {function((!Element|!DocumentFragment),!function(T),T=)}
   * @template T
   */
  var patchFactory = function (run) {
    /**
     * TODO(moz): These annotations won't be necessary once we switch to Closure
     * Compiler's new type inference. Remove these once the switch is done.
     *
     * @param {(!Element|!DocumentFragment)} node
     * @param {!function(T)} fn
     * @param {T=} data
     * @template T
     */
    var f = function (node, fn, data) {
      var prevContext = context;
      var prevRoot = root;
      var prevDoc = doc;
      var prevCurrentNode = currentNode;
      var prevCurrentParent = currentParent;
      var previousInAttributes = false;
      var previousInSkip = false;

      context = new Context();
      root = node;
      doc = node.ownerDocument;
      currentParent = node.parentNode;

      if ('production' !== 'production') {}

      run(node, fn, data);

      if ('production' !== 'production') {}

      context.notifyChanges();

      context = prevContext;
      root = prevRoot;
      doc = prevDoc;
      currentNode = prevCurrentNode;
      currentParent = prevCurrentParent;
    };
    return f;
  };

  /**
   * Patches the document starting at node with the provided function. This
   * function may be called during an existing patch operation.
   * @param {!Element|!DocumentFragment} node The Element or Document
   *     to patch.
   * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
   *     calls that describe the DOM.
   * @param {T=} data An argument passed to fn to represent DOM state.
   * @template T
   */
  var patchInner = patchFactory(function (node, fn, data) {
    currentNode = node;

    enterNode();
    fn(data);
    exitNode();

    if ('production' !== 'production') {}
  });

  /**
   * Patches an Element with the the provided function. Exactly one top level
   * element call should be made corresponding to `node`.
   * @param {!Element} node The Element where the patch should start.
   * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
   *     calls that describe the DOM. This should have at most one top level
   *     element call.
   * @param {T=} data An argument passed to fn to represent DOM state.
   * @template T
   */
  var patchOuter = patchFactory(function (node, fn, data) {
    currentNode = /** @type {!Element} */{ nextSibling: node };

    fn(data);

    if ('production' !== 'production') {}
  });

  /**
   * Checks whether or not the current node matches the specified nodeName and
   * key.
   *
   * @param {?string} nodeName The nodeName for this node.
   * @param {?string=} key An optional key that identifies a node.
   * @return {boolean} True if the node matches, false otherwise.
   */
  var matches = function (nodeName, key) {
    var data = getData(currentNode);

    // Key check is done using double equals as we want to treat a null key the
    // same as undefined. This should be okay as the only values allowed are
    // strings, null and undefined so the == semantics are not too weird.
    return nodeName === data.nodeName && key == data.key;
  };

  /**
   * Aligns the virtual Element definition with the actual DOM, moving the
   * corresponding DOM node to the correct location or creating it if necessary.
   * @param {string} nodeName For an Element, this should be a valid tag string.
   *     For a Text, this should be #text.
   * @param {?string=} key The key used to identify this element.
   * @param {?Array<*>=} statics For an Element, this should be an array of
   *     name-value pairs.
   */
  var alignWithDOM = function (nodeName, key, statics) {
    if (currentNode && matches(nodeName, key)) {
      return;
    }

    var node = undefined;

    // Check to see if the node has moved within the parent.
    if (key) {
      node = getChild(currentParent, key);
      if (node && 'production' !== 'production') {
        assertKeyedTagMatches(getData(node).nodeName, nodeName, key);
      }
    }

    // Create the node if it doesn't exist.
    if (!node) {
      if (nodeName === '#text') {
        node = createText(doc);
      } else {
        node = createElement(doc, currentParent, nodeName, key, statics);
      }

      if (key) {
        registerChild(currentParent, key, node);
      }

      context.markCreated(node);
    }

    // If the node has a key, remove it from the DOM to prevent a large number
    // of re-orders in the case that it moved far or was completely removed.
    // Since we hold on to a reference through the keyMap, we can always add it
    // back.
    if (currentNode && getData(currentNode).key) {
      currentParent.replaceChild(node, currentNode);
      getData(currentParent).keyMapValid = false;
    } else {
      currentParent.insertBefore(node, currentNode);
    }

    currentNode = node;
  };

  /**
   * Clears out any unvisited Nodes, as the corresponding virtual element
   * functions were never called for them.
   */
  var clearUnvisitedDOM = function () {
    var node = currentParent;
    var data = getData(node);
    var keyMap = data.keyMap;
    var keyMapValid = data.keyMapValid;
    var child = node.lastChild;
    var key = undefined;

    if (child === currentNode && keyMapValid) {
      return;
    }

    if (data.attrs[symbols.placeholder] && node !== root) {
      if ('production' !== 'production') {}
      return;
    }

    while (child !== currentNode) {
      node.removeChild(child);
      context.markDeleted( /** @type {!Node}*/child);

      key = getData(child).key;
      if (key) {
        delete keyMap[key];
      }
      child = node.lastChild;
    }

    // Clean the keyMap, removing any unusued keys.
    if (!keyMapValid) {
      for (key in keyMap) {
        child = keyMap[key];
        if (child.parentNode !== node) {
          context.markDeleted(child);
          delete keyMap[key];
        }
      }

      data.keyMapValid = true;
    }
  };

  /**
   * Changes to the first child of the current node.
   */
  var enterNode = function () {
    currentParent = currentNode;
    currentNode = null;
  };

  /**
   * Changes to the next sibling of the current node.
   */
  var nextNode = function () {
    if (currentNode) {
      currentNode = currentNode.nextSibling;
    } else {
      currentNode = currentParent.firstChild;
    }
  };

  /**
   * Changes to the parent of the current node, removing any unvisited children.
   */
  var exitNode = function () {
    clearUnvisitedDOM();

    currentNode = currentParent;
    currentParent = currentParent.parentNode;
  };

  /**
   * Makes sure that the current node is an Element with a matching tagName and
   * key.
   *
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @return {!Element} The corresponding Element.
   */
  var coreElementOpen = function (tag, key, statics) {
    nextNode();
    alignWithDOM(tag, key, statics);
    enterNode();
    return (/** @type {!Element} */currentParent
    );
  };

  /**
   * Closes the currently open Element, removing any unvisited children if
   * necessary.
   *
   * @return {!Element} The corresponding Element.
   */
  var coreElementClose = function () {
    if ('production' !== 'production') {}

    exitNode();
    return (/** @type {!Element} */currentNode
    );
  };

  /**
   * Makes sure the current node is a Text node and creates a Text node if it is
   * not.
   *
   * @return {!Text} The corresponding Text Node.
   */
  var coreText = function () {
    nextNode();
    alignWithDOM('#text', null, null);
    return (/** @type {!Text} */currentNode
    );
  };

  /**
   * Gets the current Element being patched.
   * @return {!Element}
   */
  var currentElement = function () {
    if ('production' !== 'production') {}
    return (/** @type {!Element} */currentParent
    );
  };

  /**
   * Skips the children in a subtree, allowing an Element to be closed without
   * clearing out the children.
   */
  var skip = function () {
    if ('production' !== 'production') {}
    currentNode = currentParent.lastChild;
  };

  /**
   * The offset in the virtual element declaration where the attributes are
   * specified.
   * @const
   */
  var ATTRIBUTES_OFFSET = 3;

  /**
   * Builds an array of arguments for use with elementOpenStart, attr and
   * elementOpenEnd.
   * @const {Array<*>}
   */
  var argsBuilder = [];

  /**
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
   *     for the Element.
   * @return {!Element} The corresponding Element.
   */
  var elementOpen = function (tag, key, statics, const_args) {
    if ('production' !== 'production') {}

    var node = coreElementOpen(tag, key, statics);
    var data = getData(node);

    /*
     * Checks to see if one or more attributes have changed for a given Element.
     * When no attributes have changed, this is much faster than checking each
     * individual argument. When attributes have changed, the overhead of this is
     * minimal.
     */
    var attrsArr = data.attrsArr;
    var newAttrs = data.newAttrs;
    var attrsChanged = false;
    var i = ATTRIBUTES_OFFSET;
    var j = 0;

    for (; i < arguments.length; i += 1, j += 1) {
      if (attrsArr[j] !== arguments[i]) {
        attrsChanged = true;
        break;
      }
    }

    for (; i < arguments.length; i += 1, j += 1) {
      attrsArr[j] = arguments[i];
    }

    if (j < attrsArr.length) {
      attrsChanged = true;
      attrsArr.length = j;
    }

    /*
     * Actually perform the attribute update.
     */
    if (attrsChanged) {
      for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
        newAttrs[arguments[i]] = arguments[i + 1];
      }

      for (var _attr in newAttrs) {
        updateAttribute(node, _attr, newAttrs[_attr]);
        newAttrs[_attr] = undefined;
      }
    }

    return node;
  };

  /**
   * Declares a virtual Element at the current location in the document. This
   * corresponds to an opening tag and a elementClose tag is required. This is
   * like elementOpen, but the attributes are defined using the attr function
   * rather than being passed as arguments. Must be folllowed by 0 or more calls
   * to attr, then a call to elementOpenEnd.
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   */
  var elementOpenStart = function (tag, key, statics) {
    if ('production' !== 'production') {}

    argsBuilder[0] = tag;
    argsBuilder[1] = key;
    argsBuilder[2] = statics;
  };

  /***
   * Defines a virtual attribute at this point of the DOM. This is only valid
   * when called between elementOpenStart and elementOpenEnd.
   *
   * @param {string} name
   * @param {*} value
   */
  var attr = function (name, value) {
    if ('production' !== 'production') {}

    argsBuilder.push(name, value);
  };

  /**
   * Closes an open tag started with elementOpenStart.
   * @return {!Element} The corresponding Element.
   */
  var elementOpenEnd = function () {
    if ('production' !== 'production') {}

    var node = elementOpen.apply(null, argsBuilder);
    argsBuilder.length = 0;
    return node;
  };

  /**
   * Closes an open virtual Element.
   *
   * @param {string} tag The element's tag.
   * @return {!Element} The corresponding Element.
   */
  var elementClose = function (tag) {
    if ('production' !== 'production') {}

    var node = coreElementClose();

    if ('production' !== 'production') {}

    return node;
  };

  /**
   * Declares a virtual Element at the current location in the document that has
   * no children.
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
   *     for the Element.
   * @return {!Element} The corresponding Element.
   */
  var elementVoid = function (tag, key, statics, const_args) {
    elementOpen.apply(null, arguments);
    return elementClose(tag);
  };

  /**
   * Declares a virtual Element at the current location in the document that is a
   * placeholder element. Children of this Element can be manually managed and
   * will not be cleared by the library.
   *
   * A key must be specified to make sure that this node is correctly preserved
   * across all conditionals.
   *
   * @param {string} tag The element's tag.
   * @param {string} key The key used to identify this element.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
   *     for the Element.
   * @return {!Element} The corresponding Element.
   */
  var elementPlaceholder = function (tag, key, statics, const_args) {
    if ('production' !== 'production') {}

    elementOpen.apply(null, arguments);
    skip();
    return elementClose(tag);
  };

  /**
   * Declares a virtual Text at this point in the document.
   *
   * @param {string|number|boolean} value The value of the Text.
   * @param {...(function((string|number|boolean)):string)} const_args
   *     Functions to format the value which are called only when the value has
   *     changed.
   * @return {!Text} The corresponding text node.
   */
  var text = function (value, const_args) {
    if ('production' !== 'production') {}

    var node = coreText();
    var data = getData(node);

    if (data.text !== value) {
      data.text = /** @type {string} */value;

      var formatted = value;
      for (var i = 1; i < arguments.length; i += 1) {
        /*
         * Call the formatter function directly to prevent leaking arguments.
         * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
         */
        var fn = arguments[i];
        formatted = fn(formatted);
      }

      node.data = formatted;
    }

    return node;
  };

  exports.patch = patchInner;
  exports.patchInner = patchInner;
  exports.patchOuter = patchOuter;
  exports.currentElement = currentElement;
  exports.skip = skip;
  exports.elementVoid = elementVoid;
  exports.elementOpenStart = elementOpenStart;
  exports.elementOpenEnd = elementOpenEnd;
  exports.elementOpen = elementOpen;
  exports.elementClose = elementClose;
  exports.elementPlaceholder = elementPlaceholder;
  exports.text = text;
  exports.attr = attr;
  exports.symbols = symbols;
  exports.attributes = attributes;
  exports.applyAttr = applyAttr;
  exports.applyProp = applyProp;
  exports.notifications = notifications;

}));


},{}],2:[function(require,module,exports){
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// @version 0.7.22
if (typeof WeakMap === "undefined") {
  (function() {
    var defineProperty = Object.defineProperty;
    var counter = Date.now() % 1e9;
    var WeakMap = function() {
      this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
    };
    WeakMap.prototype = {
      set: function(key, value) {
        var entry = key[this.name];
        if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
          value: [ key, value ],
          writable: true
        });
        return this;
      },
      get: function(key) {
        var entry;
        return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
      },
      "delete": function(key) {
        var entry = key[this.name];
        if (!entry || entry[0] !== key) return false;
        entry[0] = entry[1] = undefined;
        return true;
      },
      has: function(key) {
        var entry = key[this.name];
        if (!entry) return false;
        return entry[0] === key;
      }
    };
    window.WeakMap = WeakMap;
  })();
}

(function(global) {
  if (global.JsMutationObserver) {
    return;
  }
  var registrationsTable = new WeakMap();
  var setImmediate;
  if (/Trident|Edge/.test(navigator.userAgent)) {
    setImmediate = setTimeout;
  } else if (window.setImmediate) {
    setImmediate = window.setImmediate;
  } else {
    var setImmediateQueue = [];
    var sentinel = String(Math.random());
    window.addEventListener("message", function(e) {
      if (e.data === sentinel) {
        var queue = setImmediateQueue;
        setImmediateQueue = [];
        queue.forEach(function(func) {
          func();
        });
      }
    });
    setImmediate = function(func) {
      setImmediateQueue.push(func);
      window.postMessage(sentinel, "*");
    };
  }
  var isScheduled = false;
  var scheduledObservers = [];
  function scheduleCallback(observer) {
    scheduledObservers.push(observer);
    if (!isScheduled) {
      isScheduled = true;
      setImmediate(dispatchCallbacks);
    }
  }
  function wrapIfNeeded(node) {
    return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
  }
  function dispatchCallbacks() {
    isScheduled = false;
    var observers = scheduledObservers;
    scheduledObservers = [];
    observers.sort(function(o1, o2) {
      return o1.uid_ - o2.uid_;
    });
    var anyNonEmpty = false;
    observers.forEach(function(observer) {
      var queue = observer.takeRecords();
      removeTransientObserversFor(observer);
      if (queue.length) {
        observer.callback_(queue, observer);
        anyNonEmpty = true;
      }
    });
    if (anyNonEmpty) dispatchCallbacks();
  }
  function removeTransientObserversFor(observer) {
    observer.nodes_.forEach(function(node) {
      var registrations = registrationsTable.get(node);
      if (!registrations) return;
      registrations.forEach(function(registration) {
        if (registration.observer === observer) registration.removeTransientObservers();
      });
    });
  }
  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
    for (var node = target; node; node = node.parentNode) {
      var registrations = registrationsTable.get(node);
      if (registrations) {
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;
          if (node !== target && !options.subtree) continue;
          var record = callback(options);
          if (record) registration.enqueue(record);
        }
      }
    }
  }
  var uidCounter = 0;
  function JsMutationObserver(callback) {
    this.callback_ = callback;
    this.nodes_ = [];
    this.records_ = [];
    this.uid_ = ++uidCounter;
  }
  JsMutationObserver.prototype = {
    observe: function(target, options) {
      target = wrapIfNeeded(target);
      if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
        throw new SyntaxError();
      }
      var registrations = registrationsTable.get(target);
      if (!registrations) registrationsTable.set(target, registrations = []);
      var registration;
      for (var i = 0; i < registrations.length; i++) {
        if (registrations[i].observer === this) {
          registration = registrations[i];
          registration.removeListeners();
          registration.options = options;
          break;
        }
      }
      if (!registration) {
        registration = new Registration(this, target, options);
        registrations.push(registration);
        this.nodes_.push(target);
      }
      registration.addListeners();
    },
    disconnect: function() {
      this.nodes_.forEach(function(node) {
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.observer === this) {
            registration.removeListeners();
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
      this.records_ = [];
    },
    takeRecords: function() {
      var copyOfRecords = this.records_;
      this.records_ = [];
      return copyOfRecords;
    }
  };
  function MutationRecord(type, target) {
    this.type = type;
    this.target = target;
    this.addedNodes = [];
    this.removedNodes = [];
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }
  function copyMutationRecord(original) {
    var record = new MutationRecord(original.type, original.target);
    record.addedNodes = original.addedNodes.slice();
    record.removedNodes = original.removedNodes.slice();
    record.previousSibling = original.previousSibling;
    record.nextSibling = original.nextSibling;
    record.attributeName = original.attributeName;
    record.attributeNamespace = original.attributeNamespace;
    record.oldValue = original.oldValue;
    return record;
  }
  var currentRecord, recordWithOldValue;
  function getRecord(type, target) {
    return currentRecord = new MutationRecord(type, target);
  }
  function getRecordWithOldValue(oldValue) {
    if (recordWithOldValue) return recordWithOldValue;
    recordWithOldValue = copyMutationRecord(currentRecord);
    recordWithOldValue.oldValue = oldValue;
    return recordWithOldValue;
  }
  function clearRecords() {
    currentRecord = recordWithOldValue = undefined;
  }
  function recordRepresentsCurrentMutation(record) {
    return record === recordWithOldValue || record === currentRecord;
  }
  function selectRecord(lastRecord, newRecord) {
    if (lastRecord === newRecord) return lastRecord;
    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
    return null;
  }
  function Registration(observer, target, options) {
    this.observer = observer;
    this.target = target;
    this.options = options;
    this.transientObservedNodes = [];
  }
  Registration.prototype = {
    enqueue: function(record) {
      var records = this.observer.records_;
      var length = records.length;
      if (records.length > 0) {
        var lastRecord = records[length - 1];
        var recordToReplaceLast = selectRecord(lastRecord, record);
        if (recordToReplaceLast) {
          records[length - 1] = recordToReplaceLast;
          return;
        }
      } else {
        scheduleCallback(this.observer);
      }
      records[length] = record;
    },
    addListeners: function() {
      this.addListeners_(this.target);
    },
    addListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
    },
    removeListeners: function() {
      this.removeListeners_(this.target);
    },
    removeListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
    },
    addTransientObserver: function(node) {
      if (node === this.target) return;
      this.addListeners_(node);
      this.transientObservedNodes.push(node);
      var registrations = registrationsTable.get(node);
      if (!registrations) registrationsTable.set(node, registrations = []);
      registrations.push(this);
    },
    removeTransientObservers: function() {
      var transientObservedNodes = this.transientObservedNodes;
      this.transientObservedNodes = [];
      transientObservedNodes.forEach(function(node) {
        this.removeListeners_(node);
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i] === this) {
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
    },
    handleEvent: function(e) {
      e.stopImmediatePropagation();
      switch (e.type) {
       case "DOMAttrModified":
        var name = e.attrName;
        var namespace = e.relatedNode.namespaceURI;
        var target = e.target;
        var record = new getRecord("attributes", target);
        record.attributeName = name;
        record.attributeNamespace = namespace;
        var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.attributes) return;
          if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
            return;
          }
          if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMCharacterDataModified":
        var target = e.target;
        var record = getRecord("characterData", target);
        var oldValue = e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.characterData) return;
          if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMNodeRemoved":
        this.addTransientObserver(e.target);

       case "DOMNodeInserted":
        var changedNode = e.target;
        var addedNodes, removedNodes;
        if (e.type === "DOMNodeInserted") {
          addedNodes = [ changedNode ];
          removedNodes = [];
        } else {
          addedNodes = [];
          removedNodes = [ changedNode ];
        }
        var previousSibling = changedNode.previousSibling;
        var nextSibling = changedNode.nextSibling;
        var record = getRecord("childList", e.target.parentNode);
        record.addedNodes = addedNodes;
        record.removedNodes = removedNodes;
        record.previousSibling = previousSibling;
        record.nextSibling = nextSibling;
        forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function(options) {
          if (!options.childList) return;
          return record;
        });
      }
      clearRecords();
    }
  };
  global.JsMutationObserver = JsMutationObserver;
  if (!global.MutationObserver) {
    global.MutationObserver = JsMutationObserver;
    JsMutationObserver._isPolyfilled = true;
  }
})(self);

(function(scope) {
  "use strict";
  if (!window.performance) {
    var start = Date.now();
    window.performance = {
      now: function() {
        return Date.now() - start;
      }
    };
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function() {
      var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
      return nativeRaf ? function(callback) {
        return nativeRaf(function() {
          callback(performance.now());
        });
      } : function(callback) {
        return window.setTimeout(callback, 1e3 / 60);
      };
    }();
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function() {
      return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
        clearTimeout(id);
      };
    }();
  }
  var workingDefaultPrevented = function() {
    var e = document.createEvent("Event");
    e.initEvent("foo", true, true);
    e.preventDefault();
    return e.defaultPrevented;
  }();
  if (!workingDefaultPrevented) {
    var origPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function() {
      if (!this.cancelable) {
        return;
      }
      origPreventDefault.call(this);
      Object.defineProperty(this, "defaultPrevented", {
        get: function() {
          return true;
        },
        configurable: true
      });
    };
  }
  var isIE = /Trident/.test(navigator.userAgent);
  if (!window.CustomEvent || isIE && typeof window.CustomEvent !== "function") {
    window.CustomEvent = function(inType, params) {
      params = params || {};
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
      return e;
    };
    window.CustomEvent.prototype = window.Event.prototype;
  }
  if (!window.Event || isIE && typeof window.Event !== "function") {
    var origEvent = window.Event;
    window.Event = function(inType, params) {
      params = params || {};
      var e = document.createEvent("Event");
      e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
      return e;
    };
    window.Event.prototype = origEvent.prototype;
  }
})(window.WebComponents);

window.CustomElements = window.CustomElements || {
  flags: {}
};

(function(scope) {
  var flags = scope.flags;
  var modules = [];
  var addModule = function(module) {
    modules.push(module);
  };
  var initializeModules = function() {
    modules.forEach(function(module) {
      module(scope);
    });
  };
  scope.addModule = addModule;
  scope.initializeModules = initializeModules;
  scope.hasNative = Boolean(document.registerElement);
  scope.isIE = /Trident/.test(navigator.userAgent);
  scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
})(window.CustomElements);

window.CustomElements.addModule(function(scope) {
  var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : "none";
  function forSubtree(node, cb) {
    findAllElements(node, function(e) {
      if (cb(e)) {
        return true;
      }
      forRoots(e, cb);
    });
    forRoots(node, cb);
  }
  function findAllElements(node, find, data) {
    var e = node.firstElementChild;
    if (!e) {
      e = node.firstChild;
      while (e && e.nodeType !== Node.ELEMENT_NODE) {
        e = e.nextSibling;
      }
    }
    while (e) {
      if (find(e, data) !== true) {
        findAllElements(e, find, data);
      }
      e = e.nextElementSibling;
    }
    return null;
  }
  function forRoots(node, cb) {
    var root = node.shadowRoot;
    while (root) {
      forSubtree(root, cb);
      root = root.olderShadowRoot;
    }
  }
  function forDocumentTree(doc, cb) {
    _forDocumentTree(doc, cb, []);
  }
  function _forDocumentTree(doc, cb, processingDocuments) {
    doc = window.wrap(doc);
    if (processingDocuments.indexOf(doc) >= 0) {
      return;
    }
    processingDocuments.push(doc);
    var imports = doc.querySelectorAll("link[rel=" + IMPORT_LINK_TYPE + "]");
    for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
      if (n.import) {
        _forDocumentTree(n.import, cb, processingDocuments);
      }
    }
    cb(doc);
  }
  scope.forDocumentTree = forDocumentTree;
  scope.forSubtree = forSubtree;
});

window.CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  var forSubtree = scope.forSubtree;
  var forDocumentTree = scope.forDocumentTree;
  function addedNode(node, isAttached) {
    return added(node, isAttached) || addedSubtree(node, isAttached);
  }
  function added(node, isAttached) {
    if (scope.upgrade(node, isAttached)) {
      return true;
    }
    if (isAttached) {
      attached(node);
    }
  }
  function addedSubtree(node, isAttached) {
    forSubtree(node, function(e) {
      if (added(e, isAttached)) {
        return true;
      }
    });
  }
  var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags["throttle-attached"];
  scope.hasPolyfillMutations = hasThrottledAttached;
  scope.hasThrottledAttached = hasThrottledAttached;
  var isPendingMutations = false;
  var pendingMutations = [];
  function deferMutation(fn) {
    pendingMutations.push(fn);
    if (!isPendingMutations) {
      isPendingMutations = true;
      setTimeout(takeMutations);
    }
  }
  function takeMutations() {
    isPendingMutations = false;
    var $p = pendingMutations;
    for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
      p();
    }
    pendingMutations = [];
  }
  function attached(element) {
    if (hasThrottledAttached) {
      deferMutation(function() {
        _attached(element);
      });
    } else {
      _attached(element);
    }
  }
  function _attached(element) {
    if (element.__upgraded__ && !element.__attached) {
      element.__attached = true;
      if (element.attachedCallback) {
        element.attachedCallback();
      }
    }
  }
  function detachedNode(node) {
    detached(node);
    forSubtree(node, function(e) {
      detached(e);
    });
  }
  function detached(element) {
    if (hasThrottledAttached) {
      deferMutation(function() {
        _detached(element);
      });
    } else {
      _detached(element);
    }
  }
  function _detached(element) {
    if (element.__upgraded__ && element.__attached) {
      element.__attached = false;
      if (element.detachedCallback) {
        element.detachedCallback();
      }
    }
  }
  function inDocument(element) {
    var p = element;
    var doc = window.wrap(document);
    while (p) {
      if (p == doc) {
        return true;
      }
      p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
    }
  }
  function watchShadow(node) {
    if (node.shadowRoot && !node.shadowRoot.__watched) {
      flags.dom && console.log("watching shadow-root for: ", node.localName);
      var root = node.shadowRoot;
      while (root) {
        observe(root);
        root = root.olderShadowRoot;
      }
    }
  }
  function handler(root, mutations) {
    if (flags.dom) {
      var mx = mutations[0];
      if (mx && mx.type === "childList" && mx.addedNodes) {
        if (mx.addedNodes) {
          var d = mx.addedNodes[0];
          while (d && d !== document && !d.host) {
            d = d.parentNode;
          }
          var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
          u = u.split("/?").shift().split("/").pop();
        }
      }
      console.group("mutations (%d) [%s]", mutations.length, u || "");
    }
    var isAttached = inDocument(root);
    mutations.forEach(function(mx) {
      if (mx.type === "childList") {
        forEach(mx.addedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          addedNode(n, isAttached);
        });
        forEach(mx.removedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          detachedNode(n);
        });
      }
    });
    flags.dom && console.groupEnd();
  }
  function takeRecords(node) {
    node = window.wrap(node);
    if (!node) {
      node = window.wrap(document);
    }
    while (node.parentNode) {
      node = node.parentNode;
    }
    var observer = node.__observer;
    if (observer) {
      handler(node, observer.takeRecords());
      takeMutations();
    }
  }
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  function observe(inRoot) {
    if (inRoot.__observer) {
      return;
    }
    var observer = new MutationObserver(handler.bind(this, inRoot));
    observer.observe(inRoot, {
      childList: true,
      subtree: true
    });
    inRoot.__observer = observer;
  }
  function upgradeDocument(doc) {
    doc = window.wrap(doc);
    flags.dom && console.group("upgradeDocument: ", doc.baseURI.split("/").pop());
    var isMainDocument = doc === window.wrap(document);
    addedNode(doc, isMainDocument);
    observe(doc);
    flags.dom && console.groupEnd();
  }
  function upgradeDocumentTree(doc) {
    forDocumentTree(doc, upgradeDocument);
  }
  var originalCreateShadowRoot = Element.prototype.createShadowRoot;
  if (originalCreateShadowRoot) {
    Element.prototype.createShadowRoot = function() {
      var root = originalCreateShadowRoot.call(this);
      window.CustomElements.watchShadow(this);
      return root;
    };
  }
  scope.watchShadow = watchShadow;
  scope.upgradeDocumentTree = upgradeDocumentTree;
  scope.upgradeDocument = upgradeDocument;
  scope.upgradeSubtree = addedSubtree;
  scope.upgradeAll = addedNode;
  scope.attached = attached;
  scope.takeRecords = takeRecords;
});

window.CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  function upgrade(node, isAttached) {
    if (node.localName === "template") {
      if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
        HTMLTemplateElement.decorate(node);
      }
    }
    if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
      var is = node.getAttribute("is");
      var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
      if (definition) {
        if (is && definition.tag == node.localName || !is && !definition.extends) {
          return upgradeWithDefinition(node, definition, isAttached);
        }
      }
    }
  }
  function upgradeWithDefinition(element, definition, isAttached) {
    flags.upgrade && console.group("upgrade:", element.localName);
    if (definition.is) {
      element.setAttribute("is", definition.is);
    }
    implementPrototype(element, definition);
    element.__upgraded__ = true;
    created(element);
    if (isAttached) {
      scope.attached(element);
    }
    scope.upgradeSubtree(element, isAttached);
    flags.upgrade && console.groupEnd();
    return element;
  }
  function implementPrototype(element, definition) {
    if (Object.__proto__) {
      element.__proto__ = definition.prototype;
    } else {
      customMixin(element, definition.prototype, definition.native);
      element.__proto__ = definition.prototype;
    }
  }
  function customMixin(inTarget, inSrc, inNative) {
    var used = {};
    var p = inSrc;
    while (p !== inNative && p !== HTMLElement.prototype) {
      var keys = Object.getOwnPropertyNames(p);
      for (var i = 0, k; k = keys[i]; i++) {
        if (!used[k]) {
          Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
          used[k] = 1;
        }
      }
      p = Object.getPrototypeOf(p);
    }
  }
  function created(element) {
    if (element.createdCallback) {
      element.createdCallback();
    }
  }
  scope.upgrade = upgrade;
  scope.upgradeWithDefinition = upgradeWithDefinition;
  scope.implementPrototype = implementPrototype;
});

window.CustomElements.addModule(function(scope) {
  var isIE = scope.isIE;
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeAll = scope.upgradeAll;
  var upgradeWithDefinition = scope.upgradeWithDefinition;
  var implementPrototype = scope.implementPrototype;
  var useNative = scope.useNative;
  function register(name, options) {
    var definition = options || {};
    if (!name) {
      throw new Error("document.registerElement: first argument `name` must not be empty");
    }
    if (name.indexOf("-") < 0) {
      throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
    }
    if (isReservedTag(name)) {
      throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '" + String(name) + "'. The type name is invalid.");
    }
    if (getRegisteredDefinition(name)) {
      throw new Error("DuplicateDefinitionError: a type with name '" + String(name) + "' is already registered");
    }
    if (!definition.prototype) {
      definition.prototype = Object.create(HTMLElement.prototype);
    }
    definition.__name = name.toLowerCase();
    if (definition.extends) {
      definition.extends = definition.extends.toLowerCase();
    }
    definition.lifecycle = definition.lifecycle || {};
    definition.ancestry = ancestry(definition.extends);
    resolveTagName(definition);
    resolvePrototypeChain(definition);
    overrideAttributeApi(definition.prototype);
    registerDefinition(definition.__name, definition);
    definition.ctor = generateConstructor(definition);
    definition.ctor.prototype = definition.prototype;
    definition.prototype.constructor = definition.ctor;
    if (scope.ready) {
      upgradeDocumentTree(document);
    }
    return definition.ctor;
  }
  function overrideAttributeApi(prototype) {
    if (prototype.setAttribute._polyfilled) {
      return;
    }
    var setAttribute = prototype.setAttribute;
    prototype.setAttribute = function(name, value) {
      changeAttribute.call(this, name, value, setAttribute);
    };
    var removeAttribute = prototype.removeAttribute;
    prototype.removeAttribute = function(name) {
      changeAttribute.call(this, name, null, removeAttribute);
    };
    prototype.setAttribute._polyfilled = true;
  }
  function changeAttribute(name, value, operation) {
    name = name.toLowerCase();
    var oldValue = this.getAttribute(name);
    operation.apply(this, arguments);
    var newValue = this.getAttribute(name);
    if (this.attributeChangedCallback && newValue !== oldValue) {
      this.attributeChangedCallback(name, oldValue, newValue);
    }
  }
  function isReservedTag(name) {
    for (var i = 0; i < reservedTagList.length; i++) {
      if (name === reservedTagList[i]) {
        return true;
      }
    }
  }
  var reservedTagList = [ "annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph" ];
  function ancestry(extnds) {
    var extendee = getRegisteredDefinition(extnds);
    if (extendee) {
      return ancestry(extendee.extends).concat([ extendee ]);
    }
    return [];
  }
  function resolveTagName(definition) {
    var baseTag = definition.extends;
    for (var i = 0, a; a = definition.ancestry[i]; i++) {
      baseTag = a.is && a.tag;
    }
    definition.tag = baseTag || definition.__name;
    if (baseTag) {
      definition.is = definition.__name;
    }
  }
  function resolvePrototypeChain(definition) {
    if (!Object.__proto__) {
      var nativePrototype = HTMLElement.prototype;
      if (definition.is) {
        var inst = document.createElement(definition.tag);
        nativePrototype = Object.getPrototypeOf(inst);
      }
      var proto = definition.prototype, ancestor;
      var foundPrototype = false;
      while (proto) {
        if (proto == nativePrototype) {
          foundPrototype = true;
        }
        ancestor = Object.getPrototypeOf(proto);
        if (ancestor) {
          proto.__proto__ = ancestor;
        }
        proto = ancestor;
      }
      if (!foundPrototype) {
        console.warn(definition.tag + " prototype not found in prototype chain for " + definition.is);
      }
      definition.native = nativePrototype;
    }
  }
  function instantiate(definition) {
    return upgradeWithDefinition(domCreateElement(definition.tag), definition);
  }
  var registry = {};
  function getRegisteredDefinition(name) {
    if (name) {
      return registry[name.toLowerCase()];
    }
  }
  function registerDefinition(name, definition) {
    registry[name] = definition;
  }
  function generateConstructor(definition) {
    return function() {
      return instantiate(definition);
    };
  }
  var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  function createElementNS(namespace, tag, typeExtension) {
    if (namespace === HTML_NAMESPACE) {
      return createElement(tag, typeExtension);
    } else {
      return domCreateElementNS(namespace, tag);
    }
  }
  function createElement(tag, typeExtension) {
    if (tag) {
      tag = tag.toLowerCase();
    }
    if (typeExtension) {
      typeExtension = typeExtension.toLowerCase();
    }
    var definition = getRegisteredDefinition(typeExtension || tag);
    if (definition) {
      if (tag == definition.tag && typeExtension == definition.is) {
        return new definition.ctor();
      }
      if (!typeExtension && !definition.is) {
        return new definition.ctor();
      }
    }
    var element;
    if (typeExtension) {
      element = createElement(tag);
      element.setAttribute("is", typeExtension);
      return element;
    }
    element = domCreateElement(tag);
    if (tag.indexOf("-") >= 0) {
      implementPrototype(element, HTMLElement);
    }
    return element;
  }
  var domCreateElement = document.createElement.bind(document);
  var domCreateElementNS = document.createElementNS.bind(document);
  var isInstance;
  if (!Object.__proto__ && !useNative) {
    isInstance = function(obj, ctor) {
      if (obj instanceof ctor) {
        return true;
      }
      var p = obj;
      while (p) {
        if (p === ctor.prototype) {
          return true;
        }
        p = p.__proto__;
      }
      return false;
    };
  } else {
    isInstance = function(obj, base) {
      return obj instanceof base;
    };
  }
  function wrapDomMethodToForceUpgrade(obj, methodName) {
    var orig = obj[methodName];
    obj[methodName] = function() {
      var n = orig.apply(this, arguments);
      upgradeAll(n);
      return n;
    };
  }
  wrapDomMethodToForceUpgrade(Node.prototype, "cloneNode");
  wrapDomMethodToForceUpgrade(document, "importNode");
  document.registerElement = register;
  document.createElement = createElement;
  document.createElementNS = createElementNS;
  scope.registry = registry;
  scope.instanceof = isInstance;
  scope.reservedTagList = reservedTagList;
  scope.getRegisteredDefinition = getRegisteredDefinition;
  document.register = document.registerElement;
});

(function(scope) {
  var useNative = scope.useNative;
  var initializeModules = scope.initializeModules;
  var isIE = scope.isIE;
  if (useNative) {
    var nop = function() {};
    scope.watchShadow = nop;
    scope.upgrade = nop;
    scope.upgradeAll = nop;
    scope.upgradeDocumentTree = nop;
    scope.upgradeSubtree = nop;
    scope.takeRecords = nop;
    scope.instanceof = function(obj, base) {
      return obj instanceof base;
    };
  } else {
    initializeModules();
  }
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeDocument = scope.upgradeDocument;
  if (!window.wrap) {
    if (window.ShadowDOMPolyfill) {
      window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
      window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
    } else {
      window.wrap = window.unwrap = function(node) {
        return node;
      };
    }
  }
  if (window.HTMLImports) {
    window.HTMLImports.__importsParsingHook = function(elt) {
      if (elt.import) {
        upgradeDocument(wrap(elt.import));
      }
    };
  }
  function bootstrap() {
    upgradeDocumentTree(window.wrap(document));
    window.CustomElements.ready = true;
    var requestAnimationFrame = window.requestAnimationFrame || function(f) {
      setTimeout(f, 16);
    };
    requestAnimationFrame(function() {
      setTimeout(function() {
        window.CustomElements.readyTime = Date.now();
        if (window.HTMLImports) {
          window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
        }
        document.dispatchEvent(new CustomEvent("WebComponentsReady", {
          bubbles: true
        }));
      });
    });
  }
  if (document.readyState === "complete" || scope.flags.eager) {
    bootstrap();
  } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
    bootstrap();
  } else {
    var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? "HTMLImportsLoaded" : "DOMContentLoaded";
    window.addEventListener(loadEvent, bootstrap);
  }
})(window.CustomElements);
},{}],3:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * Aggregate values from dom tree
 */

var Aggregator = function () {
  function Aggregator(element) {
    _classCallCheck(this, Aggregator);

    this.element = element;
  }

  _createClass(Aggregator, [{
    key: 'aggregate',
    value: function aggregate(scope) {
      var elems = this.element.querySelectorAll('input,select,textarea');
      for (var i = 0, l = elems.length; i < l; ++i) {
        var elem = elems[i];
        var modelName = elem.getAttribute('sj-model');
        if (modelName && modelName.substr(0, 5) === 'this.') {
          var val = elem.type === 'checkbox' ? elem.checked : elem.value;
          new Function('$val', 'if (!' + modelName + ') { ' + modelName + '=$val; }').apply(scope, [val]);
        }
      }
    }
  }]);

  return Aggregator;
}();

module.exports = Aggregator;

},{}],5:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
var scan = require('./text-expression-scanner.js');
var assert = function assert(val) {};

// hack
// https://github.com/google/incremental-dom/issues/239
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value;
};

var sj_attr2event = {
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

var sj_boolean_attributes = {
  'sj-disabled': 'disabled',
  'sj-required': 'required',
  'sj-checked': 'checked'
};

var Compiler = function () {
  function Compiler() {
    _classCallCheck(this, Compiler);

    assert(arguments.length === 0);
  }

  _createClass(Compiler, [{
    key: 'compile',
    value: function compile(templateElement) {
      var children = templateElement.childNodes;
      var code = [];
      for (var i = 0; i < children.length; ++i) {
        code = code.concat(this.renderDOM(children[i], []));
      }
      // console.log(code.join(";\n"));
      return new Function('IncrementalDOM', code.join(";\n"));
    }
  }, {
    key: 'renderDOM',
    value: function renderDOM(elem, vars) {
      assert(elem);
      assert(vars);
      if (elem.nodeType === Node.TEXT_NODE) {
        return 'IncrementalDOM.text(' + this.text(elem.textContent) + ')';
      } else if (elem.nodeType === Node.COMMENT_NODE) {
        // Ignore comment node
        return '';
      }

      var headers = [];
      var footers = [];
      var body = [];

      // process `sj-if`
      {
        var cond = elem.getAttribute('sj-if');
        if (cond) {
          headers.push('if (' + cond + ') {');
          footers.push('}');
        }
      }

      // process `sj-repeat`
      {
        var _cond = elem.getAttribute('sj-repeat');
        if (_cond) {
          var m = _cond.match(/^\s*(?:(\w+)|\(\s*(\w+)\s*,\s*(\w+)\s*\))\s+in\s+([a-z][a-z0-9.]*)\s*$/);
          if (!m) {
            throw 'Invalid sj-repeat value: ' + _cond;
          }

          if (m[1]) {
            var varName = m[1];
            var container = m[4];

            headers.push('(function(IncrementalDOM) {\nvar $$container=' + container + ';\nfor (var $index=0,$l=$$container.length; $index<$l; $index++) {\nvar ' + varName + '=$$container[$index];');
            footers.push('}\n}).apply(this, [IncrementalDOM]);');

            vars = vars.concat([varName, '$index']);
          } else {
            var keyName = m[2];
            var valueName = m[3];
            var _container = m[4];
            headers.push('(function(IncrementalDOM) {\n$$container=' + _container + ';for (var ' + keyName + ' in $$container) {\nvar ' + valueName + '=$$container[' + keyName + '];');
            footers.push('}\n}).apply(this, [IncrementalDOM]);');
            vars = vars.concat([keyName, valueName]);
          }
        }
      }

      var tagName = elem.tagName.toLowerCase();

      // process attributes
      body.push('IncrementalDOM.elementOpenStart("' + tagName + '")');
      body = body.concat(this.renderAttributes(elem, vars));
      body.push('IncrementalDOM.elementOpenEnd("' + tagName + '")');

      var children = elem.childNodes;
      for (var i = 0, l = children.length; i < l; ++i) {
        var child = children[i];
        if (child.nodeType === Node.TEXT_NODE) {
          // replaceVariables
          body.push('IncrementalDOM.text(' + this.text(child.textContent) + ')');
        } else {
          body = body.concat(this.renderDOM(child, vars));
        }
      }
      body.push('IncrementalDOM.elementClose("' + tagName + '")');

      var retval = [';'].concat(headers).concat(body).concat(footers);
      // console.log(`DONE renderDOM ${JSON.stringify(retval)}`);
      return retval;
    }
  }, {
    key: 'renderAttributes',
    value: function renderAttributes(elem, vars) {
      assert(vars);
      var attrs = elem.attributes;
      var codeList = [];
      for (var i = 0, l = attrs.length; i < l; ++i) {
        var attr = attrs[i];
        var code = this.renderAttribute(elem, attrs[i], vars);
        codeList.push(code);
      }
      // console.log(`DONE renderAttributes ${JSON.stringify(codeList)}`);
      return codeList;
    }
  }, {
    key: 'renderAttribute',
    value: function renderAttribute(elem, attr, vars) {
      assert(vars);
      // console.log(`renderAttribute: ${attr.name}=${attr.value}`);

      var attrName = attr.name;
      if (attrName.substr(0, 3) === 'sj-') {
        var event = sj_attr2event[attrName];
        if (event) {
          var expression = attr.value;
          return '\n          IncrementalDOM.attr("' + event + '", function (' + vars.concat(['$event']).join(",") + ') {\n            ' + expression + ';\n          }.bind(' + ['this'].concat(vars).join(",") + '));\n        ';
        } else if (attr.name === 'sj-model') {
          if (elem.type === 'checkbox') {
            return '\n            if (' + attr.value + ') {\n              IncrementalDOM.attr("checked", \'checked\');\n            }\n            IncrementalDOM.attr("onchange", function (' + vars.concat(['$event']).join(",") + ') {\n              ' + attr.value + ' = $event.target.checked;\n              this.update();\n            }.bind(' + ['this'].concat(vars).join(",") + '));\n          ';
          } else {
            return '\n            IncrementalDOM.attr("value", ' + attr.value + ');\n            IncrementalDOM.attr("onchange", function (' + vars.concat(['$event']).join(",") + ') {\n              ' + attr.value + ' = $event.target.value;\n              this.update();\n            }.bind(' + ['this'].concat(vars).join(",") + '));\n          ';
          }
        } else if (sj_boolean_attributes[attr.name]) {
          var attribute = sj_boolean_attributes[attr.name];
          var _expression = attr.value;
          return 'if (' + _expression + ') { IncrementalDOM.attr("' + attribute + '", "' + attribute + '"); }';
        } else if (attr.name === 'sj-class') {
          return 'IncrementalDOM.attr("class", ' + attr.value + '.join(" "));';
        } else if (attr.name === 'sj-style') {
          return 'IncrementalDOM.attr("style", ' + attr.value + ');';
        } else {
          return '';
        }
      } else {
        return 'IncrementalDOM.attr("' + attr.name + '", ' + this.text(attr.value) + ');';
      }
    }
  }, {
    key: 'text',
    value: function text(s) {
      // TODO optimize this
      return scan(s);
    }
  }]);

  return Compiler;
}();

module.exports = Compiler;

},{"./text-expression-scanner.js":10,"incremental-dom/dist/incremental-dom.js":1}],6:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Compiler = require('./compiler.js');
var Aggregator = require('./aggregator.js');
var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

// babel hacks
// See https://phabricator.babeljs.io/T1548
if (typeof HTMLElement !== 'function') {
  var _HTMLElement = function _HTMLElement() {};
  _HTMLElement.prototype = HTMLElement.prototype;
  HTMLElement = _HTMLElement;
}

var Element = function (_HTMLElement2) {
  _inherits(Element, _HTMLElement2);

  function Element() {
    _classCallCheck(this, Element);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Element).apply(this, arguments));
  }

  _createClass(Element, [{
    key: 'createdCallback',
    value: function createdCallback() {
      // parse template
      var template = this.template();
      if (!template) {
        throw 'template shouldn\'t be null';
      }

      var html = document.createElement("div");
      html.innerHTML = template;

      this.prepare();

      // TODO cache result as class variable.
      new Aggregator(html).aggregate(this);
      this.compiled = new Compiler().compile(html);

      this.initialize();

      this.update();
    }
  }, {
    key: 'template',
    value: function template() {
      throw "Please implement 'template' method";
    }
  }, {
    key: 'attributeChangedCallback',
    value: function attributeChangedCallback(key) {
      this[key] = this.getAttribute(key);
      this.update();
    }
  }, {
    key: 'prepare',
    value: function prepare() {
      // nop. abstract method.
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      // nop. abstract method.
    }
  }, {
    key: 'update',
    value: function update() {
      var _this2 = this;

      IncrementalDOM.patch(this, function () {
        _this2.compiled.apply(_this2, [IncrementalDOM]);
      });
    }
  }, {
    key: 'dump',
    value: function dump() {
      var _this3 = this;

      var scope = {};
      Object.keys(this).forEach(function (key) {
        if (key !== 'renderer') {
          scope[key] = _this3[key];
        }
      });
      return scope;
    }
  }]);

  return Element;
}(HTMLElement);

module.exports = Element;

},{"./aggregator.js":4,"./compiler.js":5,"incremental-dom/dist/incremental-dom.js":1}],7:[function(require,module,exports){
'use strict';

// polyfills

require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

var tag = require('./tag.js');
var Element = require('./element.js');

module.exports.Element = Element;
module.exports.tag = tag;

},{"./element.js":6,"./polyfill.js":8,"./tag.js":9,"webcomponents.js/CustomElements.js":2,"whatwg-fetch/fetch.js":3}],8:[function(require,module,exports){
'use strict';

// polyfill

require('webcomponents.js/CustomElements.js');

if (!window.customElements) {
  window.customElements = {
    define: function define(name, elem) {
      document.registerElement(name, elem);
    }
  };
}

},{"webcomponents.js/CustomElements.js":2}],9:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Compiler = require('./compiler');
var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
var Aggregator = require('./aggregator.js');

var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

function tag(tagName, opts) {
  var template = opts.template;
  delete opts['template'];
  if (!template) {
    throw "Missing template";
  }

  var scope = opts['default'] || {};
  var compiled = void 0;

  var elementClassPrototype = Object.create(HTMLElement.prototype);
  var elementClass = function (_HTMLElement) {
    _inherits(elementClass, _HTMLElement);

    function elementClass() {
      _classCallCheck(this, elementClass);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(elementClass).apply(this, arguments));
    }

    _createClass(elementClass, [{
      key: 'createdCallback',
      value: function createdCallback() {
        if (!compiled) {
          var html = document.createElement("div");
          html.innerHTML = function () {
            if (typeof template === 'function') {
              return unwrapComment.exec(template.toString())[1];
            } else {
              return template;
            }
          }();
          new Aggregator(html).aggregate(scope);
          compiled = new Compiler().compile(html);
        }

        for (var key in scope) {
          if (scope.hasOwnProperty(key)) {
            this[key] = scope[key];
          }
        }

        if (opts.initialize) {
          opts.initialize.apply(this);
        }
        this.update();
      }
    }, {
      key: 'attributeChangedCallback',
      value: function attributeChangedCallback(key) {
        this[key] = this.getAttribute(key);
        this.update();
      }
    }, {
      key: 'update',
      value: function update() {
        var _this2 = this;

        IncrementalDOM.patch(this, function () {
          compiled.apply(_this2, [IncrementalDOM]);
        });
      }
    }, {
      key: 'dump',
      value: function dump() {
        var _this3 = this;

        var scope = {};
        Object.keys(this).forEach(function (key) {
          if (key !== 'renderer') {
            scope[key] = _this3[key];
          }
        });
        return scope;
      }
    }]);

    return elementClass;
  }(HTMLElement);

  if (opts.methods) {
    for (var name in opts.methods) {
      elementClass.prototype[name] = opts.methods[name];
    }
  }

  if (opts.accessors) {
    for (var _name in opts.accessors) {
      Object.defineProperty(elementClass.prototype, _name, {
        get: opts.accessors[_name].get,
        set: opts.accessors[_name].set
      });
    }
  }

  customElements.define(tagName, elementClass);
}

module.exports = tag;

},{"./aggregator.js":4,"./compiler":5,"incremental-dom/dist/incremental-dom.js":1}],10:[function(require,module,exports){
'use strict';

function scan(s) {
  var orig = s;
  var result = [];
  while (s.length > 0) {
    var i = s.indexOf('{{');
    if (i >= 0) {
      if (i > 0) {
        // there's prefix string
        var p = s.substr(0, i);
        result.push(JSON.stringify(p));
      }

      // find closing }}
      var l = s.indexOf('}}');
      if (l < 0) {
        throw 'Missing closing \'}}\' in expression: ' + orig;
      }
      var exp = s.substr(i + 2, l - (i + 2));
      if (exp.length > 0) {
        result.push('(' + exp + ')');
      }
      s = s.substr(l + 2);
    } else {
      result.push(JSON.stringify(s));
      break;
    }
  }
  return result.join("+");
}

module.exports = scan;

},{}]},{},[7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5uZGVudi92ZXJzaW9ucy92Ni4yLjEvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzIiwibm9kZV9tb2R1bGVzL3dlYmNvbXBvbmVudHMuanMvQ3VzdG9tRWxlbWVudHMuanMiLCJub2RlX21vZHVsZXMvd2hhdHdnLWZldGNoL2ZldGNoLmpzIiwic3JjL2FnZ3JlZ2F0b3IuanMiLCJzcmMvY29tcGlsZXIuanMiLCJzcmMvZWxlbWVudC5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxsLmpzIiwic3JjL3RhZy5qcyIsInNyYy90ZXh0LWV4cHJlc3Npb24tc2Nhbm5lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwZ0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QVosQUFBVSxBQUFVLEFBQ3BCO1FBQUksS0FBSixBQUFPLEdBQUcsQUFDUjtVQUFJLElBQUosQUFBTSxHQUFHLEFBQ1A7O1lBQU0sSUFBSSxFQUFBLEFBQUUsT0FBRixBQUFTLEdBQW5CLEFBQVUsQUFBWSxBQUN0QjtlQUFBLEFBQU8sS0FBSyxLQUFBLEFBQUssVUFBakIsQUFBWSxBQUFlLEFBQzVCO0FBR0Q7OztVQUFNLElBQUksRUFBQSxBQUFFLFFBQVosQUFBVSxBQUFVLEFBQ3BCO1VBQUksSUFBSixBQUFNLEdBQUcsQUFDUDt5REFBQSxBQUE2QyxBQUM5QztBQUNEO1VBQU0sTUFBTSxFQUFBLEFBQUUsT0FBTyxJQUFULEFBQVcsR0FBRyxLQUFHLElBQTdCLEFBQVksQUFBYyxBQUFLLEFBQy9CO1VBQUksSUFBQSxBQUFJLFNBQVIsQUFBaUIsR0FBRyxBQUNsQjtlQUFBLEFBQU8sV0FBUCxBQUFnQixNQUNqQjtBQUNEO1VBQUUsRUFBQSxBQUFFLE9BQU8sSUFBWCxBQUFFLEFBQVcsQUFDZDtBQWhCRCxXQWdCTyxBQUNMO2FBQUEsQUFBTyxLQUFLLEtBQUEsQUFBSyxVQUFqQixBQUFZLEFBQWUsQUFDM0I7QUFDRDtBQUNGO0FBQ0Q7U0FBTyxPQUFBLEFBQU8sS0FBZCxBQUFPLEFBQVksQUFDcEI7OztBQUVELE9BQUEsQUFBTyxVQUFQLEFBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLkluY3JlbWVudGFsRE9NID0ge30pKSk7XG59KHRoaXMsIGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICAgKi9cbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICAvKipcbiAgICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBjcmVhdGUgZnVuY3Rpb24uXG4gICAqL1xuICB2YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxuICAvKipcbiAgICogVXNlZCB0byBwcmV2ZW50IHByb3BlcnR5IGNvbGxpc2lvbnMgYmV0d2VlbiBvdXIgXCJtYXBcIiBhbmQgaXRzIHByb3RvdHlwZS5cbiAgICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG1hcCBoYXMgcHJvcGVydHkuXG4gICAqL1xuICB2YXIgaGFzID0gZnVuY3Rpb24gKG1hcCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIHByb3BlcnR5KTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBtYXAgb2JqZWN0IHdpdGhvdXQgYSBwcm90b3R5cGUuXG4gICAqIEByZXR1cm4geyFPYmplY3R9XG4gICAqL1xuICB2YXIgY3JlYXRlTWFwID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjcmVhdGUobnVsbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICAgKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpIHtcbiAgICAvKipcbiAgICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgICAqL1xuICAgIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgICAqIHVwZGF0ZWQuXG4gICAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICAgKi9cbiAgICB0aGlzLmF0dHJzQXJyID0gW107XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICAgKi9cbiAgICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICAgKiBtb3ZlIHdpdGhpbiB0aGVpciBwYXJlbnQuXG4gICAgICogQGNvbnN0XG4gICAgICovXG4gICAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgICAvKipcbiAgICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICAgKiB7P09iamVjdDxzdHJpbmcsICFFbGVtZW50Pn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUga2V5TWFwIGlzIGN1cnJlbnRseSB2YWxpZC5cbiAgICAgKiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcFZhbGlkID0gdHJ1ZTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICAgKiBAY29uc3Qge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLnRleHQgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGUgbmFtZSBvZiBub2RlLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gICAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gICAqL1xuICB2YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICAgIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICAgIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10gPSBkYXRhO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byByZXRyaWV2ZSB0aGUgZGF0YSBmb3IuXG4gICAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gICAqL1xuICB2YXIgZ2V0RGF0YSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGRhdGEgPSBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xuXG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICB2YXIgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YXIga2V5ID0gbnVsbDtcblxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgIGtleSA9IG5vZGUuZ2V0QXR0cmlidXRlKCdrZXknKTtcbiAgICAgIH1cblxuICAgICAgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgLyoqIEBjb25zdCAqL1xuICB2YXIgc3ltYm9scyA9IHtcbiAgICBkZWZhdWx0OiAnX19kZWZhdWx0JyxcblxuICAgIHBsYWNlaG9sZGVyOiAnX19wbGFjZWhvbGRlcidcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHJldHVybiB7c3RyaW5nfHVuZGVmaW5lZH0gVGhlIG5hbWVzcGFjZSB0byB1c2UgZm9yIHRoZSBhdHRyaWJ1dGUuXG4gICAqL1xuICB2YXIgZ2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAobmFtZS5sYXN0SW5kZXhPZigneG1sOicsIDApID09PSAwKSB7XG4gICAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG4gICAgfVxuXG4gICAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3hsaW5rOicsIDApID09PSAwKSB7XG4gICAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQXBwbGllcyBhbiBhdHRyaWJ1dGUgb3IgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LiBJZiB0aGUgdmFsdWUgaXMgbnVsbFxuICAgKiBvciB1bmRlZmluZWQsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgRWxlbWVudC4gT3RoZXJ3aXNlLCB0aGUgdmFsdWUgaXMgc2V0XG4gICAqIGFzIGFuIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpPX0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIGFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXR0ck5TID0gZ2V0TmFtZXNwYWNlKG5hbWUpO1xuICAgICAgaWYgKGF0dHJOUykge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhhdHRyTlMsIG5hbWUsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIGFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBlbFtuYW1lXSA9IHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAgICogcHJvcGVydHkgbmFtZXMvdmFsdWVzLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSBzdHlsZSBUaGUgc3R5bGUgdG8gc2V0LiBFaXRoZXIgYSBzdHJpbmcgb2YgY3NzIG9yIGFuIG9iamVjdFxuICAgKiAgICAgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHZhciBhcHBseVN0eWxlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCBzdHlsZSkge1xuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG4gICAgICB2YXIgb2JqID0gLyoqIEB0eXBlIHshT2JqZWN0PHN0cmluZyxzdHJpbmc+fSAqL3N0eWxlO1xuXG4gICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgICBlbFN0eWxlW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3Qgb3JcbiAgICogICAgIGZ1bmN0aW9uIGl0IGlzIHNldCBvbiB0aGUgRWxlbWVudCwgb3RoZXJ3aXNlLCBpdCBpcyBzZXQgYXMgYW4gSFRNTFxuICAgKiAgICAgYXR0cmlidXRlLlxuICAgKi9cbiAgdmFyIGFwcGx5QXR0cmlidXRlVHlwZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYXBwbHlQcm9wKGVsLCBuYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGx5QXR0cihlbCwgbmFtZSwgLyoqIEB0eXBlIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyl9ICovdmFsdWUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2FsbHMgdGhlIGFwcHJvcHJpYXRlIGF0dHJpYnV0ZSBtdXRhdG9yIGZvciB0aGlzIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIHVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuICAgIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgICBpZiAoYXR0cnNbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG11dGF0b3IgPSBhdHRyaWJ1dGVzW25hbWVdIHx8IGF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XTtcbiAgICBtdXRhdG9yKGVsLCBuYW1lLCB2YWx1ZSk7XG5cbiAgICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCBmdW5jdGlvbighRWxlbWVudCwgc3RyaW5nLCAqKT59XG4gICAqL1xuICB2YXIgYXR0cmlidXRlcyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8vIFNwZWNpYWwgZ2VuZXJpYyBtdXRhdG9yIHRoYXQncyBjYWxsZWQgZm9yIGFueSBhdHRyaWJ1dGUgdGhhdCBkb2VzIG5vdFxuICAvLyBoYXZlIGEgc3BlY2lmaWMgbXV0YXRvci5cbiAgYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuICBhdHRyaWJ1dGVzW3N5bWJvbHMucGxhY2Vob2xkZXJdID0gZnVuY3Rpb24gKCkge307XG5cbiAgYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgYW4gZWxlbWVudCAob2YgYSBnaXZlbiB0YWcpIGluLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZ2V0IHRoZSBuYW1lc3BhY2UgZm9yLlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAgICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgdGhlIHRhZyBpbi5cbiAgICovXG4gIHZhciBnZXROYW1lc3BhY2VGb3JUYWcgPSBmdW5jdGlvbiAodGFnLCBwYXJlbnQpIHtcbiAgICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgfVxuXG4gICAgaWYgKGdldERhdGEocGFyZW50KS5ub2RlTmFtZSA9PT0gJ2ZvcmVpZ25PYmplY3QnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyZW50Lm5hbWVzcGFjZVVSSTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBFbGVtZW50LlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fVxuICAgKi9cbiAgdmFyIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZG9jLCBwYXJlbnQsIHRhZywga2V5LCBzdGF0aWNzKSB7XG4gICAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcsIHBhcmVudCk7XG4gICAgdmFyIGVsID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIH1cblxuICAgIGluaXREYXRhKGVsLCB0YWcsIGtleSk7XG5cbiAgICBpZiAoc3RhdGljcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0aWNzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShlbCwgLyoqIEB0eXBlIHshc3RyaW5nfSovc3RhdGljc1tpXSwgc3RhdGljc1tpICsgMV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFRleHQgTm9kZS5cbiAgICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IVRleHR9XG4gICAqL1xuICB2YXIgY3JlYXRlVGV4dCA9IGZ1bmN0aW9uIChkb2MpIHtcbiAgICB2YXIgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgaW5pdERhdGEobm9kZSwgJyN0ZXh0JywgbnVsbCk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXBwaW5nIHRoYXQgY2FuIGJlIHVzZWQgdG8gbG9vayB1cCBjaGlsZHJlbiB1c2luZyBhIGtleS5cbiAgICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAgICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFFbGVtZW50Pn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gdGhlIGNoaWxkcmVuIG9mIHRoZVxuICAgKiAgICAgRWxlbWVudC5cbiAgICovXG4gIHZhciBjcmVhdGVLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgbWFwID0gY3JlYXRlTWFwKCk7XG4gICAgdmFyIGNoaWxkID0gZWwuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIHZhciBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG5cbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgbWFwW2tleV0gPSBjaGlsZDtcbiAgICAgIH1cblxuICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBtYXBwaW5nIG9mIGtleSB0byBjaGlsZCBub2RlIGZvciBhIGdpdmVuIEVsZW1lbnQsIGNyZWF0aW5nIGl0XG4gICAqIGlmIG5lY2Vzc2FyeS5cbiAgICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAgICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFOb2RlPn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gY2hpbGQgRWxlbWVudHNcbiAgICovXG4gIHZhciBnZXRLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuXG4gICAgaWYgKCFkYXRhLmtleU1hcCkge1xuICAgICAgZGF0YS5rZXlNYXAgPSBjcmVhdGVLZXlNYXAoZWwpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhLmtleU1hcDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgY2hpbGQgZnJvbSB0aGUgcGFyZW50IHdpdGggdGhlIGdpdmVuIGtleS5cbiAgICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICAgKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIGNoaWxkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGtleS5cbiAgICovXG4gIHZhciBnZXRDaGlsZCA9IGZ1bmN0aW9uIChwYXJlbnQsIGtleSkge1xuICAgIHJldHVybiBrZXkgPyBnZXRLZXlNYXAocGFyZW50KVtrZXldIDogbnVsbDtcbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGFuIGVsZW1lbnQgYXMgYmVpbmcgYSBjaGlsZC4gVGhlIHBhcmVudCB3aWxsIGtlZXAgdHJhY2sgb2YgdGhlXG4gICAqIGNoaWxkIHVzaW5nIHRoZSBrZXkuIFRoZSBjaGlsZCBjYW4gYmUgcmV0cmlldmVkIHVzaW5nIHRoZSBzYW1lIGtleSB1c2luZ1xuICAgKiBnZXRLZXlNYXAuIFRoZSBwcm92aWRlZCBrZXkgc2hvdWxkIGJlIHVuaXF1ZSB3aXRoaW4gdGhlIHBhcmVudCBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnQgVGhlIHBhcmVudCBvZiBjaGlsZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgY2hpbGQgd2l0aC5cbiAgICogQHBhcmFtIHshTm9kZX0gY2hpbGQgVGhlIGNoaWxkIHRvIHJlZ2lzdGVyLlxuICAgKi9cbiAgdmFyIHJlZ2lzdGVyQ2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXksIGNoaWxkKSB7XG4gICAgZ2V0S2V5TWFwKHBhcmVudClba2V5XSA9IGNoaWxkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgLyoqIEBjb25zdCAqL1xuICB2YXIgbm90aWZpY2F0aW9ucyA9IHtcbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZFxuICAgICAqIGFuZCBhZGRlZCB0byB0aGUgRE9NLlxuICAgICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICAgKi9cbiAgICBub2Rlc0NyZWF0ZWQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgICAqIGZyb20gdGhlIERPTS5cbiAgICAgKiBOb3RlIGl0J3MgYW4gYXBwbGljYXRpb25zIHJlc3BvbnNpYmlsaXR5IHRvIGhhbmRsZSBhbnkgY2hpbGROb2Rlcy5cbiAgICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAgICovXG4gICAgbm9kZXNEZWxldGVkOiBudWxsXG4gIH07XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBzdGF0ZSBvZiBhIHBhdGNoLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIENvbnRleHQoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICAgKi9cbiAgICB0aGlzLmNyZWF0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCAmJiBbXTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAgICovXG4gICAgdGhpcy5kZWxldGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQgJiYgW107XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICh0aGlzLmNyZWF0ZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubWFya0RlbGV0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICAgIHRoaXMuZGVsZXRlZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTm90aWZpZXMgYWJvdXQgbm9kZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZHVyaW5nIHRoZSBwYXRjaCBvcGVhcmF0aW9uLlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubm90aWZ5Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5jcmVhdGVkICYmIHRoaXMuY3JlYXRlZC5sZW5ndGggPiAwKSB7XG4gICAgICBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCh0aGlzLmNyZWF0ZWQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmRlbGV0ZWQgJiYgdGhpcy5kZWxldGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAqIE1ha2VzIHN1cmUgdGhhdCBrZXllZCBFbGVtZW50IG1hdGNoZXMgdGhlIHRhZyBuYW1lIHByb3ZpZGVkLlxuICAqIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIG9mIHRoZSBub2RlIHRoYXQgaXMgYmVpbmcgbWF0Y2hlZC5cbiAgKiBAcGFyYW0ge3N0cmluZz19IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIEVsZW1lbnQuXG4gICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgb2YgdGhlIEVsZW1lbnQuXG4gICovXG4gIHZhciBhc3NlcnRLZXllZFRhZ01hdGNoZXMgPSBmdW5jdGlvbiAobm9kZU5hbWUsIHRhZywga2V5KSB7XG4gICAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignV2FzIGV4cGVjdGluZyBub2RlIHdpdGgga2V5IFwiJyArIGtleSArICdcIiB0byBiZSBhICcgKyB0YWcgKyAnLCBub3QgYSAnICsgbm9kZU5hbWUgKyAnLicpO1xuICAgIH1cbiAgfTtcblxuICAvKiogQHR5cGUgez9Db250ZXh0fSAqL1xuICB2YXIgY29udGV4dCA9IG51bGw7XG5cbiAgLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbiAgdmFyIGN1cnJlbnROb2RlID0gbnVsbDtcblxuICAvKiogQHR5cGUgez9Ob2RlfSAqL1xuICB2YXIgY3VycmVudFBhcmVudCA9IG51bGw7XG5cbiAgLyoqIEB0eXBlIHs/RWxlbWVudHw/RG9jdW1lbnRGcmFnbWVudH0gKi9cbiAgdmFyIHJvb3QgPSBudWxsO1xuXG4gIC8qKiBAdHlwZSB7P0RvY3VtZW50fSAqL1xuICB2YXIgZG9jID0gbnVsbDtcblxuICAvKipcbiAgICogUmV0dXJucyBhIHBhdGNoZXIgZnVuY3Rpb24gdGhhdCBzZXRzIHVwIGFuZCByZXN0b3JlcyBhIHBhdGNoIGNvbnRleHQsXG4gICAqIHJ1bm5pbmcgdGhlIHJ1biBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBkYXRhLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KX0gcnVuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KX1cbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBwYXRjaEZhY3RvcnkgPSBmdW5jdGlvbiAocnVuKSB7XG4gICAgLyoqXG4gICAgICogVE9ETyhtb3opOiBUaGVzZSBhbm5vdGF0aW9ucyB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSB3ZSBzd2l0Y2ggdG8gQ2xvc3VyZVxuICAgICAqIENvbXBpbGVyJ3MgbmV3IHR5cGUgaW5mZXJlbmNlLiBSZW1vdmUgdGhlc2Ugb25jZSB0aGUgc3dpdGNoIGlzIGRvbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCl9IG5vZGVcbiAgICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm5cbiAgICAgKiBAcGFyYW0ge1Q9fSBkYXRhXG4gICAgICogQHRlbXBsYXRlIFRcbiAgICAgKi9cbiAgICB2YXIgZiA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgICAgdmFyIHByZXZDb250ZXh0ID0gY29udGV4dDtcbiAgICAgIHZhciBwcmV2Um9vdCA9IHJvb3Q7XG4gICAgICB2YXIgcHJldkRvYyA9IGRvYztcbiAgICAgIHZhciBwcmV2Q3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZTtcbiAgICAgIHZhciBwcmV2Q3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgICB2YXIgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICAgIHZhciBwcmV2aW91c0luU2tpcCA9IGZhbHNlO1xuXG4gICAgICBjb250ZXh0ID0gbmV3IENvbnRleHQoKTtcbiAgICAgIHJvb3QgPSBub2RlO1xuICAgICAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgICAgY3VycmVudFBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgICBydW4obm9kZSwgZm4sIGRhdGEpO1xuXG4gICAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICAgIGNvbnRleHQubm90aWZ5Q2hhbmdlcygpO1xuXG4gICAgICBjb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gICAgICByb290ID0gcHJldlJvb3Q7XG4gICAgICBkb2MgPSBwcmV2RG9jO1xuICAgICAgY3VycmVudE5vZGUgPSBwcmV2Q3VycmVudE5vZGU7XG4gICAgICBjdXJyZW50UGFyZW50ID0gcHJldkN1cnJlbnRQYXJlbnQ7XG4gICAgfTtcbiAgICByZXR1cm4gZjtcbiAgfTtcblxuICAvKipcbiAgICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgbm9kZSB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpc1xuICAgKiBmdW5jdGlvbiBtYXkgYmUgY2FsbGVkIGR1cmluZyBhbiBleGlzdGluZyBwYXRjaCBvcGVyYXRpb24uXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAgICogICAgIHRvIHBhdGNoLlxuICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gICAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gICAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgcGF0Y2hJbm5lciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgICBjdXJyZW50Tm9kZSA9IG5vZGU7XG5cbiAgICBlbnRlck5vZGUoKTtcbiAgICBmbihkYXRhKTtcbiAgICBleGl0Tm9kZSgpO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICB9KTtcblxuICAvKipcbiAgICogUGF0Y2hlcyBhbiBFbGVtZW50IHdpdGggdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gRXhhY3RseSBvbmUgdG9wIGxldmVsXG4gICAqIGVsZW1lbnQgY2FsbCBzaG91bGQgYmUgbWFkZSBjb3JyZXNwb25kaW5nIHRvIGBub2RlYC5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gbm9kZSBUaGUgRWxlbWVudCB3aGVyZSB0aGUgcGF0Y2ggc2hvdWxkIHN0YXJ0LlxuICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gICAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uIFRoaXMgc2hvdWxkIGhhdmUgYXQgbW9zdCBvbmUgdG9wIGxldmVsXG4gICAqICAgICBlbGVtZW50IGNhbGwuXG4gICAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgcGF0Y2hPdXRlciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgICBjdXJyZW50Tm9kZSA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICoveyBuZXh0U2libGluZzogbm9kZSB9O1xuXG4gICAgZm4oZGF0YSk7XG5cbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgbm9kZSBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgbm9kZU5hbWUgYW5kXG4gICAqIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIG1hdGNoZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIHZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXkpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoY3VycmVudE5vZGUpO1xuXG4gICAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gICAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gICAgLy8gc3RyaW5ncywgbnVsbCBhbmQgdW5kZWZpbmVkIHNvIHRoZSA9PSBzZW1hbnRpY3MgYXJlIG5vdCB0b28gd2VpcmQuXG4gICAgcmV0dXJuIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lICYmIGtleSA9PSBkYXRhLmtleTtcbiAgfTtcblxuICAvKipcbiAgICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gICAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGEgdmFsaWQgdGFnIHN0cmluZy5cbiAgICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhbiBhcnJheSBvZlxuICAgKiAgICAgbmFtZS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHZhciBhbGlnbldpdGhET00gPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSwgc3RhdGljcykge1xuICAgIGlmIChjdXJyZW50Tm9kZSAmJiBtYXRjaGVzKG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50LlxuICAgIGlmIChrZXkpIHtcbiAgICAgIG5vZGUgPSBnZXRDaGlsZChjdXJyZW50UGFyZW50LCBrZXkpO1xuICAgICAgaWYgKG5vZGUgJiYgJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzKGdldERhdGEobm9kZSkubm9kZU5hbWUsIG5vZGVOYW1lLCBrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgbm9kZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgIGlmICghbm9kZSkge1xuICAgICAgaWYgKG5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICAgIG5vZGUgPSBjcmVhdGVUZXh0KGRvYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gY3JlYXRlRWxlbWVudChkb2MsIGN1cnJlbnRQYXJlbnQsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIHJlZ2lzdGVyQ2hpbGQoY3VycmVudFBhcmVudCwga2V5LCBub2RlKTtcbiAgICAgIH1cblxuICAgICAgY29udGV4dC5tYXJrQ3JlYXRlZChub2RlKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgbm9kZSBoYXMgYSBrZXksIHJlbW92ZSBpdCBmcm9tIHRoZSBET00gdG8gcHJldmVudCBhIGxhcmdlIG51bWJlclxuICAgIC8vIG9mIHJlLW9yZGVycyBpbiB0aGUgY2FzZSB0aGF0IGl0IG1vdmVkIGZhciBvciB3YXMgY29tcGxldGVseSByZW1vdmVkLlxuICAgIC8vIFNpbmNlIHdlIGhvbGQgb24gdG8gYSByZWZlcmVuY2UgdGhyb3VnaCB0aGUga2V5TWFwLCB3ZSBjYW4gYWx3YXlzIGFkZCBpdFxuICAgIC8vIGJhY2suXG4gICAgaWYgKGN1cnJlbnROb2RlICYmIGdldERhdGEoY3VycmVudE5vZGUpLmtleSkge1xuICAgICAgY3VycmVudFBhcmVudC5yZXBsYWNlQ2hpbGQobm9kZSwgY3VycmVudE5vZGUpO1xuICAgICAgZ2V0RGF0YShjdXJyZW50UGFyZW50KS5rZXlNYXBWYWxpZCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50UGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBjdXJyZW50Tm9kZSk7XG4gICAgfVxuXG4gICAgY3VycmVudE5vZGUgPSBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbGVhcnMgb3V0IGFueSB1bnZpc2l0ZWQgTm9kZXMsIGFzIHRoZSBjb3JyZXNwb25kaW5nIHZpcnR1YWwgZWxlbWVudFxuICAgKiBmdW5jdGlvbnMgd2VyZSBuZXZlciBjYWxsZWQgZm9yIHRoZW0uXG4gICAqL1xuICB2YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSBjdXJyZW50UGFyZW50O1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gICAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgICB2YXIgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgICB2YXIga2V5ID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKGNoaWxkID09PSBjdXJyZW50Tm9kZSAmJiBrZXlNYXBWYWxpZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmF0dHJzW3N5bWJvbHMucGxhY2Vob2xkZXJdICYmIG5vZGUgIT09IHJvb3QpIHtcbiAgICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aGlsZSAoY2hpbGQgIT09IGN1cnJlbnROb2RlKSB7XG4gICAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoIC8qKiBAdHlwZSB7IU5vZGV9Ki9jaGlsZCk7XG5cbiAgICAgIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgfVxuICAgICAgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB0aGUga2V5TWFwLCByZW1vdmluZyBhbnkgdW51c3VlZCBrZXlzLlxuICAgIGlmICgha2V5TWFwVmFsaWQpIHtcbiAgICAgIGZvciAoa2V5IGluIGtleU1hcCkge1xuICAgICAgICBjaGlsZCA9IGtleU1hcFtrZXldO1xuICAgICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSAhPT0gbm9kZSkge1xuICAgICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBkYXRhLmtleU1hcFZhbGlkID0gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqL1xuICB2YXIgZW50ZXJOb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKi9cbiAgdmFyIG5leHROb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChjdXJyZW50Tm9kZSkge1xuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnQgbm9kZSwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbi5cbiAgICovXG4gIHZhciBleGl0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjbGVhclVudmlzaXRlZERPTSgpO1xuXG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50O1xuICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudE5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY3VycmVudCBub2RlIGlzIGFuIEVsZW1lbnQgd2l0aCBhIG1hdGNoaW5nIHRhZ05hbWUgYW5kXG4gICAqIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGNvcmVFbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICAgIG5leHROb2RlKCk7XG4gICAgYWxpZ25XaXRoRE9NKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgICBlbnRlck5vZGUoKTtcbiAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgY3VycmVudGx5IG9wZW4gRWxlbWVudCwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbiBpZlxuICAgKiBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGNvcmVFbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgZXhpdE5vZGUoKTtcbiAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudE5vZGVcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBNYWtlcyBzdXJlIHRoZSBjdXJyZW50IG5vZGUgaXMgYSBUZXh0IG5vZGUgYW5kIGNyZWF0ZXMgYSBUZXh0IG5vZGUgaWYgaXQgaXNcbiAgICogbm90LlxuICAgKlxuICAgKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgVGV4dCBOb2RlLlxuICAgKi9cbiAgdmFyIGNvcmVUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIG5leHROb2RlKCk7XG4gICAgYWxpZ25XaXRoRE9NKCcjdGV4dCcsIG51bGwsIG51bGwpO1xuICAgIHJldHVybiAoLyoqIEB0eXBlIHshVGV4dH0gKi9jdXJyZW50Tm9kZVxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgRWxlbWVudCBiZWluZyBwYXRjaGVkLlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH1cbiAgICovXG4gIHZhciBjdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gICAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTa2lwcyB0aGUgY2hpbGRyZW4gaW4gYSBzdWJ0cmVlLCBhbGxvd2luZyBhbiBFbGVtZW50IHRvIGJlIGNsb3NlZCB3aXRob3V0XG4gICAqIGNsZWFyaW5nIG91dCB0aGUgY2hpbGRyZW4uXG4gICAqL1xuICB2YXIgc2tpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50Lmxhc3RDaGlsZDtcbiAgfTtcblxuICAvKipcbiAgICogVGhlIG9mZnNldCBpbiB0aGUgdmlydHVhbCBlbGVtZW50IGRlY2xhcmF0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFyZVxuICAgKiBzcGVjaWZpZWQuXG4gICAqIEBjb25zdFxuICAgKi9cbiAgdmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuICAvKipcbiAgICogQnVpbGRzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdXNlIHdpdGggZWxlbWVudE9wZW5TdGFydCwgYXR0ciBhbmRcbiAgICogZWxlbWVudE9wZW5FbmQuXG4gICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAqL1xuICB2YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gICAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudE9wZW4odGFnLCBrZXksIHN0YXRpY3MpO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAgIC8qXG4gICAgICogQ2hlY2tzIHRvIHNlZSBpZiBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCBmb3IgYSBnaXZlbiBFbGVtZW50LlxuICAgICAqIFdoZW4gbm8gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoaXMgaXMgbXVjaCBmYXN0ZXIgdGhhbiBjaGVja2luZyBlYWNoXG4gICAgICogaW5kaXZpZHVhbCBhcmd1bWVudC4gV2hlbiBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhlIG92ZXJoZWFkIG9mIHRoaXMgaXNcbiAgICAgKiBtaW5pbWFsLlxuICAgICAqL1xuICAgIHZhciBhdHRyc0FyciA9IGRhdGEuYXR0cnNBcnI7XG4gICAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgICB2YXIgYXR0cnNDaGFuZ2VkID0gZmFsc2U7XG4gICAgdmFyIGkgPSBBVFRSSUJVVEVTX09GRlNFVDtcbiAgICB2YXIgaiA9IDA7XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBpZiAoYXR0cnNBcnJbal0gIT09IGFyZ3VtZW50c1tpXSkge1xuICAgICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBhdHRyc0FycltqXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgICAgYXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgICAqL1xuICAgIGlmIChhdHRyc0NoYW5nZWQpIHtcbiAgICAgIGZvciAoaSA9IEFUVFJJQlVURVNfT0ZGU0VUOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIG5ld0F0dHJzW2FyZ3VtZW50c1tpXV0gPSBhcmd1bWVudHNbaSArIDFdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBfYXR0ciBpbiBuZXdBdHRycykge1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgX2F0dHIsIG5ld0F0dHJzW19hdHRyXSk7XG4gICAgICAgIG5ld0F0dHJzW19hdHRyXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50LiBUaGlzXG4gICAqIGNvcnJlc3BvbmRzIHRvIGFuIG9wZW5pbmcgdGFnIGFuZCBhIGVsZW1lbnRDbG9zZSB0YWcgaXMgcmVxdWlyZWQuIFRoaXMgaXNcbiAgICogbGlrZSBlbGVtZW50T3BlbiwgYnV0IHRoZSBhdHRyaWJ1dGVzIGFyZSBkZWZpbmVkIHVzaW5nIHRoZSBhdHRyIGZ1bmN0aW9uXG4gICAqIHJhdGhlciB0aGFuIGJlaW5nIHBhc3NlZCBhcyBhcmd1bWVudHMuIE11c3QgYmUgZm9sbGxvd2VkIGJ5IDAgb3IgbW9yZSBjYWxsc1xuICAgKiB0byBhdHRyLCB0aGVuIGEgY2FsbCB0byBlbGVtZW50T3BlbkVuZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICB2YXIgZWxlbWVudE9wZW5TdGFydCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGFyZ3NCdWlsZGVyWzBdID0gdGFnO1xuICAgIGFyZ3NCdWlsZGVyWzFdID0ga2V5O1xuICAgIGFyZ3NCdWlsZGVyWzJdID0gc3RhdGljcztcbiAgfTtcblxuICAvKioqXG4gICAqIERlZmluZXMgYSB2aXJ0dWFsIGF0dHJpYnV0ZSBhdCB0aGlzIHBvaW50IG9mIHRoZSBET00uIFRoaXMgaXMgb25seSB2YWxpZFxuICAgKiB3aGVuIGNhbGxlZCBiZXR3ZWVuIGVsZW1lbnRPcGVuU3RhcnQgYW5kIGVsZW1lbnRPcGVuRW5kLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0geyp9IHZhbHVlXG4gICAqL1xuICB2YXIgYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSwgdmFsdWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHZhciBub2RlID0gZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJnc0J1aWxkZXIpO1xuICAgIGFyZ3NCdWlsZGVyLmxlbmd0aCA9IDA7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbiBvcGVuIHZpcnR1YWwgRWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHZhciBub2RlID0gY29yZUVsZW1lbnRDbG9zZSgpO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICAgKiBubyBjaGlsZHJlbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gICAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRWb2lkID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gICAgZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGlzIGFcbiAgICogcGxhY2Vob2xkZXIgZWxlbWVudC4gQ2hpbGRyZW4gb2YgdGhpcyBFbGVtZW50IGNhbiBiZSBtYW51YWxseSBtYW5hZ2VkIGFuZFxuICAgKiB3aWxsIG5vdCBiZSBjbGVhcmVkIGJ5IHRoZSBsaWJyYXJ5LlxuICAgKlxuICAgKiBBIGtleSBtdXN0IGJlIHNwZWNpZmllZCB0byBtYWtlIHN1cmUgdGhhdCB0aGlzIG5vZGUgaXMgY29ycmVjdGx5IHByZXNlcnZlZFxuICAgKiBhY3Jvc3MgYWxsIGNvbmRpdGlvbmFscy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IGNvbnN0X2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBlbGVtZW50UGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIGNvbnN0X2FyZ3MpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIHNraXAoKTtcbiAgICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8Ym9vbGVhbn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBUZXh0LlxuICAgKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gY29uc3RfYXJnc1xuICAgKiAgICAgRnVuY3Rpb25zIHRvIGZvcm1hdCB0aGUgdmFsdWUgd2hpY2ggYXJlIGNhbGxlZCBvbmx5IHdoZW4gdGhlIHZhbHVlIGhhc1xuICAgKiAgICAgY2hhbmdlZC5cbiAgICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAgICovXG4gIHZhciB0ZXh0ID0gZnVuY3Rpb24gKHZhbHVlLCBjb25zdF9hcmdzKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgdmFyIG5vZGUgPSBjb3JlVGV4dCgpO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAgIGlmIChkYXRhLnRleHQgIT09IHZhbHVlKSB7XG4gICAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgICAgdmFyIGZvcm1hdHRlZCA9IHZhbHVlO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLypcbiAgICAgICAgICogQ2FsbCB0aGUgZm9ybWF0dGVyIGZ1bmN0aW9uIGRpcmVjdGx5IHRvIHByZXZlbnQgbGVha2luZyBhcmd1bWVudHMuXG4gICAgICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvaW5jcmVtZW50YWwtZG9tL3B1bGwvMjA0I2lzc3VlY29tbWVudC0xNzgyMjM1NzRcbiAgICAgICAgICovXG4gICAgICAgIHZhciBmbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9ybWF0dGVkID0gZm4oZm9ybWF0dGVkKTtcbiAgICAgIH1cblxuICAgICAgbm9kZS5kYXRhID0gZm9ybWF0dGVkO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIGV4cG9ydHMucGF0Y2ggPSBwYXRjaElubmVyO1xuICBleHBvcnRzLnBhdGNoSW5uZXIgPSBwYXRjaElubmVyO1xuICBleHBvcnRzLnBhdGNoT3V0ZXIgPSBwYXRjaE91dGVyO1xuICBleHBvcnRzLmN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQ7XG4gIGV4cG9ydHMuc2tpcCA9IHNraXA7XG4gIGV4cG9ydHMuZWxlbWVudFZvaWQgPSBlbGVtZW50Vm9pZDtcbiAgZXhwb3J0cy5lbGVtZW50T3BlblN0YXJ0ID0gZWxlbWVudE9wZW5TdGFydDtcbiAgZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGVsZW1lbnRPcGVuRW5kO1xuICBleHBvcnRzLmVsZW1lbnRPcGVuID0gZWxlbWVudE9wZW47XG4gIGV4cG9ydHMuZWxlbWVudENsb3NlID0gZWxlbWVudENsb3NlO1xuICBleHBvcnRzLmVsZW1lbnRQbGFjZWhvbGRlciA9IGVsZW1lbnRQbGFjZWhvbGRlcjtcbiAgZXhwb3J0cy50ZXh0ID0gdGV4dDtcbiAgZXhwb3J0cy5hdHRyID0gYXR0cjtcbiAgZXhwb3J0cy5zeW1ib2xzID0gc3ltYm9scztcbiAgZXhwb3J0cy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgZXhwb3J0cy5hcHBseUF0dHIgPSBhcHBseUF0dHI7XG4gIGV4cG9ydHMuYXBwbHlQcm9wID0gYXBwbHlQcm9wO1xuICBleHBvcnRzLm5vdGlmaWNhdGlvbnMgPSBub3RpZmljYXRpb25zO1xuXG59KSk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8vIEB2ZXJzaW9uIDAuNy4yMlxuaWYgKHR5cGVvZiBXZWFrTWFwID09PSBcInVuZGVmaW5lZFwiKSB7XG4gIChmdW5jdGlvbigpIHtcbiAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gICAgdmFyIGNvdW50ZXIgPSBEYXRlLm5vdygpICUgMWU5O1xuICAgIHZhciBXZWFrTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm5hbWUgPSBcIl9fc3RcIiArIChNYXRoLnJhbmRvbSgpICogMWU5ID4+PiAwKSArIChjb3VudGVyKysgKyBcIl9fXCIpO1xuICAgIH07XG4gICAgV2Vha01hcC5wcm90b3R5cGUgPSB7XG4gICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSBlbnRyeVsxXSA9IHZhbHVlOyBlbHNlIGRlZmluZVByb3BlcnR5KGtleSwgdGhpcy5uYW1lLCB7XG4gICAgICAgICAgdmFsdWU6IFsga2V5LCB2YWx1ZSBdLFxuICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgZW50cnk7XG4gICAgICAgIHJldHVybiAoZW50cnkgPSBrZXlbdGhpcy5uYW1lXSkgJiYgZW50cnlbMF0gPT09IGtleSA/IGVudHJ5WzFdIDogdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgaWYgKCFlbnRyeSB8fCBlbnRyeVswXSAhPT0ga2V5KSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGVudHJ5WzBdID0gZW50cnlbMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICBpZiAoIWVudHJ5KSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBlbnRyeVswXSA9PT0ga2V5O1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LldlYWtNYXAgPSBXZWFrTWFwO1xuICB9KSgpO1xufVxuXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIGlmIChnbG9iYWwuSnNNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciByZWdpc3RyYXRpb25zVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICB2YXIgc2V0SW1tZWRpYXRlO1xuICBpZiAoL1RyaWRlbnR8RWRnZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgIHNldEltbWVkaWF0ZSA9IHNldFRpbWVvdXQ7XG4gIH0gZWxzZSBpZiAod2luZG93LnNldEltbWVkaWF0ZSkge1xuICAgIHNldEltbWVkaWF0ZSA9IHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNldEltbWVkaWF0ZVF1ZXVlID0gW107XG4gICAgdmFyIHNlbnRpbmVsID0gU3RyaW5nKE1hdGgucmFuZG9tKCkpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5kYXRhID09PSBzZW50aW5lbCkge1xuICAgICAgICB2YXIgcXVldWUgPSBzZXRJbW1lZGlhdGVRdWV1ZTtcbiAgICAgICAgc2V0SW1tZWRpYXRlUXVldWUgPSBbXTtcbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgZnVuYygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZXRJbW1lZGlhdGUgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICBzZXRJbW1lZGlhdGVRdWV1ZS5wdXNoKGZ1bmMpO1xuICAgICAgd2luZG93LnBvc3RNZXNzYWdlKHNlbnRpbmVsLCBcIipcIik7XG4gICAgfTtcbiAgfVxuICB2YXIgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgdmFyIHNjaGVkdWxlZE9ic2VydmVycyA9IFtdO1xuICBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrKG9ic2VydmVyKSB7XG4gICAgc2NoZWR1bGVkT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xuICAgIGlmICghaXNTY2hlZHVsZWQpIHtcbiAgICAgIGlzU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgIHNldEltbWVkaWF0ZShkaXNwYXRjaENhbGxiYWNrcyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHdyYXBJZk5lZWRlZChub2RlKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCAmJiB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkKG5vZGUpIHx8IG5vZGU7XG4gIH1cbiAgZnVuY3Rpb24gZGlzcGF0Y2hDYWxsYmFja3MoKSB7XG4gICAgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gc2NoZWR1bGVkT2JzZXJ2ZXJzO1xuICAgIHNjaGVkdWxlZE9ic2VydmVycyA9IFtdO1xuICAgIG9ic2VydmVycy5zb3J0KGZ1bmN0aW9uKG8xLCBvMikge1xuICAgICAgcmV0dXJuIG8xLnVpZF8gLSBvMi51aWRfO1xuICAgIH0pO1xuICAgIHZhciBhbnlOb25FbXB0eSA9IGZhbHNlO1xuICAgIG9ic2VydmVycy5mb3JFYWNoKGZ1bmN0aW9uKG9ic2VydmVyKSB7XG4gICAgICB2YXIgcXVldWUgPSBvYnNlcnZlci50YWtlUmVjb3JkcygpO1xuICAgICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKTtcbiAgICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgb2JzZXJ2ZXIuY2FsbGJhY2tfKHF1ZXVlLCBvYnNlcnZlcik7XG4gICAgICAgIGFueU5vbkVtcHR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoYW55Tm9uRW1wdHkpIGRpc3BhdGNoQ2FsbGJhY2tzKCk7XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKSB7XG4gICAgb2JzZXJ2ZXIubm9kZXNfLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZXR1cm47XG4gICAgICByZWdpc3RyYXRpb25zLmZvckVhY2goZnVuY3Rpb24ocmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IG9ic2VydmVyKSByZWdpc3RyYXRpb24ucmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBjYWxsYmFjaykge1xuICAgIGZvciAodmFyIG5vZGUgPSB0YXJnZXQ7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmIChyZWdpc3RyYXRpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2pdO1xuICAgICAgICAgIHZhciBvcHRpb25zID0gcmVnaXN0cmF0aW9uLm9wdGlvbnM7XG4gICAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldCAmJiAhb3B0aW9ucy5zdWJ0cmVlKSBjb250aW51ZTtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gY2FsbGJhY2sob3B0aW9ucyk7XG4gICAgICAgICAgaWYgKHJlY29yZCkgcmVnaXN0cmF0aW9uLmVucXVldWUocmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgdWlkQ291bnRlciA9IDA7XG4gIGZ1bmN0aW9uIEpzTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuICAgIHRoaXMuY2FsbGJhY2tfID0gY2FsbGJhY2s7XG4gICAgdGhpcy5ub2Rlc18gPSBbXTtcbiAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgdGhpcy51aWRfID0gKyt1aWRDb3VudGVyO1xuICB9XG4gIEpzTXV0YXRpb25PYnNlcnZlci5wcm90b3R5cGUgPSB7XG4gICAgb2JzZXJ2ZTogZnVuY3Rpb24odGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICB0YXJnZXQgPSB3cmFwSWZOZWVkZWQodGFyZ2V0KTtcbiAgICAgIGlmICghb3B0aW9ucy5jaGlsZExpc3QgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhIHx8IG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fCBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fCBvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcigpO1xuICAgICAgfVxuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KHRhcmdldCk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQodGFyZ2V0LCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXS5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbi5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgcmVnaXN0cmF0aW9uID0gbmV3IFJlZ2lzdHJhdGlvbih0aGlzLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICByZWdpc3RyYXRpb25zLnB1c2gocmVnaXN0cmF0aW9uKTtcbiAgICAgICAgdGhpcy5ub2Rlc18ucHVzaCh0YXJnZXQpO1xuICAgICAgfVxuICAgICAgcmVnaXN0cmF0aW9uLmFkZExpc3RlbmVycygpO1xuICAgIH0sXG4gICAgZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm5vZGVzXy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgfSxcbiAgICB0YWtlUmVjb3JkczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29weU9mUmVjb3JkcyA9IHRoaXMucmVjb3Jkc187XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgICByZXR1cm4gY29weU9mUmVjb3JkcztcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5hZGRlZE5vZGVzID0gW107XG4gICAgdGhpcy5yZW1vdmVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnByZXZpb3VzU2libGluZyA9IG51bGw7XG4gICAgdGhpcy5uZXh0U2libGluZyA9IG51bGw7XG4gICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gbnVsbDtcbiAgICB0aGlzLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG51bGw7XG4gICAgdGhpcy5vbGRWYWx1ZSA9IG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gY29weU11dGF0aW9uUmVjb3JkKG9yaWdpbmFsKSB7XG4gICAgdmFyIHJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZChvcmlnaW5hbC50eXBlLCBvcmlnaW5hbC50YXJnZXQpO1xuICAgIHJlY29yZC5hZGRlZE5vZGVzID0gb3JpZ2luYWwuYWRkZWROb2Rlcy5zbGljZSgpO1xuICAgIHJlY29yZC5yZW1vdmVkTm9kZXMgPSBvcmlnaW5hbC5yZW1vdmVkTm9kZXMuc2xpY2UoKTtcbiAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gb3JpZ2luYWwucHJldmlvdXNTaWJsaW5nO1xuICAgIHJlY29yZC5uZXh0U2libGluZyA9IG9yaWdpbmFsLm5leHRTaWJsaW5nO1xuICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZTtcbiAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZXNwYWNlO1xuICAgIHJlY29yZC5vbGRWYWx1ZSA9IG9yaWdpbmFsLm9sZFZhbHVlO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cbiAgdmFyIGN1cnJlbnRSZWNvcmQsIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgZnVuY3Rpb24gZ2V0UmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgIHJldHVybiBjdXJyZW50UmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKSB7XG4gICAgaWYgKHJlY29yZFdpdGhPbGRWYWx1ZSkgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgICByZWNvcmRXaXRoT2xkVmFsdWUgPSBjb3B5TXV0YXRpb25SZWNvcmQoY3VycmVudFJlY29yZCk7XG4gICAgcmVjb3JkV2l0aE9sZFZhbHVlLm9sZFZhbHVlID0gb2xkVmFsdWU7XG4gICAgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgfVxuICBmdW5jdGlvbiBjbGVhclJlY29yZHMoKSB7XG4gICAgY3VycmVudFJlY29yZCA9IHJlY29yZFdpdGhPbGRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgfVxuICBmdW5jdGlvbiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKHJlY29yZCkge1xuICAgIHJldHVybiByZWNvcmQgPT09IHJlY29yZFdpdGhPbGRWYWx1ZSB8fCByZWNvcmQgPT09IGN1cnJlbnRSZWNvcmQ7XG4gIH1cbiAgZnVuY3Rpb24gc2VsZWN0UmVjb3JkKGxhc3RSZWNvcmQsIG5ld1JlY29yZCkge1xuICAgIGlmIChsYXN0UmVjb3JkID09PSBuZXdSZWNvcmQpIHJldHVybiBsYXN0UmVjb3JkO1xuICAgIGlmIChyZWNvcmRXaXRoT2xkVmFsdWUgJiYgcmVjb3JkUmVwcmVzZW50c0N1cnJlbnRNdXRhdGlvbihsYXN0UmVjb3JkKSkgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBSZWdpc3RyYXRpb24ob2JzZXJ2ZXIsIHRhcmdldCwgb3B0aW9ucykge1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICB9XG4gIFJlZ2lzdHJhdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgZW5xdWV1ZTogZnVuY3Rpb24ocmVjb3JkKSB7XG4gICAgICB2YXIgcmVjb3JkcyA9IHRoaXMub2JzZXJ2ZXIucmVjb3Jkc187XG4gICAgICB2YXIgbGVuZ3RoID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgICBpZiAocmVjb3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBsYXN0UmVjb3JkID0gcmVjb3Jkc1tsZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIHJlY29yZFRvUmVwbGFjZUxhc3QgPSBzZWxlY3RSZWNvcmQobGFzdFJlY29yZCwgcmVjb3JkKTtcbiAgICAgICAgaWYgKHJlY29yZFRvUmVwbGFjZUxhc3QpIHtcbiAgICAgICAgICByZWNvcmRzW2xlbmd0aCAtIDFdID0gcmVjb3JkVG9SZXBsYWNlTGFzdDtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlQ2FsbGJhY2sodGhpcy5vYnNlcnZlcik7XG4gICAgICB9XG4gICAgICByZWNvcmRzW2xlbmd0aF0gPSByZWNvcmQ7XG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5hZGRMaXN0ZW5lcnNfKHRoaXMudGFyZ2V0KTtcbiAgICB9LFxuICAgIGFkZExpc3RlbmVyc186IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcykgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NQXR0ck1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0KSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Ob2RlSW5zZXJ0ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Ob2RlUmVtb3ZlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyc18odGhpcy50YXJnZXQpO1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXJzXzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01BdHRyTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVJbnNlcnRlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCB8fCBvcHRpb25zLnN1YnRyZWUpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVSZW1vdmVkXCIsIHRoaXMsIHRydWUpO1xuICAgIH0sXG4gICAgYWRkVHJhbnNpZW50T2JzZXJ2ZXI6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGlmIChub2RlID09PSB0aGlzLnRhcmdldCkgcmV0dXJuO1xuICAgICAgdGhpcy5hZGRMaXN0ZW5lcnNfKG5vZGUpO1xuICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQobm9kZSwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaCh0aGlzKTtcbiAgICB9LFxuICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcztcbiAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICAgICAgdHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnNfKG5vZGUpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgfSxcbiAgICBoYW5kbGVFdmVudDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICAgY2FzZSBcIkRPTUF0dHJNb2RpZmllZFwiOlxuICAgICAgICB2YXIgbmFtZSA9IGUuYXR0ck5hbWU7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSBlLnJlbGF0ZWROb2RlLm5hbWVzcGFjZVVSSTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgcmVjb3JkID0gbmV3IGdldFJlY29yZChcImF0dHJpYnV0ZXNcIiwgdGFyZ2V0KTtcbiAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPSBuYW1lO1xuICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSBlLmF0dHJDaGFuZ2UgPT09IE11dGF0aW9uRXZlbnQuQURESVRJT04gPyBudWxsIDogZS5wcmV2VmFsdWU7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuYXR0cmlidXRlcykgcmV0dXJuO1xuICAgICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihuYW1lKSA9PT0gLTEgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihuYW1lc3BhY2UpID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSkgcmV0dXJuIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiOlxuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZXRSZWNvcmQoXCJjaGFyYWN0ZXJEYXRhXCIsIHRhcmdldCk7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IGUucHJldlZhbHVlO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmNoYXJhY3RlckRhdGEpIHJldHVybjtcbiAgICAgICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUpIHJldHVybiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJET01Ob2RlUmVtb3ZlZFwiOlxuICAgICAgICB0aGlzLmFkZFRyYW5zaWVudE9ic2VydmVyKGUudGFyZ2V0KTtcblxuICAgICAgIGNhc2UgXCJET01Ob2RlSW5zZXJ0ZWRcIjpcbiAgICAgICAgdmFyIGNoYW5nZWROb2RlID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciBhZGRlZE5vZGVzLCByZW1vdmVkTm9kZXM7XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwiRE9NTm9kZUluc2VydGVkXCIpIHtcbiAgICAgICAgICBhZGRlZE5vZGVzID0gWyBjaGFuZ2VkTm9kZSBdO1xuICAgICAgICAgIHJlbW92ZWROb2RlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZGVkTm9kZXMgPSBbXTtcbiAgICAgICAgICByZW1vdmVkTm9kZXMgPSBbIGNoYW5nZWROb2RlIF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHByZXZpb3VzU2libGluZyA9IGNoYW5nZWROb2RlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY2hhbmdlZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZXRSZWNvcmQoXCJjaGlsZExpc3RcIiwgZS50YXJnZXQucGFyZW50Tm9kZSk7XG4gICAgICAgIHJlY29yZC5hZGRlZE5vZGVzID0gYWRkZWROb2RlcztcbiAgICAgICAgcmVjb3JkLnJlbW92ZWROb2RlcyA9IHJlbW92ZWROb2RlcztcbiAgICAgICAgcmVjb3JkLnByZXZpb3VzU2libGluZyA9IHByZXZpb3VzU2libGluZztcbiAgICAgICAgcmVjb3JkLm5leHRTaWJsaW5nID0gbmV4dFNpYmxpbmc7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZChlLnJlbGF0ZWROb2RlLCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmNoaWxkTGlzdCkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY2xlYXJSZWNvcmRzKCk7XG4gICAgfVxuICB9O1xuICBnbG9iYWwuSnNNdXRhdGlvbk9ic2VydmVyID0gSnNNdXRhdGlvbk9ic2VydmVyO1xuICBpZiAoIWdsb2JhbC5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgPSBKc011dGF0aW9uT2JzZXJ2ZXI7XG4gICAgSnNNdXRhdGlvbk9ic2VydmVyLl9pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB9XG59KShzZWxmKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBpZiAoIXdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgbm93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSBzdGFydDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuYXRpdmVSYWYgPSB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgICByZXR1cm4gbmF0aXZlUmFmID8gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZVJhZihmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhwZXJmb3JtYW5jZS5ub3coKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSA6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMWUzIC8gNjApO1xuICAgICAgfTtcbiAgICB9KCk7XG4gIH1cbiAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICB9O1xuICAgIH0oKTtcbiAgfVxuICB2YXIgd29ya2luZ0RlZmF1bHRQcmV2ZW50ZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgZS5pbml0RXZlbnQoXCJmb29cIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHJldHVybiBlLmRlZmF1bHRQcmV2ZW50ZWQ7XG4gIH0oKTtcbiAgaWYgKCF3b3JraW5nRGVmYXVsdFByZXZlbnRlZCkge1xuICAgIHZhciBvcmlnUHJldmVudERlZmF1bHQgPSBFdmVudC5wcm90b3R5cGUucHJldmVudERlZmF1bHQ7XG4gICAgRXZlbnQucHJvdG90eXBlLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuY2FuY2VsYWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBvcmlnUHJldmVudERlZmF1bHQuY2FsbCh0aGlzKTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRlZmF1bHRQcmV2ZW50ZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgdmFyIGlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgaWYgKCF3aW5kb3cuQ3VzdG9tRXZlbnQgfHwgaXNJRSAmJiB0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihpblR5cGUsIHBhcmFtcykge1xuICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgZS5pbml0Q3VzdG9tRXZlbnQoaW5UeXBlLCBCb29sZWFuKHBhcmFtcy5idWJibGVzKSwgQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSksIHBhcmFtcy5kZXRhaWwpO1xuICAgICAgcmV0dXJuIGU7XG4gICAgfTtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gd2luZG93LkV2ZW50LnByb3RvdHlwZTtcbiAgfVxuICBpZiAoIXdpbmRvdy5FdmVudCB8fCBpc0lFICYmIHR5cGVvZiB3aW5kb3cuRXZlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHZhciBvcmlnRXZlbnQgPSB3aW5kb3cuRXZlbnQ7XG4gICAgd2luZG93LkV2ZW50ID0gZnVuY3Rpb24oaW5UeXBlLCBwYXJhbXMpIHtcbiAgICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICAgIGUuaW5pdEV2ZW50KGluVHlwZSwgQm9vbGVhbihwYXJhbXMuYnViYmxlcyksIEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpKTtcbiAgICAgIHJldHVybiBlO1xuICAgIH07XG4gICAgd2luZG93LkV2ZW50LnByb3RvdHlwZSA9IG9yaWdFdmVudC5wcm90b3R5cGU7XG4gIH1cbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzID0gd2luZG93LkN1c3RvbUVsZW1lbnRzIHx8IHtcbiAgZmxhZ3M6IHt9XG59O1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBtb2R1bGVzID0gW107XG4gIHZhciBhZGRNb2R1bGUgPSBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICBtb2R1bGVzLnB1c2gobW9kdWxlKTtcbiAgfTtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgICAgbW9kdWxlKHNjb3BlKTtcbiAgICB9KTtcbiAgfTtcbiAgc2NvcGUuYWRkTW9kdWxlID0gYWRkTW9kdWxlO1xuICBzY29wZS5pbml0aWFsaXplTW9kdWxlcyA9IGluaXRpYWxpemVNb2R1bGVzO1xuICBzY29wZS5oYXNOYXRpdmUgPSBCb29sZWFuKGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCk7XG4gIHNjb3BlLmlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgc2NvcGUudXNlTmF0aXZlID0gIWZsYWdzLnJlZ2lzdGVyICYmIHNjb3BlLmhhc05hdGl2ZSAmJiAhd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsICYmICghd2luZG93LkhUTUxJbXBvcnRzIHx8IHdpbmRvdy5IVE1MSW1wb3J0cy51c2VOYXRpdmUpO1xufSkod2luZG93LkN1c3RvbUVsZW1lbnRzKTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgSU1QT1JUX0xJTktfVFlQRSA9IHdpbmRvdy5IVE1MSW1wb3J0cyA/IHdpbmRvdy5IVE1MSW1wb3J0cy5JTVBPUlRfTElOS19UWVBFIDogXCJub25lXCI7XG4gIGZ1bmN0aW9uIGZvclN1YnRyZWUobm9kZSwgY2IpIHtcbiAgICBmaW5kQWxsRWxlbWVudHMobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGNiKGUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZm9yUm9vdHMoZSwgY2IpO1xuICAgIH0pO1xuICAgIGZvclJvb3RzKG5vZGUsIGNiKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kQWxsRWxlbWVudHMobm9kZSwgZmluZCwgZGF0YSkge1xuICAgIHZhciBlID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICBpZiAoIWUpIHtcbiAgICAgIGUgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAoZSAmJiBlLm5vZGVUeXBlICE9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBlID0gZS5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKGUpIHtcbiAgICAgIGlmIChmaW5kKGUsIGRhdGEpICE9PSB0cnVlKSB7XG4gICAgICAgIGZpbmRBbGxFbGVtZW50cyhlLCBmaW5kLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIGUgPSBlLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gZm9yUm9vdHMobm9kZSwgY2IpIHtcbiAgICB2YXIgcm9vdCA9IG5vZGUuc2hhZG93Um9vdDtcbiAgICB3aGlsZSAocm9vdCkge1xuICAgICAgZm9yU3VidHJlZShyb290LCBjYik7XG4gICAgICByb290ID0gcm9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGZvckRvY3VtZW50VHJlZShkb2MsIGNiKSB7XG4gICAgX2ZvckRvY3VtZW50VHJlZShkb2MsIGNiLCBbXSk7XG4gIH1cbiAgZnVuY3Rpb24gX2ZvckRvY3VtZW50VHJlZShkb2MsIGNiLCBwcm9jZXNzaW5nRG9jdW1lbnRzKSB7XG4gICAgZG9jID0gd2luZG93LndyYXAoZG9jKTtcbiAgICBpZiAocHJvY2Vzc2luZ0RvY3VtZW50cy5pbmRleE9mKGRvYykgPj0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwcm9jZXNzaW5nRG9jdW1lbnRzLnB1c2goZG9jKTtcbiAgICB2YXIgaW1wb3J0cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKFwibGlua1tyZWw9XCIgKyBJTVBPUlRfTElOS19UWVBFICsgXCJdXCIpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW1wb3J0cy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gaW1wb3J0c1tpXSk7IGkrKykge1xuICAgICAgaWYgKG4uaW1wb3J0KSB7XG4gICAgICAgIF9mb3JEb2N1bWVudFRyZWUobi5pbXBvcnQsIGNiLCBwcm9jZXNzaW5nRG9jdW1lbnRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2IoZG9jKTtcbiAgfVxuICBzY29wZS5mb3JEb2N1bWVudFRyZWUgPSBmb3JEb2N1bWVudFRyZWU7XG4gIHNjb3BlLmZvclN1YnRyZWUgPSBmb3JTdWJ0cmVlO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBmb3JTdWJ0cmVlID0gc2NvcGUuZm9yU3VidHJlZTtcbiAgdmFyIGZvckRvY3VtZW50VHJlZSA9IHNjb3BlLmZvckRvY3VtZW50VHJlZTtcbiAgZnVuY3Rpb24gYWRkZWROb2RlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICByZXR1cm4gYWRkZWQobm9kZSwgaXNBdHRhY2hlZCkgfHwgYWRkZWRTdWJ0cmVlKG5vZGUsIGlzQXR0YWNoZWQpO1xuICB9XG4gIGZ1bmN0aW9uIGFkZGVkKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBpZiAoc2NvcGUudXBncmFkZShub2RlLCBpc0F0dGFjaGVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICBhdHRhY2hlZChub2RlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gYWRkZWRTdWJ0cmVlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBmb3JTdWJ0cmVlKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChhZGRlZChlLCBpc0F0dGFjaGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICB2YXIgaGFzVGhyb3R0bGVkQXR0YWNoZWQgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlci5faXNQb2x5ZmlsbGVkICYmIGZsYWdzW1widGhyb3R0bGUtYXR0YWNoZWRcIl07XG4gIHNjb3BlLmhhc1BvbHlmaWxsTXV0YXRpb25zID0gaGFzVGhyb3R0bGVkQXR0YWNoZWQ7XG4gIHNjb3BlLmhhc1Rocm90dGxlZEF0dGFjaGVkID0gaGFzVGhyb3R0bGVkQXR0YWNoZWQ7XG4gIHZhciBpc1BlbmRpbmdNdXRhdGlvbnMgPSBmYWxzZTtcbiAgdmFyIHBlbmRpbmdNdXRhdGlvbnMgPSBbXTtcbiAgZnVuY3Rpb24gZGVmZXJNdXRhdGlvbihmbikge1xuICAgIHBlbmRpbmdNdXRhdGlvbnMucHVzaChmbik7XG4gICAgaWYgKCFpc1BlbmRpbmdNdXRhdGlvbnMpIHtcbiAgICAgIGlzUGVuZGluZ011dGF0aW9ucyA9IHRydWU7XG4gICAgICBzZXRUaW1lb3V0KHRha2VNdXRhdGlvbnMpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0YWtlTXV0YXRpb25zKCkge1xuICAgIGlzUGVuZGluZ011dGF0aW9ucyA9IGZhbHNlO1xuICAgIHZhciAkcCA9IHBlbmRpbmdNdXRhdGlvbnM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSAkcC5sZW5ndGgsIHA7IGkgPCBsICYmIChwID0gJHBbaV0pOyBpKyspIHtcbiAgICAgIHAoKTtcbiAgICB9XG4gICAgcGVuZGluZ011dGF0aW9ucyA9IFtdO1xuICB9XG4gIGZ1bmN0aW9uIGF0dGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoaGFzVGhyb3R0bGVkQXR0YWNoZWQpIHtcbiAgICAgIGRlZmVyTXV0YXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIF9hdHRhY2hlZChlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIF9hdHRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuX191cGdyYWRlZF9fICYmICFlbGVtZW50Ll9fYXR0YWNoZWQpIHtcbiAgICAgIGVsZW1lbnQuX19hdHRhY2hlZCA9IHRydWU7XG4gICAgICBpZiAoZWxlbWVudC5hdHRhY2hlZENhbGxiYWNrKSB7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZXRhY2hlZE5vZGUobm9kZSkge1xuICAgIGRldGFjaGVkKG5vZGUpO1xuICAgIGZvclN1YnRyZWUobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgZGV0YWNoZWQoZSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZGV0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChoYXNUaHJvdHRsZWRBdHRhY2hlZCkge1xuICAgICAgZGVmZXJNdXRhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgX2RldGFjaGVkKGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9kZXRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gX2RldGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5fX3VwZ3JhZGVkX18gJiYgZWxlbWVudC5fX2F0dGFjaGVkKSB7XG4gICAgICBlbGVtZW50Ll9fYXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgIGlmIChlbGVtZW50LmRldGFjaGVkQ2FsbGJhY2spIHtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZENhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGluRG9jdW1lbnQoZWxlbWVudCkge1xuICAgIHZhciBwID0gZWxlbWVudDtcbiAgICB2YXIgZG9jID0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIHdoaWxlIChwKSB7XG4gICAgICBpZiAocCA9PSBkb2MpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBwID0gcC5wYXJlbnROb2RlIHx8IHAubm9kZVR5cGUgPT09IE5vZGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERSAmJiBwLmhvc3Q7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHdhdGNoU2hhZG93KG5vZGUpIHtcbiAgICBpZiAobm9kZS5zaGFkb3dSb290ICYmICFub2RlLnNoYWRvd1Jvb3QuX193YXRjaGVkKSB7XG4gICAgICBmbGFncy5kb20gJiYgY29uc29sZS5sb2coXCJ3YXRjaGluZyBzaGFkb3ctcm9vdCBmb3I6IFwiLCBub2RlLmxvY2FsTmFtZSk7XG4gICAgICB2YXIgcm9vdCA9IG5vZGUuc2hhZG93Um9vdDtcbiAgICAgIHdoaWxlIChyb290KSB7XG4gICAgICAgIG9ic2VydmUocm9vdCk7XG4gICAgICAgIHJvb3QgPSByb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaGFuZGxlcihyb290LCBtdXRhdGlvbnMpIHtcbiAgICBpZiAoZmxhZ3MuZG9tKSB7XG4gICAgICB2YXIgbXggPSBtdXRhdGlvbnNbMF07XG4gICAgICBpZiAobXggJiYgbXgudHlwZSA9PT0gXCJjaGlsZExpc3RcIiAmJiBteC5hZGRlZE5vZGVzKSB7XG4gICAgICAgIGlmIChteC5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgdmFyIGQgPSBteC5hZGRlZE5vZGVzWzBdO1xuICAgICAgICAgIHdoaWxlIChkICYmIGQgIT09IGRvY3VtZW50ICYmICFkLmhvc3QpIHtcbiAgICAgICAgICAgIGQgPSBkLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB1ID0gZCAmJiAoZC5VUkwgfHwgZC5fVVJMIHx8IGQuaG9zdCAmJiBkLmhvc3QubG9jYWxOYW1lKSB8fCBcIlwiO1xuICAgICAgICAgIHUgPSB1LnNwbGl0KFwiLz9cIikuc2hpZnQoKS5zcGxpdChcIi9cIikucG9wKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUuZ3JvdXAoXCJtdXRhdGlvbnMgKCVkKSBbJXNdXCIsIG11dGF0aW9ucy5sZW5ndGgsIHUgfHwgXCJcIik7XG4gICAgfVxuICAgIHZhciBpc0F0dGFjaGVkID0gaW5Eb2N1bWVudChyb290KTtcbiAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihteCkge1xuICAgICAgaWYgKG14LnR5cGUgPT09IFwiY2hpbGRMaXN0XCIpIHtcbiAgICAgICAgZm9yRWFjaChteC5hZGRlZE5vZGVzLCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgaWYgKCFuLmxvY2FsTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRlZE5vZGUobiwgaXNBdHRhY2hlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3JFYWNoKG14LnJlbW92ZWROb2RlcywgZnVuY3Rpb24obikge1xuICAgICAgICAgIGlmICghbi5sb2NhbE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGV0YWNoZWROb2RlKG4pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG4gIGZ1bmN0aW9uIHRha2VSZWNvcmRzKG5vZGUpIHtcbiAgICBub2RlID0gd2luZG93LndyYXAobm9kZSk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICBub2RlID0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIH1cbiAgICB3aGlsZSAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICB2YXIgb2JzZXJ2ZXIgPSBub2RlLl9fb2JzZXJ2ZXI7XG4gICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICBoYW5kbGVyKG5vZGUsIG9ic2VydmVyLnRha2VSZWNvcmRzKCkpO1xuICAgICAgdGFrZU11dGF0aW9ucygpO1xuICAgIH1cbiAgfVxuICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwuYmluZChBcnJheS5wcm90b3R5cGUuZm9yRWFjaCk7XG4gIGZ1bmN0aW9uIG9ic2VydmUoaW5Sb290KSB7XG4gICAgaWYgKGluUm9vdC5fX29ic2VydmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGhhbmRsZXIuYmluZCh0aGlzLCBpblJvb3QpKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGluUm9vdCwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZVxuICAgIH0pO1xuICAgIGluUm9vdC5fX29ic2VydmVyID0gb2JzZXJ2ZXI7XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZURvY3VtZW50KGRvYykge1xuICAgIGRvYyA9IHdpbmRvdy53cmFwKGRvYyk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXAoXCJ1cGdyYWRlRG9jdW1lbnQ6IFwiLCBkb2MuYmFzZVVSSS5zcGxpdChcIi9cIikucG9wKCkpO1xuICAgIHZhciBpc01haW5Eb2N1bWVudCA9IGRvYyA9PT0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIGFkZGVkTm9kZShkb2MsIGlzTWFpbkRvY3VtZW50KTtcbiAgICBvYnNlcnZlKGRvYyk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlRG9jdW1lbnRUcmVlKGRvYykge1xuICAgIGZvckRvY3VtZW50VHJlZShkb2MsIHVwZ3JhZGVEb2N1bWVudCk7XG4gIH1cbiAgdmFyIG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdCA9IEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3Q7XG4gIGlmIChvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QpIHtcbiAgICBFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcm9vdCA9IG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdC5jYWxsKHRoaXMpO1xuICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLndhdGNoU2hhZG93KHRoaXMpO1xuICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfTtcbiAgfVxuICBzY29wZS53YXRjaFNoYWRvdyA9IHdhdGNoU2hhZG93O1xuICBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlID0gdXBncmFkZURvY3VtZW50VHJlZTtcbiAgc2NvcGUudXBncmFkZURvY3VtZW50ID0gdXBncmFkZURvY3VtZW50O1xuICBzY29wZS51cGdyYWRlU3VidHJlZSA9IGFkZGVkU3VidHJlZTtcbiAgc2NvcGUudXBncmFkZUFsbCA9IGFkZGVkTm9kZTtcbiAgc2NvcGUuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgc2NvcGUudGFrZVJlY29yZHMgPSB0YWtlUmVjb3Jkcztcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICBmdW5jdGlvbiB1cGdyYWRlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBpZiAobm9kZS5sb2NhbE5hbWUgPT09IFwidGVtcGxhdGVcIikge1xuICAgICAgaWYgKHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50ICYmIEhUTUxUZW1wbGF0ZUVsZW1lbnQuZGVjb3JhdGUpIHtcbiAgICAgICAgSFRNTFRlbXBsYXRlRWxlbWVudC5kZWNvcmF0ZShub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFub2RlLl9fdXBncmFkZWRfXyAmJiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgdmFyIGlzID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJpc1wiKTtcbiAgICAgIHZhciBkZWZpbml0aW9uID0gc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obm9kZS5sb2NhbE5hbWUpIHx8IHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uKGlzKTtcbiAgICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGlmIChpcyAmJiBkZWZpbml0aW9uLnRhZyA9PSBub2RlLmxvY2FsTmFtZSB8fCAhaXMgJiYgIWRlZmluaXRpb24uZXh0ZW5kcykge1xuICAgICAgICAgIHJldHVybiB1cGdyYWRlV2l0aERlZmluaXRpb24obm9kZSwgZGVmaW5pdGlvbiwgaXNBdHRhY2hlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZVdpdGhEZWZpbml0aW9uKGVsZW1lbnQsIGRlZmluaXRpb24sIGlzQXR0YWNoZWQpIHtcbiAgICBmbGFncy51cGdyYWRlICYmIGNvbnNvbGUuZ3JvdXAoXCJ1cGdyYWRlOlwiLCBlbGVtZW50LmxvY2FsTmFtZSk7XG4gICAgaWYgKGRlZmluaXRpb24uaXMpIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaXNcIiwgZGVmaW5pdGlvbi5pcyk7XG4gICAgfVxuICAgIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBkZWZpbml0aW9uKTtcbiAgICBlbGVtZW50Ll9fdXBncmFkZWRfXyA9IHRydWU7XG4gICAgY3JlYXRlZChlbGVtZW50KTtcbiAgICBpZiAoaXNBdHRhY2hlZCkge1xuICAgICAgc2NvcGUuYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICAgIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlKGVsZW1lbnQsIGlzQXR0YWNoZWQpO1xuICAgIGZsYWdzLnVwZ3JhZGUgJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIGZ1bmN0aW9uIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBkZWZpbml0aW9uKSB7XG4gICAgaWYgKE9iamVjdC5fX3Byb3RvX18pIHtcbiAgICAgIGVsZW1lbnQuX19wcm90b19fID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1c3RvbU1peGluKGVsZW1lbnQsIGRlZmluaXRpb24ucHJvdG90eXBlLCBkZWZpbml0aW9uLm5hdGl2ZSk7XG4gICAgICBlbGVtZW50Ll9fcHJvdG9fXyA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjdXN0b21NaXhpbihpblRhcmdldCwgaW5TcmMsIGluTmF0aXZlKSB7XG4gICAgdmFyIHVzZWQgPSB7fTtcbiAgICB2YXIgcCA9IGluU3JjO1xuICAgIHdoaWxlIChwICE9PSBpbk5hdGl2ZSAmJiBwICE9PSBIVE1MRWxlbWVudC5wcm90b3R5cGUpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgazsgayA9IGtleXNbaV07IGkrKykge1xuICAgICAgICBpZiAoIXVzZWRba10pIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5UYXJnZXQsIGssIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocCwgaykpO1xuICAgICAgICAgIHVzZWRba10gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHApO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5jcmVhdGVkQ2FsbGJhY2spIHtcbiAgICAgIGVsZW1lbnQuY3JlYXRlZENhbGxiYWNrKCk7XG4gICAgfVxuICB9XG4gIHNjb3BlLnVwZ3JhZGUgPSB1cGdyYWRlO1xuICBzY29wZS51cGdyYWRlV2l0aERlZmluaXRpb24gPSB1cGdyYWRlV2l0aERlZmluaXRpb247XG4gIHNjb3BlLmltcGxlbWVudFByb3RvdHlwZSA9IGltcGxlbWVudFByb3RvdHlwZTtcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgdmFyIHVwZ3JhZGVEb2N1bWVudFRyZWUgPSBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlO1xuICB2YXIgdXBncmFkZUFsbCA9IHNjb3BlLnVwZ3JhZGVBbGw7XG4gIHZhciB1cGdyYWRlV2l0aERlZmluaXRpb24gPSBzY29wZS51cGdyYWRlV2l0aERlZmluaXRpb247XG4gIHZhciBpbXBsZW1lbnRQcm90b3R5cGUgPSBzY29wZS5pbXBsZW1lbnRQcm90b3R5cGU7XG4gIHZhciB1c2VOYXRpdmUgPSBzY29wZS51c2VOYXRpdmU7XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyKG5hbWUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ6IGZpcnN0IGFyZ3VtZW50IGBuYW1lYCBtdXN0IG5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG4gICAgaWYgKG5hbWUuaW5kZXhPZihcIi1cIikgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ6IGZpcnN0IGFyZ3VtZW50ICgnbmFtZScpIG11c3QgY29udGFpbiBhIGRhc2ggKCctJykuIEFyZ3VtZW50IHByb3ZpZGVkIHdhcyAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicuXCIpO1xuICAgIH1cbiAgICBpZiAoaXNSZXNlcnZlZFRhZyhuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgJ3JlZ2lzdGVyRWxlbWVudCcgb24gJ0RvY3VtZW50JzogUmVnaXN0cmF0aW9uIGZhaWxlZCBmb3IgdHlwZSAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicuIFRoZSB0eXBlIG5hbWUgaXMgaW52YWxpZC5cIik7XG4gICAgfVxuICAgIGlmIChnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlRGVmaW5pdGlvbkVycm9yOiBhIHR5cGUgd2l0aCBuYW1lICdcIiArIFN0cmluZyhuYW1lKSArIFwiJyBpcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICghZGVmaW5pdGlvbi5wcm90b3R5cGUpIHtcbiAgICAgIGRlZmluaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLl9fbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoZGVmaW5pdGlvbi5leHRlbmRzKSB7XG4gICAgICBkZWZpbml0aW9uLmV4dGVuZHMgPSBkZWZpbml0aW9uLmV4dGVuZHMudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgZGVmaW5pdGlvbi5saWZlY3ljbGUgPSBkZWZpbml0aW9uLmxpZmVjeWNsZSB8fCB7fTtcbiAgICBkZWZpbml0aW9uLmFuY2VzdHJ5ID0gYW5jZXN0cnkoZGVmaW5pdGlvbi5leHRlbmRzKTtcbiAgICByZXNvbHZlVGFnTmFtZShkZWZpbml0aW9uKTtcbiAgICByZXNvbHZlUHJvdG90eXBlQ2hhaW4oZGVmaW5pdGlvbik7XG4gICAgb3ZlcnJpZGVBdHRyaWJ1dGVBcGkoZGVmaW5pdGlvbi5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyRGVmaW5pdGlvbihkZWZpbml0aW9uLl9fbmFtZSwgZGVmaW5pdGlvbik7XG4gICAgZGVmaW5pdGlvbi5jdG9yID0gZ2VuZXJhdGVDb25zdHJ1Y3RvcihkZWZpbml0aW9uKTtcbiAgICBkZWZpbml0aW9uLmN0b3IucHJvdG90eXBlID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgZGVmaW5pdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBkZWZpbml0aW9uLmN0b3I7XG4gICAgaWYgKHNjb3BlLnJlYWR5KSB7XG4gICAgICB1cGdyYWRlRG9jdW1lbnRUcmVlKGRvY3VtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmluaXRpb24uY3RvcjtcbiAgfVxuICBmdW5jdGlvbiBvdmVycmlkZUF0dHJpYnV0ZUFwaShwcm90b3R5cGUpIHtcbiAgICBpZiAocHJvdG90eXBlLnNldEF0dHJpYnV0ZS5fcG9seWZpbGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2V0QXR0cmlidXRlID0gcHJvdG90eXBlLnNldEF0dHJpYnV0ZTtcbiAgICBwcm90b3R5cGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgIGNoYW5nZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlLCBzZXRBdHRyaWJ1dGUpO1xuICAgIH07XG4gICAgdmFyIHJlbW92ZUF0dHJpYnV0ZSA9IHByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGU7XG4gICAgcHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNoYW5nZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIG51bGwsIHJlbW92ZUF0dHJpYnV0ZSk7XG4gICAgfTtcbiAgICBwcm90b3R5cGUuc2V0QXR0cmlidXRlLl9wb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBjaGFuZ2VBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIG9wZXJhdGlvbikge1xuICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIG9sZFZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgb3BlcmF0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgaWYgKHRoaXMuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrICYmIG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgdGhpcy5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNSZXNlcnZlZFRhZyhuYW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNlcnZlZFRhZ0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChuYW1lID09PSByZXNlcnZlZFRhZ0xpc3RbaV0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciByZXNlcnZlZFRhZ0xpc3QgPSBbIFwiYW5ub3RhdGlvbi14bWxcIiwgXCJjb2xvci1wcm9maWxlXCIsIFwiZm9udC1mYWNlXCIsIFwiZm9udC1mYWNlLXNyY1wiLCBcImZvbnQtZmFjZS11cmlcIiwgXCJmb250LWZhY2UtZm9ybWF0XCIsIFwiZm9udC1mYWNlLW5hbWVcIiwgXCJtaXNzaW5nLWdseXBoXCIgXTtcbiAgZnVuY3Rpb24gYW5jZXN0cnkoZXh0bmRzKSB7XG4gICAgdmFyIGV4dGVuZGVlID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24oZXh0bmRzKTtcbiAgICBpZiAoZXh0ZW5kZWUpIHtcbiAgICAgIHJldHVybiBhbmNlc3RyeShleHRlbmRlZS5leHRlbmRzKS5jb25jYXQoWyBleHRlbmRlZSBdKTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVUYWdOYW1lKGRlZmluaXRpb24pIHtcbiAgICB2YXIgYmFzZVRhZyA9IGRlZmluaXRpb24uZXh0ZW5kcztcbiAgICBmb3IgKHZhciBpID0gMCwgYTsgYSA9IGRlZmluaXRpb24uYW5jZXN0cnlbaV07IGkrKykge1xuICAgICAgYmFzZVRhZyA9IGEuaXMgJiYgYS50YWc7XG4gICAgfVxuICAgIGRlZmluaXRpb24udGFnID0gYmFzZVRhZyB8fCBkZWZpbml0aW9uLl9fbmFtZTtcbiAgICBpZiAoYmFzZVRhZykge1xuICAgICAgZGVmaW5pdGlvbi5pcyA9IGRlZmluaXRpb24uX19uYW1lO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXNvbHZlUHJvdG90eXBlQ2hhaW4oZGVmaW5pdGlvbikge1xuICAgIGlmICghT2JqZWN0Ll9fcHJvdG9fXykge1xuICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZSA9IEhUTUxFbGVtZW50LnByb3RvdHlwZTtcbiAgICAgIGlmIChkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHZhciBpbnN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkZWZpbml0aW9uLnRhZyk7XG4gICAgICAgIG5hdGl2ZVByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihpbnN0KTtcbiAgICAgIH1cbiAgICAgIHZhciBwcm90byA9IGRlZmluaXRpb24ucHJvdG90eXBlLCBhbmNlc3RvcjtcbiAgICAgIHZhciBmb3VuZFByb3RvdHlwZSA9IGZhbHNlO1xuICAgICAgd2hpbGUgKHByb3RvKSB7XG4gICAgICAgIGlmIChwcm90byA9PSBuYXRpdmVQcm90b3R5cGUpIHtcbiAgICAgICAgICBmb3VuZFByb3RvdHlwZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYW5jZXN0b3IgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgICAgICBpZiAoYW5jZXN0b3IpIHtcbiAgICAgICAgICBwcm90by5fX3Byb3RvX18gPSBhbmNlc3RvcjtcbiAgICAgICAgfVxuICAgICAgICBwcm90byA9IGFuY2VzdG9yO1xuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZFByb3RvdHlwZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oZGVmaW5pdGlvbi50YWcgKyBcIiBwcm90b3R5cGUgbm90IGZvdW5kIGluIHByb3RvdHlwZSBjaGFpbiBmb3IgXCIgKyBkZWZpbml0aW9uLmlzKTtcbiAgICAgIH1cbiAgICAgIGRlZmluaXRpb24ubmF0aXZlID0gbmF0aXZlUHJvdG90eXBlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpbnN0YW50aWF0ZShkZWZpbml0aW9uKSB7XG4gICAgcmV0dXJuIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihkb21DcmVhdGVFbGVtZW50KGRlZmluaXRpb24udGFnKSwgZGVmaW5pdGlvbik7XG4gIH1cbiAgdmFyIHJlZ2lzdHJ5ID0ge307XG4gIGZ1bmN0aW9uIGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgcmV0dXJuIHJlZ2lzdHJ5W25hbWUudG9Mb3dlckNhc2UoKV07XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyRGVmaW5pdGlvbihuYW1lLCBkZWZpbml0aW9uKSB7XG4gICAgcmVnaXN0cnlbbmFtZV0gPSBkZWZpbml0aW9uO1xuICB9XG4gIGZ1bmN0aW9uIGdlbmVyYXRlQ29uc3RydWN0b3IoZGVmaW5pdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpbnN0YW50aWF0ZShkZWZpbml0aW9uKTtcbiAgICB9O1xuICB9XG4gIHZhciBIVE1MX05BTUVTUEFDRSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiO1xuICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcsIHR5cGVFeHRlbnNpb24pIHtcbiAgICBpZiAobmFtZXNwYWNlID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnQodGFnLCB0eXBlRXh0ZW5zaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRvbUNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgaWYgKHRhZykge1xuICAgICAgdGFnID0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIGlmICh0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICB0eXBlRXh0ZW5zaW9uID0gdHlwZUV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICB2YXIgZGVmaW5pdGlvbiA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKHR5cGVFeHRlbnNpb24gfHwgdGFnKTtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgaWYgKHRhZyA9PSBkZWZpbml0aW9uLnRhZyAmJiB0eXBlRXh0ZW5zaW9uID09IGRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBkZWZpbml0aW9uLmN0b3IoKTtcbiAgICAgIH1cbiAgICAgIGlmICghdHlwZUV4dGVuc2lvbiAmJiAhZGVmaW5pdGlvbi5pcykge1xuICAgICAgICByZXR1cm4gbmV3IGRlZmluaXRpb24uY3RvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAodHlwZUV4dGVuc2lvbikge1xuICAgICAgZWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaXNcIiwgdHlwZUV4dGVuc2lvbik7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgZWxlbWVudCA9IGRvbUNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICBpZiAodGFnLmluZGV4T2YoXCItXCIpID49IDApIHtcbiAgICAgIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBIVE1MRWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIHZhciBkb21DcmVhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudC5iaW5kKGRvY3VtZW50KTtcbiAgdmFyIGRvbUNyZWF0ZUVsZW1lbnROUyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUy5iaW5kKGRvY3VtZW50KTtcbiAgdmFyIGlzSW5zdGFuY2U7XG4gIGlmICghT2JqZWN0Ll9fcHJvdG9fXyAmJiAhdXNlTmF0aXZlKSB7XG4gICAgaXNJbnN0YW5jZSA9IGZ1bmN0aW9uKG9iaiwgY3Rvcikge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgcCA9IG9iajtcbiAgICAgIHdoaWxlIChwKSB7XG4gICAgICAgIGlmIChwID09PSBjdG9yLnByb3RvdHlwZSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHAgPSBwLl9fcHJvdG9fXztcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGlzSW5zdGFuY2UgPSBmdW5jdGlvbihvYmosIGJhc2UpIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBiYXNlO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgIHZhciBvcmlnID0gb2JqW21ldGhvZE5hbWVdO1xuICAgIG9ialttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG4gPSBvcmlnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB1cGdyYWRlQWxsKG4pO1xuICAgICAgcmV0dXJuIG47XG4gICAgfTtcbiAgfVxuICB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUoTm9kZS5wcm90b3R5cGUsIFwiY2xvbmVOb2RlXCIpO1xuICB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUoZG9jdW1lbnQsIFwiaW1wb3J0Tm9kZVwiKTtcbiAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ID0gcmVnaXN0ZXI7XG4gIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBjcmVhdGVFbGVtZW50O1xuICBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgPSBjcmVhdGVFbGVtZW50TlM7XG4gIHNjb3BlLnJlZ2lzdHJ5ID0gcmVnaXN0cnk7XG4gIHNjb3BlLmluc3RhbmNlb2YgPSBpc0luc3RhbmNlO1xuICBzY29wZS5yZXNlcnZlZFRhZ0xpc3QgPSByZXNlcnZlZFRhZ0xpc3Q7XG4gIHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb247XG4gIGRvY3VtZW50LnJlZ2lzdGVyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50O1xufSk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgdXNlTmF0aXZlID0gc2NvcGUudXNlTmF0aXZlO1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBzY29wZS5pbml0aWFsaXplTW9kdWxlcztcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICBpZiAodXNlTmF0aXZlKSB7XG4gICAgdmFyIG5vcCA9IGZ1bmN0aW9uKCkge307XG4gICAgc2NvcGUud2F0Y2hTaGFkb3cgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZSA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlQWxsID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWUgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZVN1YnRyZWUgPSBub3A7XG4gICAgc2NvcGUudGFrZVJlY29yZHMgPSBub3A7XG4gICAgc2NvcGUuaW5zdGFuY2VvZiA9IGZ1bmN0aW9uKG9iaiwgYmFzZSkge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIGJhc2U7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBpbml0aWFsaXplTW9kdWxlcygpO1xuICB9XG4gIHZhciB1cGdyYWRlRG9jdW1lbnRUcmVlID0gc2NvcGUudXBncmFkZURvY3VtZW50VHJlZTtcbiAgdmFyIHVwZ3JhZGVEb2N1bWVudCA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudDtcbiAgaWYgKCF3aW5kb3cud3JhcCkge1xuICAgIGlmICh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpIHtcbiAgICAgIHdpbmRvdy53cmFwID0gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZDtcbiAgICAgIHdpbmRvdy51bndyYXAgPSB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwudW53cmFwSWZOZWVkZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy53cmFwID0gd2luZG93LnVud3JhcCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBpZiAod2luZG93LkhUTUxJbXBvcnRzKSB7XG4gICAgd2luZG93LkhUTUxJbXBvcnRzLl9faW1wb3J0c1BhcnNpbmdIb29rID0gZnVuY3Rpb24oZWx0KSB7XG4gICAgICBpZiAoZWx0LmltcG9ydCkge1xuICAgICAgICB1cGdyYWRlRG9jdW1lbnQod3JhcChlbHQuaW1wb3J0KSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gICAgdXBncmFkZURvY3VtZW50VHJlZSh3aW5kb3cud3JhcChkb2N1bWVudCkpO1xuICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeSA9IHRydWU7XG4gICAgdmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oZikge1xuICAgICAgc2V0VGltZW91dChmLCAxNik7XG4gICAgfTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHlUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cykge1xuICAgICAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5lbGFwc2VkID0gd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5VGltZSAtIHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeVRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJXZWJDb21wb25lbnRzUmVhZHlcIiwge1xuICAgICAgICAgIGJ1YmJsZXM6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBzY29wZS5mbGFncy5lYWdlcikge1xuICAgIGJvb3RzdHJhcCgpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIiAmJiAhd2luZG93LmF0dGFjaEV2ZW50ICYmICghd2luZG93LkhUTUxJbXBvcnRzIHx8IHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeSkpIHtcbiAgICBib290c3RyYXAoKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbG9hZEV2ZW50ID0gd2luZG93LkhUTUxJbXBvcnRzICYmICF3aW5kb3cuSFRNTEltcG9ydHMucmVhZHkgPyBcIkhUTUxJbXBvcnRzTG9hZGVkXCIgOiBcIkRPTUNvbnRlbnRMb2FkZWRcIjtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihsb2FkRXZlbnQsIGJvb3RzdHJhcCk7XG4gIH1cbn0pKHdpbmRvdy5DdXN0b21FbGVtZW50cyk7IiwiKGZ1bmN0aW9uKHNlbGYpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChzZWxmLmZldGNoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gICAgYmxvYjogJ0ZpbGVSZWFkZXInIGluIHNlbGYgJiYgJ0Jsb2InIGluIHNlbGYgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IEJsb2IoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKCksXG4gICAgZm9ybURhdGE6ICdGb3JtRGF0YScgaW4gc2VsZixcbiAgICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBzZWxmXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBuYW1lID0gU3RyaW5nKG5hbWUpXG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLlxcXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgIHZhciBpdGVyYXRvciA9IHtcbiAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpXG4gICAgICAgIHJldHVybiB7ZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvclxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpdGVyYXRvclxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fVxuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICB9LCB0aGlzKVxuXG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gICAgdmFyIGxpc3QgPSB0aGlzLm1hcFtuYW1lXVxuICAgIGlmICghbGlzdCkge1xuICAgICAgbGlzdCA9IFtdXG4gICAgICB0aGlzLm1hcFtuYW1lXSA9IGxpc3RcbiAgICB9XG4gICAgbGlzdC5wdXNoKHZhbHVlKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICAgIHJldHVybiB2YWx1ZXMgPyB2YWx1ZXNbMF0gOiBudWxsXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldIHx8IFtdXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gW25vcm1hbGl6ZVZhbHVlKHZhbHVlKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMubWFwKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMubWFwW25hbWVdLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgbmFtZSwgdGhpcylcbiAgICAgIH0sIHRoaXMpXG4gICAgfSwgdGhpcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkgeyBpdGVtcy5wdXNoKG5hbWUpIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHsgaXRlbXMucHVzaCh2YWx1ZSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHsgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXNcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlXG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5LnRvU3RyaW5nKClcbiAgICAgIH0gZWxzZSBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIC8vIE9ubHkgc3VwcG9ydCBBcnJheUJ1ZmZlcnMgZm9yIFBPU1QgbWV0aG9kLlxuICAgICAgICAvLyBSZWNlaXZpbmcgQXJyYXlCdWZmZXJzIGhhcHBlbnMgdmlhIEJsb2JzLCBpbnN0ZWFkLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnN1cHBvcnRlZCBCb2R5SW5pdCB0eXBlJylcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsIHRoaXMuX2JvZHlCbG9iLnR5cGUpXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQgOiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICByZXR1cm4gKG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xKSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5XG4gICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpKSB7XG4gICAgICBpZiAoaW5wdXQuYm9keVVzZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJylcbiAgICAgIH1cbiAgICAgIHRoaXMudXJsID0gaW5wdXQudXJsXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHNcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG4gICAgICB9XG4gICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZFxuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZVxuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXRcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXJsID0gaW5wdXRcbiAgICB9XG5cbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gb3B0aW9ucy5jcmVkZW50aWFscyB8fCB0aGlzLmNyZWRlbnRpYWxzIHx8ICdvbWl0J1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIH1cbiAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCAnR0VUJylcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGxcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbFxuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KVxuICB9XG5cbiAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcylcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgIGJvZHkudHJpbSgpLnNwbGl0KCcmJykuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KCc9JylcbiAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJz0nKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gZm9ybVxuICB9XG5cbiAgZnVuY3Rpb24gaGVhZGVycyh4aHIpIHtcbiAgICB2YXIgaGVhZCA9IG5ldyBIZWFkZXJzKClcbiAgICB2YXIgcGFpcnMgPSAoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKS50cmltKCkuc3BsaXQoJ1xcbicpXG4gICAgcGFpcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHZhciBzcGxpdCA9IGhlYWRlci50cmltKCkuc3BsaXQoJzonKVxuICAgICAgdmFyIGtleSA9IHNwbGl0LnNoaWZ0KCkudHJpbSgpXG4gICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc6JykudHJpbSgpXG4gICAgICBoZWFkLmFwcGVuZChrZXksIHZhbHVlKVxuICAgIH0pXG4gICAgcmV0dXJuIGhlYWRcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSlcblxuICBmdW5jdGlvbiBSZXNwb25zZShib2R5SW5pdCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHt9XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnXG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1c1xuICAgIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDBcbiAgICB0aGlzLnN0YXR1c1RleHQgPSBvcHRpb25zLnN0YXR1c1RleHRcbiAgICB0aGlzLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzID8gb3B0aW9ucy5oZWFkZXJzIDogbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmwgfHwgJydcbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpXG5cbiAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICB1cmw6IHRoaXMudXJsXG4gICAgfSlcbiAgfVxuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSlcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJ1xuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdXG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfVxuXG4gIHNlbGYuSGVhZGVycyA9IEhlYWRlcnNcbiAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdFxuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2VcblxuICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVxdWVzdFxuICAgICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpICYmICFpbml0KSB7XG4gICAgICAgIHJlcXVlc3QgPSBpbnB1dFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KVxuICAgICAgfVxuXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblxuICAgICAgZnVuY3Rpb24gcmVzcG9uc2VVUkwoKSB7XG4gICAgICAgIGlmICgncmVzcG9uc2VVUkwnIGluIHhocikge1xuICAgICAgICAgIHJldHVybiB4aHIucmVzcG9uc2VVUkxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF2b2lkIHNlY3VyaXR5IHdhcm5pbmdzIG9uIGdldFJlc3BvbnNlSGVhZGVyIHdoZW4gbm90IGFsbG93ZWQgYnkgQ09SU1xuICAgICAgICBpZiAoL15YLVJlcXVlc3QtVVJMOi9tLnRlc3QoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSkge1xuICAgICAgICAgIHJldHVybiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtUmVxdWVzdC1VUkwnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMoeGhyKSxcbiAgICAgICAgICB1cmw6IHJlc3BvbnNlVVJMKClcbiAgICAgICAgfVxuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpXG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJ1xuICAgICAgfVxuXG4gICAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIHhoci5zZW5kKHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcmVxdWVzdC5fYm9keUluaXQpXG4gICAgfSlcbiAgfVxuICBzZWxmLmZldGNoLnBvbHlmaWxsID0gdHJ1ZVxufSkodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHRoaXMpO1xuIiwiLyoqXG4gKiBBZ2dyZWdhdGUgdmFsdWVzIGZyb20gZG9tIHRyZWVcbiAqL1xuY2xhc3MgQWdncmVnYXRvciB7XG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICB9XG5cbiAgYWdncmVnYXRlKHNjb3BlKSB7XG4gICAgY29uc3QgZWxlbXMgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsc2VsZWN0LHRleHRhcmVhJyk7XG4gICAgZm9yIChsZXQgaT0wLCBsPWVsZW1zLmxlbmd0aDsgaTxsOyArK2kpIHtcbiAgICAgIGNvbnN0IGVsZW0gPSBlbGVtc1tpXTtcbiAgICAgIGNvbnN0IG1vZGVsTmFtZSA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1tb2RlbCcpO1xuICAgICAgaWYgKG1vZGVsTmFtZSAmJiBtb2RlbE5hbWUuc3Vic3RyKDAsNSkgPT09ICd0aGlzLicpIHtcbiAgICAgICAgY29uc3QgdmFsID0gZWxlbS50eXBlID09PSAnY2hlY2tib3gnID8gZWxlbS5jaGVja2VkIDogZWxlbS52YWx1ZTtcbiAgICAgICAgbmV3IEZ1bmN0aW9uKCckdmFsJywgYGlmICghJHttb2RlbE5hbWV9KSB7ICR7bW9kZWxOYW1lfT0kdmFsOyB9YCkuYXBwbHkoc2NvcGUsIFt2YWxdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBZ2dyZWdhdG9yO1xuXG4iLCJjb25zdCBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS5qcycpO1xuY29uc3Qgc2NhbiA9IHJlcXVpcmUoJy4vdGV4dC1leHByZXNzaW9uLXNjYW5uZXIuanMnKTtcbmNvbnN0IGFzc2VydCA9IHZhbCA9PiB7IH07XG5cbi8vIGhhY2tcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvaW5jcmVtZW50YWwtZG9tL2lzc3Vlcy8yMzlcbkluY3JlbWVudGFsRE9NLmF0dHJpYnV0ZXMudmFsdWUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsLnZhbHVlID0gdmFsdWVcbn07XG5cbmNvbnN0IHNqX2F0dHIyZXZlbnQgPSB7XG4gICdzai1jbGljayc6ICdvbmNsaWNrJyxcbiAgJ3NqLWJsdXInOiAnb25ibHVyJyxcbiAgJ3NqLWNoZWNrZWQnOiAnb25jaGVja2VkJyxcbiAgJ3NqLWRibGNsaWNrJzogJ29uZGJsY2xpY2snLFxuICAnc2otZm9jdXMnOiAnb25mb2N1cycsXG4gICdzai1rZXlkb3duJzogJ29ua2V5ZG93bicsXG4gICdzai1rZXlwcmVzcyc6ICdvbmtleXByZXNzJyxcbiAgJ3NqLWtleXVwJzogJ29ua2V5dXAnLFxuICAnc2otbW91c2Vkb3duJzogJ29ubW91c2Vkb3duJyxcbiAgJ3NqLW1vdXNlZW50ZXInOiAnb25tb3VzZWVudGVyJyxcbiAgJ3NqLW1vdXNlbGVhdmUnOiAnb25tb3VzZWxlYXZlJyxcbiAgJ3NqLW1vdXNlbW92ZSc6ICdvbm1vdXNlbW92ZScsXG4gICdzai1tb3VzZW92ZXInOiAnb25tb3VzZW92ZXInLFxuICAnc2otbW91c2V1cCc6ICdvbm1vdXNldXAnLFxuICAnc2otcGFzdGUnOiAnb25wYXN0ZScsXG4gICdzai1zZWxlY3RlZCc6ICdvbnNlbGVjdGVkJyxcbiAgJ3NqLXN1Ym1pdCc6ICdvbnN1Ym1pdCdcbn07XG5cbmNvbnN0IHNqX2Jvb2xlYW5fYXR0cmlidXRlcyA9IHtcbiAgJ3NqLWRpc2FibGVkJzogJ2Rpc2FibGVkJyxcbiAgJ3NqLXJlcXVpcmVkJzogJ3JlcXVpcmVkJyxcbiAgJ3NqLWNoZWNrZWQnOiAnY2hlY2tlZCdcbn07XG5cbmNsYXNzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgYXNzZXJ0KGFyZ3VtZW50cy5sZW5ndGggPT09IDApO1xuICB9XG5cbiAgY29tcGlsZSh0ZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHRlbXBsYXRlRWxlbWVudC5jaGlsZE5vZGVzO1xuICAgIGxldCBjb2RlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgY29kZSA9IGNvZGUuY29uY2F0KHRoaXMucmVuZGVyRE9NKGNoaWxkcmVuW2ldLCBbXSkpO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhjb2RlLmpvaW4oXCI7XFxuXCIpKTtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdJbmNyZW1lbnRhbERPTScsIGNvZGUuam9pbihcIjtcXG5cIikpO1xuICB9XG5cbiAgcmVuZGVyRE9NKGVsZW0sIHZhcnMpIHtcbiAgICBhc3NlcnQoZWxlbSk7XG4gICAgYXNzZXJ0KHZhcnMpO1xuICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS50ZXh0KCR7dGhpcy50ZXh0KGVsZW0udGV4dENvbnRlbnQpfSlgO1xuICAgIH0gZWxzZSBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gTm9kZS5DT01NRU5UX05PREUpIHtcbiAgICAgIC8vIElnbm9yZSBjb21tZW50IG5vZGVcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJzID0gW107XG4gICAgY29uc3QgZm9vdGVycyA9IFtdO1xuICAgIHZhciBib2R5ID0gW107XG5cbiAgICAvLyBwcm9jZXNzIGBzai1pZmBcbiAgICB7XG4gICAgICBjb25zdCBjb25kID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NqLWlmJyk7XG4gICAgICBpZiAoY29uZCkge1xuICAgICAgICBoZWFkZXJzLnB1c2goYGlmICgke2NvbmR9KSB7YCk7XG4gICAgICAgIGZvb3RlcnMucHVzaChgfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHByb2Nlc3MgYHNqLXJlcGVhdGBcbiAgICB7XG4gICAgICBjb25zdCBjb25kID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NqLXJlcGVhdCcpO1xuICAgICAgaWYgKGNvbmQpIHtcbiAgICAgICAgY29uc3QgbSA9IGNvbmQubWF0Y2goL15cXHMqKD86KFxcdyspfFxcKFxccyooXFx3KylcXHMqLFxccyooXFx3KylcXHMqXFwpKVxccytpblxccysoW2Etel1bYS16MC05Ll0qKVxccyokLyk7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgIHRocm93IGBJbnZhbGlkIHNqLXJlcGVhdCB2YWx1ZTogJHtjb25kfWA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobVsxXSkge1xuICAgICAgICAgIGNvbnN0IHZhck5hbWUgPSBtWzFdO1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IG1bNF07XG5cbiAgICAgICAgICBoZWFkZXJzLnB1c2goYChmdW5jdGlvbihJbmNyZW1lbnRhbERPTSkge1xcbnZhciAkJGNvbnRhaW5lcj0ke2NvbnRhaW5lcn07XFxuZm9yICh2YXIgJGluZGV4PTAsJGw9JCRjb250YWluZXIubGVuZ3RoOyAkaW5kZXg8JGw7ICRpbmRleCsrKSB7XFxudmFyICR7dmFyTmFtZX09JCRjb250YWluZXJbJGluZGV4XTtgKTtcbiAgICAgICAgICBmb290ZXJzLnB1c2goYH1cXG59KS5hcHBseSh0aGlzLCBbSW5jcmVtZW50YWxET01dKTtgKTtcblxuICAgICAgICAgIHZhcnMgPSB2YXJzLmNvbmNhdChbdmFyTmFtZSwgJyRpbmRleCddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBrZXlOYW1lID0gbVsyXTtcbiAgICAgICAgICBjb25zdCB2YWx1ZU5hbWUgPSBtWzNdO1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IG1bNF07XG4gICAgICAgICAgaGVhZGVycy5wdXNoKGAoZnVuY3Rpb24oSW5jcmVtZW50YWxET00pIHtcXG4kJGNvbnRhaW5lcj0ke2NvbnRhaW5lcn07Zm9yICh2YXIgJHtrZXlOYW1lfSBpbiAkJGNvbnRhaW5lcikge1xcbnZhciAke3ZhbHVlTmFtZX09JCRjb250YWluZXJbJHtrZXlOYW1lfV07YCk7XG4gICAgICAgICAgZm9vdGVycy5wdXNoKGB9XFxufSkuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7YCk7XG4gICAgICAgICAgdmFycyA9IHZhcnMuY29uY2F0KFtrZXlOYW1lLCB2YWx1ZU5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIHByb2Nlc3MgYXR0cmlidXRlc1xuICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5TdGFydChcIiR7dGFnTmFtZX1cIilgKTtcbiAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJBdHRyaWJ1dGVzKGVsZW0sIHZhcnMpKTtcbiAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuRW5kKFwiJHt0YWdOYW1lfVwiKWApO1xuXG4gICAgY29uc3QgY2hpbGRyZW4gPSBlbGVtLmNoaWxkTm9kZXM7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgIC8vIHJlcGxhY2VWYXJpYWJsZXNcbiAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS50ZXh0KCR7dGhpcy50ZXh0KGNoaWxkLnRleHRDb250ZW50KX0pYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJET00oY2hpbGQsIHZhcnMpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2UoXCIke3RhZ05hbWV9XCIpYCk7XG5cbiAgICBjb25zdCByZXR2YWwgPSBbJzsnXS5jb25jYXQoaGVhZGVycykuY29uY2F0KGJvZHkpLmNvbmNhdChmb290ZXJzKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJET00gJHtKU09OLnN0cmluZ2lmeShyZXR2YWwpfWApO1xuICAgIHJldHVybiByZXR2YWw7XG4gIH1cblxuICByZW5kZXJBdHRyaWJ1dGVzKGVsZW0sIHZhcnMpIHtcbiAgICBhc3NlcnQodmFycyk7XG4gICAgY29uc3QgYXR0cnMgPSBlbGVtLmF0dHJpYnV0ZXM7XG4gICAgY29uc3QgY29kZUxpc3QgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IGF0dHJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgICAgY29uc3QgY29kZSA9IHRoaXMucmVuZGVyQXR0cmlidXRlKGVsZW0sIGF0dHJzW2ldLCB2YXJzKTtcbiAgICAgIGNvZGVMaXN0LnB1c2goY29kZSk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBET05FIHJlbmRlckF0dHJpYnV0ZXMgJHtKU09OLnN0cmluZ2lmeShjb2RlTGlzdCl9YCk7XG4gICAgcmV0dXJuIGNvZGVMaXN0O1xuICB9XG5cbiAgcmVuZGVyQXR0cmlidXRlKGVsZW0sIGF0dHIsIHZhcnMpIHtcbiAgICBhc3NlcnQodmFycyk7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckF0dHJpYnV0ZTogJHthdHRyLm5hbWV9PSR7YXR0ci52YWx1ZX1gKTtcblxuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0ci5uYW1lO1xuICAgIGlmIChhdHRyTmFtZS5zdWJzdHIoMCwzKSA9PT0gJ3NqLScpIHtcbiAgICAgIGNvbnN0IGV2ZW50ID0gc2pfYXR0cjJldmVudFthdHRyTmFtZV07XG4gICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IGF0dHIudmFsdWU7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcIiR7ZXZlbnR9XCIsIGZ1bmN0aW9uICgke3ZhcnMuY29uY2F0KFsnJGV2ZW50J10pLmpvaW4oXCIsXCIpfSkge1xuICAgICAgICAgICAgJHtleHByZXNzaW9ufTtcbiAgICAgICAgICB9LmJpbmQoJHtbJ3RoaXMnXS5jb25jYXQodmFycykuam9pbihcIixcIil9KSk7XG4gICAgICAgIGA7XG4gICAgICB9IGVsc2UgaWYgKGF0dHIubmFtZSA9PT0gJ3NqLW1vZGVsJykge1xuICAgICAgICBpZiAoZWxlbS50eXBlID09PSAnY2hlY2tib3gnKSB7XG4gICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIGlmICgke2F0dHIudmFsdWV9KSB7XG4gICAgICAgICAgICAgIEluY3JlbWVudGFsRE9NLmF0dHIoXCJjaGVja2VkXCIsICdjaGVja2VkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBJbmNyZW1lbnRhbERPTS5hdHRyKFwib25jaGFuZ2VcIiwgZnVuY3Rpb24gKCR7dmFycy5jb25jYXQoWyckZXZlbnQnXSkuam9pbihcIixcIil9KSB7XG4gICAgICAgICAgICAgICR7YXR0ci52YWx1ZX0gPSAkZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICB9LmJpbmQoJHtbJ3RoaXMnXS5jb25jYXQodmFycykuam9pbihcIixcIil9KSk7XG4gICAgICAgICAgYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcInZhbHVlXCIsICR7YXR0ci52YWx1ZX0pO1xuICAgICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcIm9uY2hhbmdlXCIsIGZ1bmN0aW9uICgke3ZhcnMuY29uY2F0KFsnJGV2ZW50J10pLmpvaW4oXCIsXCIpfSkge1xuICAgICAgICAgICAgICAke2F0dHIudmFsdWV9ID0gJGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIH0uYmluZCgke1sndGhpcyddLmNvbmNhdCh2YXJzKS5qb2luKFwiLFwiKX0pKTtcbiAgICAgICAgICBgO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHNqX2Jvb2xlYW5fYXR0cmlidXRlc1thdHRyLm5hbWVdKSB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHNqX2Jvb2xlYW5fYXR0cmlidXRlc1thdHRyLm5hbWVdO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gYXR0ci52YWx1ZTtcbiAgICAgICAgcmV0dXJuIGBpZiAoJHtleHByZXNzaW9ufSkgeyBJbmNyZW1lbnRhbERPTS5hdHRyKFwiJHthdHRyaWJ1dGV9XCIsIFwiJHthdHRyaWJ1dGV9XCIpOyB9YDtcbiAgICAgIH0gZWxzZSBpZiAoYXR0ci5uYW1lID09PSAnc2otY2xhc3MnKSB7XG4gICAgICAgIHJldHVybiBgSW5jcmVtZW50YWxET00uYXR0cihcImNsYXNzXCIsICR7YXR0ci52YWx1ZX0uam9pbihcIiBcIikpO2A7XG4gICAgICB9IGVsc2UgaWYgKGF0dHIubmFtZSA9PT0gJ3NqLXN0eWxlJykge1xuICAgICAgICByZXR1cm4gYEluY3JlbWVudGFsRE9NLmF0dHIoXCJzdHlsZVwiLCAke2F0dHIudmFsdWV9KTtgO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYEluY3JlbWVudGFsRE9NLmF0dHIoXCIke2F0dHIubmFtZX1cIiwgJHt0aGlzLnRleHQoYXR0ci52YWx1ZSl9KTtgO1xuICAgIH1cbiAgfVxuXG4gIHRleHQocykge1xuICAgIC8vIFRPRE8gb3B0aW1pemUgdGhpc1xuICAgIHJldHVybiBzY2FuKHMpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGlsZXI7XG5cbiIsImNvbnN0IENvbXBpbGVyID0gcmVxdWlyZSgnLi9jb21waWxlci5qcycpO1xuY29uc3QgQWdncmVnYXRvciA9IHJlcXVpcmUoJy4vYWdncmVnYXRvci5qcycpO1xuY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMnKTtcblxuLy8gYmFiZWwgaGFja3Ncbi8vIFNlZSBodHRwczovL3BoYWJyaWNhdG9yLmJhYmVsanMuaW8vVDE1NDhcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgIT09ICdmdW5jdGlvbicpIHtcbiAgdmFyIF9IVE1MRWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgfTtcbiAgX0hUTUxFbGVtZW50LnByb3RvdHlwZSA9IEhUTUxFbGVtZW50LnByb3RvdHlwZTtcbiAgSFRNTEVsZW1lbnQgPSBfSFRNTEVsZW1lbnQ7XG59XG5cbmNsYXNzIEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAvLyBwYXJzZSB0ZW1wbGF0ZVxuICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGUoKTtcbiAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICB0aHJvdyBgdGVtcGxhdGUgc2hvdWxkbid0IGJlIG51bGxgO1xuICAgIH1cblxuICAgIGNvbnN0IGh0bWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGh0bWwuaW5uZXJIVE1MID0gdGVtcGxhdGU7XG5cbiAgICB0aGlzLnByZXBhcmUoKTtcblxuICAgIC8vIFRPRE8gY2FjaGUgcmVzdWx0IGFzIGNsYXNzIHZhcmlhYmxlLlxuICAgIG5ldyBBZ2dyZWdhdG9yKGh0bWwpLmFnZ3JlZ2F0ZSh0aGlzKTtcbiAgICB0aGlzLmNvbXBpbGVkID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShodG1sKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuXG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHRlbXBsYXRlKCkge1xuICAgIHRocm93IFwiUGxlYXNlIGltcGxlbWVudCAndGVtcGxhdGUnIG1ldGhvZFwiO1xuICB9XG5cbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGtleSkge1xuICAgIHRoaXNba2V5XSA9IHRoaXMuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHByZXBhcmUoKSB7XG4gICAgLy8gbm9wLiBhYnN0cmFjdCBtZXRob2QuXG4gIH1cblxuICBpbml0aWFsaXplKCkge1xuICAgIC8vIG5vcC4gYWJzdHJhY3QgbWV0aG9kLlxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIEluY3JlbWVudGFsRE9NLnBhdGNoKHRoaXMsICgpID0+IHtcbiAgICAgIHRoaXMuY29tcGlsZWQuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7XG4gICAgfSk7XG4gIH1cblxuICBkdW1wKCkge1xuICAgIGNvbnN0IHNjb3BlID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKGtleSAhPT0gJ3JlbmRlcmVyJykge1xuICAgICAgICBzY29wZVtrZXldID0gdGhpc1trZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzY29wZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVsZW1lbnQ7XG5cbiIsIi8vIHBvbHlmaWxsc1xucmVxdWlyZSgnd2ViY29tcG9uZW50cy5qcy9DdXN0b21FbGVtZW50cy5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbC5qcycpO1xucmVxdWlyZSgnd2hhdHdnLWZldGNoL2ZldGNoLmpzJyk7XG5cbmNvbnN0IHRhZyA9IHJlcXVpcmUoJy4vdGFnLmpzJyk7XG5jb25zdCBFbGVtZW50ID0gcmVxdWlyZSgnLi9lbGVtZW50LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzLkVsZW1lbnQgPSBFbGVtZW50O1xubW9kdWxlLmV4cG9ydHMudGFnID0gdGFnO1xuIiwiLy8gcG9seWZpbGxcbnJlcXVpcmUoJ3dlYmNvbXBvbmVudHMuanMvQ3VzdG9tRWxlbWVudHMuanMnKTtcblxuaWYgKCF3aW5kb3cuY3VzdG9tRWxlbWVudHMpIHtcbiAgd2luZG93LmN1c3RvbUVsZW1lbnRzID0ge1xuICAgIGRlZmluZTogZnVuY3Rpb24gKG5hbWUsIGVsZW0pIHtcbiAgICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChuYW1lLCBlbGVtKTtcbiAgICB9XG4gIH07XG59XG5cbiIsImNvbnN0IENvbXBpbGVyID0gcmVxdWlyZSgnLi9jb21waWxlcicpO1xuY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMnKTtcbmNvbnN0IEFnZ3JlZ2F0b3IgPSByZXF1aXJlKCcuL2FnZ3JlZ2F0b3IuanMnKTtcblxudmFyIHVud3JhcENvbW1lbnQgPSAvXFwvXFwqIT8oPzpcXEBwcmVzZXJ2ZSk/WyBcXHRdKig/OlxcclxcbnxcXG4pKFtcXHNcXFNdKj8pKD86XFxyXFxufFxcbilcXHMqXFwqXFwvLztcblxuZnVuY3Rpb24gdGFnKHRhZ05hbWUsIG9wdHMpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBvcHRzLnRlbXBsYXRlO1xuICBkZWxldGUgb3B0c1sndGVtcGxhdGUnXTtcbiAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgIHRocm93IFwiTWlzc2luZyB0ZW1wbGF0ZVwiO1xuICB9XG5cbiAgY29uc3Qgc2NvcGUgPSBvcHRzWydkZWZhdWx0J10gfHwge307XG4gIGxldCBjb21waWxlZDtcblxuICBjb25zdCBlbGVtZW50Q2xhc3NQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gIGNvbnN0IGVsZW1lbnRDbGFzcyA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgICAgY29uc3QgaHRtbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGh0bWwuaW5uZXJIVE1MID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAodHlwZW9mKHRlbXBsYXRlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcENvbW1lbnQuZXhlYyh0ZW1wbGF0ZS50b1N0cmluZygpKVsxXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgICAgbmV3IEFnZ3JlZ2F0b3IoaHRtbCkuYWdncmVnYXRlKHNjb3BlKTtcbiAgICAgICAgY29tcGlsZWQgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGh0bWwpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBzY29wZSkge1xuICAgICAgICBpZiAoc2NvcGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIHRoaXNba2V5XSA9IHNjb3BlW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG9wdHMuaW5pdGlhbGl6ZSkge1xuICAgICAgICBvcHRzLmluaXRpYWxpemUuYXBwbHkodGhpcyk7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhrZXkpIHtcbiAgICAgIHRoaXNba2V5XSA9IHRoaXMuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgIEluY3JlbWVudGFsRE9NLnBhdGNoKHRoaXMsICgpID0+IHtcbiAgICAgICAgY29tcGlsZWQuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBkdW1wKCkge1xuICAgICAgY29uc3Qgc2NvcGUgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgaWYgKGtleSAhPT0gJ3JlbmRlcmVyJykge1xuICAgICAgICAgIHNjb3BlW2tleV0gPSB0aGlzW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHNjb3BlO1xuICAgIH1cbiAgfTtcblxuICBpZiAob3B0cy5tZXRob2RzKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIGluIG9wdHMubWV0aG9kcykge1xuICAgICAgZWxlbWVudENsYXNzLnByb3RvdHlwZVtuYW1lXSA9IG9wdHMubWV0aG9kc1tuYW1lXTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0cy5hY2Nlc3NvcnMpIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gb3B0cy5hY2Nlc3NvcnMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50Q2xhc3MucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICAgIGdldDogb3B0cy5hY2Nlc3NvcnNbbmFtZV0uZ2V0LFxuICAgICAgICBzZXQ6IG9wdHMuYWNjZXNzb3JzW25hbWVdLnNldFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY3VzdG9tRWxlbWVudHMuZGVmaW5lKHRhZ05hbWUsIGVsZW1lbnRDbGFzcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGFnO1xuXG4iLCJmdW5jdGlvbiBzY2FuKHMpIHtcbiAgY29uc3Qgb3JpZyA9IHM7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICB3aGlsZSAocy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaSA9IHMuaW5kZXhPZigne3snKTtcbiAgICBpZiAoaT49MCkge1xuICAgICAgaWYgKGk+MCkgeyAvLyB0aGVyZSdzIHByZWZpeCBzdHJpbmdcbiAgICAgICAgY29uc3QgcCA9IHMuc3Vic3RyKDAsIGkpO1xuICAgICAgICByZXN1bHQucHVzaChKU09OLnN0cmluZ2lmeShwKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZpbmQgY2xvc2luZyB9fVxuICAgICAgY29uc3QgbCA9IHMuaW5kZXhPZignfX0nKTtcbiAgICAgIGlmIChsPDApIHtcbiAgICAgICAgdGhyb3cgYE1pc3NpbmcgY2xvc2luZyAnfX0nIGluIGV4cHJlc3Npb246ICR7b3JpZ31gO1xuICAgICAgfVxuICAgICAgY29uc3QgZXhwID0gcy5zdWJzdHIoaSsyLCBsLShpKzIpKTtcbiAgICAgIGlmIChleHAubGVuZ3RoID4gMCkge1xuICAgICAgICByZXN1bHQucHVzaChgKCR7ZXhwfSlgKTtcbiAgICAgIH1cbiAgICAgIHM9cy5zdWJzdHIobCsyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goSlNPTi5zdHJpbmdpZnkocykpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQuam9pbihcIitcIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2NhbjtcblxuIl19
