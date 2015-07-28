# React Observer Mixin  [![Build Status](https://travis-ci.org/ccarpita/react-observer-mixin.svg?branch=master)](https://travis-ci.org/ccarpita/react-observer-mixin) [![codecov.io](http://codecov.io/github/ccarpita/react-observer-mixin/coverage.svg?branch=master)](http://codecov.io/github/ccarpita/react-observer-mixin?branch=master) [![Dependency Status](https://gemnasium.com/ccarpita/react-observer-mixin.svg)](https://gemnasium.com/ccarpita/react-observer-mixin)

A [React.js] Mixin with ES5 and ES6-compatible semantics which provides
managed event listeners that respect component lifecycles, as well as
state setters which are compatible with React invariants and are suitable
for use in one-time event handlers.

This module has no runtime dependencies and weighs in at ~1.3kB minified.

# Why does this exist?

Asynchronous callbacks which operate on a component's state will violate
React's invariants if the component is not mounted when the callback is
executed. This utility offers a mixin for React Component providing the
following functionality:

 * listenTo: Managed event listening respecting component lifecycles.  Listeners
     are automatically detached when the component is un-mounted.

 * setStateIfMounted: Conditional state setting which helps to avoid
     a violation of React's invariants when you know that you can safely drop 
     the result of an asynchronous request.

# ES6 Example 

```js
import observer from 'react-observer-mixin';

class MyComponent extends React.Component {
  constructor(props) {
    super(props);

    // Attach mixin methods and spies necessary to support them.
    observer(this);

    // The event handler automatically detaches when this component
    // is un-mounted.
    this.listenTo(props.observable, 'event', (result) => {
      this.setState({value: result});
    });

    // Other forms of async callbacks
    ajax(props.url).then((result) => {
      this.setStateIfMounted({value: result});
    });
  }
}
```

# ES5 Example

```js

var ObserverMixin = require('react-observer-mixin').Mixin;

var MyComponent = React.createClass({
  mixins: [ObserverMixin]
  getInitialState: function() {

    // Method documentation in the ES6 example applies here

    this.listenTo(this.props.observable, 'eventName', function(result) {
      this.setState({value: result});  
    }.bind(this));

    ajax(this.props.url1).then(function (result) {
      this.setStateIfMounted({value2: result}); 
    }.bind(this));
  }
});
```

# Definitions

| Term | Definition |
| ---- | ---------- |
| Mixin | Refers to this module's Mixin returned by the `build` function |
| Observable | Object providing `on` or `addEventListener` methods |

# API

## Module

### (Mixin) module.build

Generate a Mixin which can be provided to the list of mixins for a
React component.

See above for example usage.

### module.mixin(React.Component)

Attach Mixin methods to an React.Component built in an ES6 fashion.


## Provided Mixin Methods

### this.listenTo(Observable, StringOrObject, [Function])

Attaches one or more managed listeners to an observable object.  The event
listeners will be detached when the component is un-mounted, and re-attached
if/when the component is mounted again.


Example:
```js
  // ...
  getInitialState: function() {
    this.listenTo(this.props.element, 'change', function() {
      // ...
    });

    // For ease of use, multiple handlers may be attached by using
    // an object as the second parameter.
    this.listenTo(this.props.tcpClient, {
      connect: function () {
        // ...
      },
      disconnect: function () {
        // ...
      }
    });
  }
```

### this.setStateIfMounted(Object)

Sets state if and only if the component is currently mounted.  If the component
is un-mounted, this call will be ignored and any given state will be silently
dropped.


# Contributors

Accounts with accepted PRs will be added to this list.

* Chris Carpita

# License

[MIT]

[React.js]: http://facebook.github.io/react/
[MIT]: http://opensource.org/licenses/MIT
