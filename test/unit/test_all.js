var React = require('react');

var EventEmitter = require('events').EventEmitter;

var expect = require('chai').expect;

var observer = require('../../src/react-observer-mixin');

var mocks = require('../mocks');

var Scheme = {
  ES6: 'ES6',
  ES5: 'ES5'
};


describe('ReactObserverMixin Tests', function() {

  'use strict';

  describe('[module]', function() {


    it('Should provide a .Mixin property defining a mixin object', function() {
      var Mixin = observer.Mixin;
      expect(Mixin).to.be.an('object');
      expect(Mixin.listenTo).to.be.a('function');
      expect(Mixin.setStateIfMounted).to.be.a('function');
    });

    it('Should define a mixin function which adds methods to an object', function() {
      var obj = {};
      observer(obj);
      expect(obj.listenTo).to.be.a('function');
      expect(obj.setStateIfMounted).to.be.a('function');
    });
  });

  [Scheme.ES5, Scheme.ES6].forEach(function (scheme) {

    beforeEach(function() {
      var doc = mocks.generateDOM();
      global.window = {
        'document': doc
      };
      global.document = doc;
    });
    afterEach(function() {
      delete global.window;
      delete global.document;
    });

    describe('listenTo() [' + scheme + ']', function() {

      it('Should attach/detach listeners to a DOM observable when (un)mounted', function(done) {
        buildComponent(scheme, function(component) {
          var observable = new mocks.DOMObservable();
          verifyListenBehavior(component, observable, observable.trigger.bind(observable));
          done();
        });
      });

      it('Should attach/detach listeners to an EventEmitter when (un)mounted', function(done) {
        buildComponent(scheme, function(component) {
          var observable = new EventEmitter();
          verifyListenBehavior(component, observable, observable.emit.bind(observable));
          done();
        });
      });

    });

    describe('setStateIfMounted() [' + scheme + ']', function() {
      it('Should set state only if the component is mounted', function(done) {
        buildComponent(scheme, function(component) {
          component.setStateIfMounted({foo: 'bar'});
          expect((component.state || {}).foo).to.not.equal('bar');
          waitForMount(scheme, component, function() {
            component.setStateIfMounted({bar: 'baz'});
            // setState updates component state on the next run loop context
            setTimeout(function() {
              expect(component.state.bar).to.equal('baz');
              component.componentWillUnmount();
              component.setStateIfMounted({baz: 'balloon'});
              expect(component.state.foo).to.not.equal('balloon');
              done();
            }, 1);
          });
        });
      });
    });
  });

  describe('Spies for non-existent lifecycle methods [ES6]', function() {
    it('Should track mount state for components without componentWillMount', function() {
      var mockReactComponent = {state: {}};
      mockReactComponent.setState = mocks.ReactComponent.prototype.setState;
      observer(mockReactComponent);
      expect(mockReactComponent.componentWillMount).to.be.a('function');
      mockReactComponent.setStateIfMounted({bar: 'baz'});
      expect(mockReactComponent.state.bar).not.to.equal('baz');
      mockReactComponent.componentWillMount();
      mockReactComponent.setStateIfMounted({bar: 'baz'});
      expect(mockReactComponent.state.bar).to.equal('baz');
    });
  });

  function verifyListenBehavior(component, observable, emit) {
    var starts = 0;
    var ends = 0;
    var foos = 0;
    if (!component.listenTo) {
      throw new Error('listenTo not defined on the component');
    }

    // Test object.prototype pollution
    /*eslint-disable no-extend-native*/
    var keys = 0;
    Object.prototype.getAllKeys = function() { keys++; console.trace('wtf'); };
    /*eslint-enable no-extend-native*/

    component.listenTo(observable, {
      start: function () { starts++; },
      end: function () { ends++; }
    });
    component.listenTo(observable, 'foo', function() { foos++; });
    expect(starts).to.equal(0);
    expect(ends).to.equal(0);
    expect(foos).to.equal(0);

    // Should not hit handler because component is not mounted yet
    emit('start');
    expect(starts).to.equal(0);
    expect(ends).to.equal(0);
    emit('end');
    emit('foo');
    expect(ends).to.equal(0);
    expect(foos).to.equal(0);
    component.componentWillMount();
    emit('start');
    expect(starts).to.equal(1);
    emit('start');
    expect(starts).to.equal(2);

    // `keys` was on the prototype, not the passed object.  Note that
    // this test would fail for EventEmitters due to a lack of own-checking
    // in the node implementation, so only test this for our own mock
    // DOM emitter.
    if (!('on' in observable)) {
      keys = 0;
      emit('getAllKeys');
      expect(keys).to.equal(0);
    }

    emit('end');
    emit('foo');
    emit('end');
    expect(ends).to.equal(2);
    emit('foo');
    expect(foos).to.equal(2);

    // Test adding a listener after mounting
    var nexts = 0;
    component.listenTo(observable, 'next', function() { nexts++; });
    expect(nexts).to.equal(0);
    emit('next');
    expect(nexts).to.equal(1);


    // Check non-observables and state isolation
    var nons = 0;
    var nonObservable = {};
    component.listenTo(nonObservable, 'non', function() { nons++; });
    emit('non');
    expect(nons).to.equal(0);

    component.listenTo(observable, {

    });


    component.componentWillUnmount();
    emit('start');
    emit('end');
    emit('foo');
    emit('next');
    expect(starts).to.equal(2);
    expect(ends).to.equal(2);
    expect(foos).to.equal(2);
    expect(nexts).to.equal(1);
  }

  function buildComponent(scheme, onReady) {
    var mock;
    if (scheme === Scheme.ES6) {
      mock = new mocks.ReactComponent();
      mock.onMounted = null;
      observer(mock);
      process.nextTick(function() {
        onReady(mock);
      });
    } else if (scheme === Scheme.ES5) {
      // Since we have to use React.createClass for ES5, we'll need to test
      // with the full React stack and minimal necessary DOM

      var ComponentClass = React.createClass({
        mixins: [observer.Mixin],
        getInitialState: function() {
          this.onMounted = null;
          onReady(this);
          return {};
        },
        componentWillMount: function() {
          if (this.onMounted) {
            this.onMounted();
          }
        },
        render: function() {
          return React.createElement('div');
        }
      });
      React.render(
        React.createElement(ComponentClass),
        global.document.createElement('div'));
    } else {
      throw new Error('Unrecognized scheme (should be ES6 or ES5): ' + scheme);
    }
  }

  function waitForMount(scheme, component, onReady) {
    if (scheme === Scheme.ES6) {
      component.componentWillMount();
      onReady();
    } else {
      component.onMounted = onReady;
    }
  }
});
