(function() {

  'use strict';


  /**
   * An ES5-Style Mixin module which is suitable as a declarative
   * parameter to the `mixins` list of a React component.  As state is
   * created within the closure of this function, a built mixin should not
   * be re-used with other components.
   */
  var ObserverMixin = {

    /**
     * Set mounted flag and add any listeners provided to listenTo() before
     * the component was mounted.
     * @private
     */
    componentWillMount: function observingComponentWillMount() {
      this._canSetState = true;
      var ln;
      for (var i = 0, l = (this._observerListeners || []).length; i < l; ++i) {
        ln = this._observerListeners[i];
        addListener(ln.observable, ln.eventName, ln.callback);
      }
    },

    /**
     * Set mounted flag and remove any listeners provided to listenTo().
     * @private
     */
    componentWillUnmount: function observingComponentWillUnmount() {
      this._canSetState = false;
      var ln;
      for (var i = 0, l = (this._observerListeners || []).length; i < l; ++i) {
        ln = this._observerListeners[i];
        removeListener(ln.observable, ln.eventName, ln.callback);
      }
    },

    /**
     * Attach a managed event listener to an observable object
     *
     * @param {Object} observable Object implementing DOM or Node-type observer methods
     * @param {String|Object} eventName Event name for subscription.  The user
     *   may pass an object where keys are event names and values are functions,
     *   in which case the third parameter to this method will be ignored.
     * @param {Function} callback Callback which will be bound to the observable.
     *
     */
    listenTo: function listenTo(observable, eventName, callback) {
      if (typeof eventName === 'object') {
        for (var en in eventName) {
          if (Object.prototype.hasOwnProperty.call(eventName, en)) {
            this.listenTo(observable, en, eventName[en]);
          }
        }
        return;
      }
      (this._observerListeners = this._observerListeners || []).push({
        observable: observable,
        eventName: eventName,
        callback: callback
      });
      if (this._canSetState) {
        addListener(observable, eventName, callback);
      }
    },

    /**
     * Calls setState() on the component if and only if the component
     * is already mounted.  Otherwise, the state update is silently
     * dropped. This is only appropriate for one-time async handlers
     * where the underlying request should not be cancelled when
     * component is unmounted.
     *
     * @param {Object} state K/V object normally passed to setState()
     */
    setStateIfMounted: function setStateIfMounted(state) {
      if (this._canSetState) {
        this.setState(state);
      }
    }
  };

  /**
   * Attach utility methods to the given React component, including spies on
   * lifecycle management.  Note that undefined behavior will result if lifecyle
   * methods (componentWillMount, componentWillUnmount) are directly defined on
   * the component as own-properties after the mixin function is called.
   *
   * @param {React.Component} component React component to extend.
   */
  function attachMixin(component) {
    spy(component, 'componentWillMount', ObserverMixin.componentWillMount.bind(component));
    spy(component, 'componentWillUnmount', ObserverMixin.componentWillUnmount.bind(component));
    component.listenTo = ObserverMixin.listenTo.bind(component);
    component.setStateIfMounted = ObserverMixin.setStateIfMounted.bind(component);
  }
  attachMixin.Mixin = ObserverMixin;


  /**
   * @private
   * Attach an event listener in a Node or DOM-compatible fashion.
   */
  function addListener(observable, eventName, callback) {
    if (typeof observable.on === 'function') {
      observable.on(eventName, callback);
    } else if (typeof observable.addEventListener === 'function') {
      observable.addEventListener(eventName, callback);
    }
  }

  /**
   * @private
   * Remove an event listener in a Node or DOM-compatible fashion.
   */
  function removeListener(observable, eventName, callback) {
    if (typeof observable.removeListener === 'function') {
      observable.removeListener(eventName, callback);
    } else if (typeof observable.removeEventListener === 'function') {
      observable.removeEventListener(eventName, callback);
    }
  }

  /**
   * @private
   * Spy on calls to methodName of an object.
   */
  function spy(obj, methodName, cb) {
    var real = obj[methodName];
    obj[methodName] = function methodSpy() {
      cb.apply(null, arguments);
      if (typeof real === 'function') {
        real.apply(obj, arguments);
      }
    };
  }

  module.exports = attachMixin;
}());
