(function() {
  'use strict';

  function MockDOMObservable() {
    this.eventHandlers = {};
  }

  MockDOMObservable.prototype.addEventListener = function (en, cb) {
    this.eventHandlers[en] = this.eventHandlers[en] || [];
    this.eventHandlers[en].push(cb);
  };
  MockDOMObservable.prototype.trigger = function(en) {
    for (var i = 0, l = (this.eventHandlers[en] || []).length; i < l; ++i) {
      this.eventHandlers[en][i]();
    }
  };
  MockDOMObservable.prototype.removeEventListener = function(en, cb) {
    if (this.eventHandlers[en]) {
      var newListeners = [];
      for (var i = 0, l = this.eventHandlers[en].length; i < l; ++i) {
        if (this.eventHandlers[en][i] !== cb) {
          newListeners.push(this.eventHandlers[en][i]);
        }
      }
      this.eventHandlers[en] = newListeners;
    }
  };

  function generateDOM() {

    // Amazingly, this is the minimum necessary mock DOM required to test
    // a React component as long as you're not verifying rednering behavior.
    var allNodes = [];
    var ELEMENT_NODE_TYPE = 1;

    function Element(tagName) {
      allNodes.push(this);
      this.nodeType = ELEMENT_NODE_TYPE;
      this.tagName = tagName;
      this.styles = {};
      this.childNodes = [];
    }

    var doc = {
      createElement: function createElement(tagName) {
        return new Element(tagName);
      }
    };

    return doc;
  }

  function MockReactComponent() {
    this.mounts = 0;
    this.unmounts = 0;
    this.state = {};
  }

  MockReactComponent.prototype.componentWillMount = componentWillMount;
  MockReactComponent.prototype.componentWillUnmount = componentWillUnmount;

  function componentWillMount() {
    this.mounts = this.mounts || 0;
    this.mounts++;
  }

  function componentWillUnmount() {
    this.unmounts = this.unmounts || 0;
    this.unmounts++;
  }

  MockReactComponent.prototype.setState = function(kvs) {
    for (var key in kvs) {
      if (kvs.hasOwnProperty(key)) {
        this.state[key] = kvs[key];
      }
    }
  };

  module.exports = {
    DOMObservable: MockDOMObservable,
    ReactComponent: MockReactComponent,
    generateDOM: generateDOM
  };
}());
