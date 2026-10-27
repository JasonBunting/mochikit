if (typeof(tests) == 'undefined') { tests = {}; }

tests.test_Signal = function (t) {

    var submit = MochiKit.DOM.getElement('submit');
    var ident = null;
    var i = 0;
    var aFunction = function() {
        t.ok(this === submit, "aFunction should have 'this' as submit");
        i++;
        if (typeof(this.someVar) != 'undefined') {
            i += this.someVar;
        }
    };
    var bFunction = function(someArg, someOtherArg) {
        if (typeof(someArg) == "number") {
            i += someArg;
        }
        if (typeof(someOtherArg) == "number") {
            i += someOtherArg;
        }
    };

    var aObject = {};
    aObject.aMethod = function() {
        t.ok(this === aObject, "aMethod should have 'this' as aObject");
        i++;
    };

    ident = connect('submit', 'onclick', aFunction);
    MochiKit.DOM.getElement('submit').click();
    t.is(i, 1, 'HTML onclick event can be connected to a function');

    disconnect(ident);
    MochiKit.DOM.getElement('submit').click();
    t.is(i, 1, 'HTML onclick can be disconnected from a function');

    var submit = MochiKit.DOM.getElement('submit');

    ident = connect(submit, 'onclick', aFunction);
    submit.click();
    t.is(i, 2, 'Checking that a DOM element can be connected to a function');

    disconnect(ident);
    submit.click();
    t.is(i, 2, '...and then disconnected');

    ident = connect(submit, 'onclick', aObject, 'aMethod');
    submit.click();
    t.is(i, 3, 'Checking that a DOM element can be connected to a method');

    disconnect(ident);
    submit.click();
    t.is(i, 3, '...and disconnected again');

    if (MochiKit.DOM.getElement('submit').fireEvent ||
        (document.createEvent &&
        typeof(document.createEvent('MouseEvents').initMouseEvent) == 'function')) {

        /*

            Adapted from:
            http://www.devdaily.com/java/jwarehouse/jforum/tests/selenium/javascript/htmlutils.js.shtml
            License: Apache
            Copyright: Copyright 2004 ThoughtWorks, Inc

        */
        var triggerMouseEvent = function(element, eventType, canBubble) {
            var element = MochiKit.DOM.getElement(element);
            var canBubble = (typeof(canBubble) == 'undefined') ? true : canBubble;
            if (element.fireEvent) {
                var newEvt = document.createEventObject();
                newEvt.clientX = 1;
                newEvt.clientY = 1;
                newEvt.button = 1;
                newEvt.detail = 3;
                element.fireEvent('on' + eventType, newEvt);
            } else if (document.createEvent && (typeof(document.createEvent('MouseEvents').initMouseEvent) == 'function')) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent(eventType, canBubble, true, // event, bubbles, cancelable
                    document.defaultView, 3, // view, detail (either scroll or # of clicks)
                    1, 0, 0, 0, // screenX, screenY, clientX, clientY
                    false, false, false, false, // ctrlKey, altKey, shiftKey, metaKey
                    0, null); // buttonCode, relatedTarget
                element.dispatchEvent(evt);
            }
        };

        var eventTest = function(e) {
            i++;
            t.ok((typeof(e.event()) === 'object'), 'checking that event() is an object');
            t.ok((typeof(e.type()) === 'string'), 'checking that type() is a string');
            t.ok((e.target() === MochiKit.DOM.getElement('submit')), 'checking that target is "submit"');
            t.ok((typeof(e.modifier()) === 'object'), 'checking that modifier() is an object');
            t.ok(e.modifier().alt === false, 'checking that modifier().alt is defined, but false');
            t.ok(e.modifier().ctrl === false, 'checking that modifier().ctrl is defined, but false');
            t.ok(e.modifier().meta === false, 'checking that modifier().meta is defined, but false');
            t.ok(e.modifier().shift === false, 'checking that modifier().shift is defined, but  false');
            t.ok((typeof(e.mouse()) === 'object'), 'checking that mouse() is an object');
            t.ok((typeof(e.mouse().button) === 'object'), 'checking that mouse().button is an object');
            t.ok(e.mouse().button.left === true, 'checking that mouse().button.left is true');
            t.ok(e.mouse().button.middle === false, 'checking that mouse().button.middle is false');
            t.ok(e.mouse().button.right === false, 'checking that mouse().button.right is false');
            t.ok((typeof(e.mouse().page) === 'object'), 'checking that mouse().page is an object');
            t.ok((typeof(e.mouse().page.x) === 'number'), 'checking that mouse().page.x is a number');
            t.ok((typeof(e.mouse().page.y) === 'number'), 'checking that mouse().page.y is a number');
            t.ok((typeof(e.mouse().client) === 'object'), 'checking that mouse().client is an object');
            t.ok((typeof(e.mouse().client.x) === 'number'), 'checking that mouse().client.x is a number');
            t.ok((typeof(e.mouse().client.y) === 'number'), 'checking that mouse().client.y is a number');

            /* these should not be defined */
            t.ok((typeof(e.relatedTarget()) === 'undefined'), 'checking that relatedTarget() is undefined');
            t.ok((typeof(e.key()) === 'undefined'), 'checking that key() is undefined');
            t.ok((typeof(e.mouse().wheel) === 'undefined'), 'checking that mouse().wheel is undefined');
        };


        ident = connect('submit', 'onmousedown', eventTest);
        triggerMouseEvent('submit', 'mousedown', false);
        t.is(i, 4, 'Connecting an event to an HTML object and firing a synthetic event');

        disconnect(ident);
        triggerMouseEvent('submit', 'mousedown', false);
        t.is(i, 4, 'Disconnecting an event to an HTML object and firing a synthetic event');

        ident = connect('submit', 'onmousewheel', function(e) {
            i++;
            t.ok((typeof(e.mouse()) === 'object'), 'checking that mouse() is an object');
            t.ok((typeof(e.mouse().wheel) === 'object'), 'checking that mouse().wheel is an object');
            t.ok((typeof(e.mouse().wheel.x) === 'number'), 'checking that mouse().wheel.x is a number');
            t.ok((typeof(e.mouse().wheel.y) === 'number'), 'checking that mouse().wheel.y is a number');
        });
        var nativeSignal = 'mousewheel';
        if (MochiKit.Signal._browserLacksMouseWheelEvent()) {
            nativeSignal = 'DOMMouseScroll';
        }
        triggerMouseEvent('submit', nativeSignal, false);
        t.is(i, 5, 'Connecting a mousewheel event to an HTML object and firing a synthetic event');
        disconnect(ident);
        triggerMouseEvent('submit', nativeSignal, false);
        t.is(i, 5, 'Disconnecting a mousewheel event to an HTML object and firing a synthetic event');
    }


    // non-event signals to DOM nodes
    i = 0;
    ident = connect(submit, 'onclick', bFunction);
    signal(submit, 'onclick', 1, 2);
    t.is(i, 3, 'Manual signal() from DOM element to a function');

    disconnect(ident);
    signal(submit, 'onclick', 1, 2);
    t.is(i, 3, '...and disconnected signals are not called');

    i = 0;
    ident = connect(submit, 'ontest', bFunction);
    signal(submit, 'ontest', 1, 2);
    t.is(i, 3, 'Manual signal() from DOM element with custom signal name');

    disconnect(ident);
    signal(submit, 'ontest', 1, 2);
    t.is(i, 3, '...and disconnected signals are not called');

    i = 0;
    ident = connect(submit, 'onclick', aObject, 'aMethod');
    signal(submit, 'onclick', 1, 2);
    t.is(i, 1, 'Manual signal() from DOM element to a method');

    disconnect(ident);
    signal(submit, 'onclick', 1, 2);
    t.is(i, 1, '...and disconnected signals are not called');


    // non-DOM tests

    var hasNoSignals = {};

    var hasSignals = {someVar: 1};

    var i = 0;

    var aFunction = function() {
        i++;
        if (typeof(this.someVar) != 'undefined') {
            i += this.someVar;
        }
    };

    var bFunction = function(someArg, someOtherArg) {
        i += someArg + someOtherArg;
    };


    var aObject = {};
    aObject.aMethod = function() {
        i++;
    };

    aObject.bMethod = function() {
        i++;
    };

    var bObject = {};
    bObject.bMethod = function() {
        i++;
    };


    ident = connect(hasSignals, 'signalOne', aFunction);
    signal(hasSignals, 'signalOne');
    t.is(i, 2, 'Connecting function');
    i = 0;

    disconnect(ident);
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'New style disconnecting function');
    i = 0;


    ident = connect(hasSignals, 'signalOne', bFunction);
    signal(hasSignals, 'signalOne', 1, 2);
    t.is(i, 3, 'Connecting function');
    i = 0;

    disconnect(ident);
    signal(hasSignals, 'signalOne', 1, 2);
    t.is(i, 0, 'New style disconnecting function');
    i = 0;


    connect(hasSignals, 'signalOne', aFunction);
    signal(hasSignals, 'signalOne');
    t.is(i, 2, 'Connecting function');
    i = 0;

    disconnect(hasSignals, 'signalOne', aFunction);
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'Old style disconnecting function');
    i = 0;


    ident = connect(hasSignals, 'signalOne', aObject, aObject.aMethod);
    signal(hasSignals, 'signalOne');
    t.is(i, 1, 'Connecting obj-function');
    i = 0;

    disconnect(ident);
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'New style disconnecting obj-function');
    i = 0;

    connect(hasSignals, 'signalOne', aObject, aObject.aMethod);
    signal(hasSignals, 'signalOne');
    t.is(i, 1, 'Connecting obj-function');
    i = 0;

    disconnect(hasSignals, 'signalOne', aObject, aObject.aMethod);
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'Disconnecting obj-function');
    i = 0;


    ident = connect(hasSignals, 'signalTwo', aObject, 'aMethod');
    signal(hasSignals, 'signalTwo');
    t.is(i, 1, 'Connecting obj-string');
    i = 0;

    disconnect(ident);
    signal(hasSignals, 'signalTwo');
    t.is(i, 0, 'New style disconnecting obj-string');
    i = 0;


    connect(hasSignals, 'signalTwo', aObject, 'aMethod');
    signal(hasSignals, 'signalTwo');
    t.is(i, 1, 'Connecting obj-string');
    i = 0;

    disconnect(hasSignals, 'signalTwo', aObject, 'aMethod');
    signal(hasSignals, 'signalTwo');
    t.is(i, 0, 'Old style disconnecting obj-string');
    i = 0;


    var shouldRaise = function() { return undefined.attr; };

    try {
        connect(hasSignals, 'signalOne', shouldRaise);
        ident = connect(hasSignals, 'signalOne', aFunction);
        signal(hasSignals, 'signalOne');
        t.ok(false, 'An exception was not raised');
    } catch (e) {
        t.ok(true, 'An exception was raised');
    }
    disconnect(hasSignals, 'signalOne', shouldRaise);
    disconnect(ident);
    t.is(i, 2, 'Exception raised, but signal was sent to all listeners');
    i = 0;


    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    connect(hasSignals, 'signalOne', aObject, 'bMethod');
    signal(hasSignals, 'signalOne');
    t.is(i, 2, 'Connecting one signal to two slots in one object');
    i = 0;

    disconnect(hasSignals, 'signalOne', aObject, 'aMethod');
    disconnect(hasSignals, 'signalOne', aObject, 'bMethod');
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'Disconnecting one signal from two slots in one object');
    i = 0;


    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    connect(hasSignals, 'signalOne', bObject, 'bMethod');
    signal(hasSignals, 'signalOne');
    t.is(i, 2, 'Connecting one signal to two slots in two objects');
    i = 0;

    disconnect(hasSignals, 'signalOne', aObject, 'aMethod');
    disconnect(hasSignals, 'signalOne', bObject, 'bMethod');
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'Disconnecting one signal from two slots in two objects');
    i = 0;


    try {
        connect(nothing, 'signalOne', aObject, 'aMethod');
        signal(nothing, 'signalOne');
        t.ok(false, 'An exception was not raised when connecting undefined');
    } catch (e) {
        t.ok(true, 'An exception was raised when connecting undefined');
    }

    try {
        disconnect(nothing, 'signalOne', aObject, 'aMethod');
        t.ok(false, 'An exception was not raised when disconnecting undefined');
    } catch (e) {
        t.ok(true, 'An exception was raised when disconnecting undefined');
    }


    try {
        connect(hasSignals, 'signalOne', nothing);
        signal(hasSignals, 'signalOne');
        t.ok(false, 'An exception was not raised when connecting an undefined function');
    } catch (e) {
        t.ok(true, 'An exception was raised when connecting an undefined function');
    }

    try {
        disconnect(hasSignals, 'signalOne', nothing);
        t.ok(false, 'An exception was not raised when disconnecting an undefined function');
    } catch (e) {
        t.ok(true, 'An exception was raised when disconnecting an undefined function');
    }


    try {
        connect(hasSignals, 'signalOne', aObject, aObject.nothing);
        signal(hasSignals, 'signalOne');
        t.ok(false, 'An exception was not raised when connecting an undefined method');
    } catch (e) {
        t.ok(true, 'An exception was raised when connecting an undefined method');
    }

    try {
        connect(hasSignals, 'signalOne', aObject, 'nothing');
        signal(hasSignals, 'signalOne');
        t.ok(false, 'An exception was not raised when connecting an undefined method (as string)');
    } catch (e) {
        t.ok(true, 'An exception was raised when connecting an undefined method (as string)');
    }

    t.is(i, 0, 'Signals should not have fired');

    connect(hasSignals, 'signalOne', aFunction);
    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    disconnectAll(hasSignals, 'signalOne');
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'disconnectAll works with single explicit signal');
    i = 0;

    connect(hasSignals, 'signalOne', aFunction);
    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    connect(hasSignals, 'signalTwo', aFunction);
    connect(hasSignals, 'signalTwo', aObject, 'aMethod');
    disconnectAll(hasSignals, 'signalOne');
    signal(hasSignals, 'signalOne');
    t.is(i, 0, 'disconnectAll works with single explicit signal');
    signal(hasSignals, 'signalTwo');
    t.is(i, 3, 'disconnectAll does not disconnect unrelated signals');
    i = 0;

    connect(hasSignals, 'signalOne', aFunction);
    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    connect(hasSignals, 'signalTwo', aFunction);
    connect(hasSignals, 'signalTwo', aObject, 'aMethod');
    disconnectAll(hasSignals, 'signalOne', 'signalTwo');
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(i, 0, 'disconnectAll works with two explicit signals');
    i = 0;

    connect(hasSignals, 'signalOne', aFunction);
    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    connect(hasSignals, 'signalTwo', aFunction);
    connect(hasSignals, 'signalTwo', aObject, 'aMethod');
    disconnectAll(hasSignals, ['signalOne', 'signalTwo']);
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(i, 0, 'disconnectAll works with two explicit signals as a list');
    i = 0;

    connect(hasSignals, 'signalOne', aFunction);
    connect(hasSignals, 'signalOne', aObject, 'aMethod');
    connect(hasSignals, 'signalTwo', aFunction);
    connect(hasSignals, 'signalTwo', aObject, 'aMethod');
    disconnectAll(hasSignals);
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(i, 0, 'disconnectAll works with implicit signals');
    i = 0;

    var toggle = function() {
        disconnectAll(hasSignals, 'signalOne');
        connect(hasSignals, 'signalOne', aFunction);
        i++;
    };

    connect(hasSignals, 'signalOne', aFunction);
    connect(hasSignals, 'signalTwo', function() { i++; });
    connect(hasSignals, 'signalTwo', toggle);
    connect(hasSignals, 'signalTwo', function() { i++; }); // #147
    connect(hasSignals, 'signalTwo', function() { i++; });
    signal(hasSignals, 'signalTwo');
    t.is(i, 4, 'disconnectAll fired in a signal loop works');
    i = 0;
    disconnectAll(hasSignals, 'signalOne', 'signalTwo');

    // Test reentrant signals (#346)
    var toggle = function() {
        disconnectAll(hasSignals, 'signalTwo');
        signal(hasSignals, 'signalTwo');
    };
    connect(hasSignals, 'signalTwo', function() { i++; });
    connect(hasSignals, 'signalOne', toggle);
    connect(hasSignals, 'signalOne', function() { i++; });
    connect(hasSignals, 'signalOne', function() { i++; });
    signal(hasSignals, 'signalOne');
    t.is(i, 2, 'disconnectAll & signal fired in an observer works');
    i = 0;
    disconnectAll(hasSignals, 'signalOne', 'signalTwo');

    var testfunc = function () { arguments.callee.count++; };
    testfunc.count = 0;
    var testObj = {
        methOne: function () { this.countOne++; }, countOne: 0,
        methTwo: function () { this.countTwo++; }, countTwo: 0
    };
    connect(hasSignals, 'signalOne', testfunc);
    connect(hasSignals, 'signalTwo', testfunc);
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(testfunc.count, 2, 'disconnectAllTo func precondition');
    disconnectAllTo(testfunc);
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(testfunc.count, 2, 'disconnectAllTo func');

    connect(hasSignals, 'signalOne', testObj, 'methOne');
    connect(hasSignals, 'signalTwo', testObj, 'methTwo');
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(testObj.countOne, 1, 'disconnectAllTo obj precondition');
    t.is(testObj.countTwo, 1, 'disconnectAllTo obj precondition');
    disconnectAllTo(testObj);
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(testObj.countOne, 1, 'disconnectAllTo obj');
    t.is(testObj.countTwo, 1, 'disconnectAllTo obj');

    testObj.countOne = testObj.countTwo = 0;
    connect(hasSignals, 'signalOne', testObj, 'methOne');
    connect(hasSignals, 'signalTwo', testObj, 'methTwo');
    disconnectAllTo(testObj, 'methOne');
    signal(hasSignals, 'signalOne');
    signal(hasSignals, 'signalTwo');
    t.is(testObj.countOne, 0, 'disconnectAllTo obj+str');
    t.is(testObj.countTwo, 1, 'disconnectAllTo obj+str');
    disconnectAll(hasSignals);

    var has__Connect = {
          count: 0,
          __connect__: function (ident) {
              this.count += arguments.length;
              disconnect(ident);
          }
    };
    connect(has__Connect, 'signalOne', function() {
        t.fail("__connect__ should have disconnected signal");
    });
    t.is(has__Connect.count, 3, '__connect__ is called when it exists');
    signal(has__Connect, 'signalOne');

    var has__Disconnect = {
          count: 0,
          __disconnect__: function (ident) {
              this.count += arguments.length;
          }
    };
    connect(has__Disconnect, 'signalOne', aFunction);
    connect(has__Disconnect, 'signalTwo', aFunction);
    disconnectAll(has__Disconnect);
    t.is(has__Disconnect.count, 8, '__disconnect__ is called when it exists');

    var events = {};
    var test_ident = connect(events, "test", function() {
        var fail_ident = connect(events, "fail", function () {
            events.failed = true;
        });
        disconnect(fail_ident);
        signal(events, "fail");
    });
    signal(events, "test");
    t.is(events.failed, undefined, 'disconnected slots do not fire');
    disconnectAll(events);

    var sink = {f: function (ev) { this.ev = ev; }};
    var src = {};
    bindMethods(sink);
    connect(src, 'signal', sink.f);
    signal(src, 'signal', 'worked');
    t.is(sink.ev, 'worked', 'custom signal does not re-bind methods');
    disconnectAll(src);

    var lateObj = { fun: function() { this.value = 1; } };
    connect(src, 'signal', lateObj, "fun");
    signal(src, 'signal');
    lateObj.fun = function() { this.value = 2; };
    signal(src, 'signal');
    t.is(lateObj.value, 2, 'connect uses late function binding');
    disconnectAll(src);

    // Test connectOnce normal scenario
    var sink = {f: function (ev) { this.ev = ev; }};
    var src = {};
    bindMethods(sink);
    connectOnce(src, 'signal', sink.f);
    signal(src, 'signal', 'first');
    t.is(sink.ev, 'first', 'connectOnce propagates first signal');
    signal(src, 'signal', 'second');
    t.is(sink.ev, 'first', 'connectOnce disconnects on first signal');
    disconnectAll(src);

    // Test connectOnce with exception in handler
    var sink = {f: function (ev) { this.ev = ev; throw new Error("whatever"); }};
    var src = {};
    bindMethods(sink);
    connectOnce(src, 'signal', sink.f);
    try {
        signal(src, 'signal', 'first');
        t.ok(false, 'An exception was not raised in signal handler');
    } catch (e) {
        t.ok(true, 'An exception was raised in signal handler');
    }
    try {
        signal(src, 'signal', 'second');
        t.is(sink.ev, 'first', 'connectOnce disconnected in spite of exception');
    } catch (e) {
        t.ok(false, 'connectOnce failed to disconnect due to exception');
    }
    disconnectAll(src);

    // Test connectOnce with disconnect before first signal
    var sink = {f: function (ev) { this.ev = ev; }, ev: "dummy" };
    var src = {};
    bindMethods(sink);
    var ident = connectOnce(src, 'signal', sink.f);
    disconnect(ident);
    signal(src, 'signal', 'first');
    t.is(sink.ev, 'dummy', 'connectOnce was disconnected properly');

    tests.test_SignalListenerOptions(t);
    tests.test_SignalMouseEnterCapture(t);
    tests.test_SignalEventAccessors(t);
};

tests.test_SignalListenerOptions = function (t) {
    var S = MochiKit.Signal;
    var registered;
    var removed;
    var source = {
        addEventListener: function (type, listener, options) {
            registered = {type: type, listener: listener, options: options};
        },
        removeEventListener: function (type, listener, capture) {
            removed = {type: type, listener: listener, capture: capture};
        }
    };
    var handler = function () {};
    var ident = connect(source, 'onclick', handler);
    t.is(registered.options, false, 'Existing calls retain boolean false registration');
    disconnect(ident);
    t.is(removed.capture, false, 'Existing calls retain bubble-phase removal');

    var supportsPassive = S._supportsPassiveEvents();
    var options = {capture: true, passive: false};
    ident = connect(source, 'onclick', handler, options);
    var listener = registered.listener;
    options.capture = false;
    disconnect(ident);
    t.ok(removed.listener === listener, 'Disconnect removes the registered listener');
    t.is(removed.capture, true, 'Disconnect retains capture after caller mutates options');
    if (supportsPassive) {
        t.is(registered.options.passive, false, 'Explicit passive false is preserved');
        t.is(registered.options.capture, true, 'Registration uses a snapshot of options');
        ident = connectOnce(source, 'ontouchmove', handler, {capture: true, passive: true});
        t.is(registered.options.passive, true, 'connectOnce cleanup listener is also passive');
        t.is(registered.options.capture, true, 'connectOnce cleanup uses the same capture phase');
        registered.listener({type: 'touchmove'});
        t.ok(!ident.connected, 'Passive connectOnce cleanup disconnects the handler');
    }

    // Exercise the boolean-only browser fallback even on modern browsers.
    try {
        S._passiveEventsSupported = false;
        ident = connect(source, 'onclick', handler, {passive: true});
        t.is(registered.options, false, 'Legacy fallback does not accidentally enable capture');
        disconnect(ident);
        ident = connect(source, 'onclick', handler, {capture: true, passive: true});
        t.is(registered.options, true, 'Legacy fallback preserves capture');
        disconnect(ident);
        t.is(removed.capture, true, 'Legacy capture listener can be removed');
    } finally {
        S._passiveEventsSupported = supportsPassive;
    }

    var unsupported = [{once: true}, {signal: {}}, true];
    for (var n = 0; n < unsupported.length; n++) {
        var observerCount = S._observers.length;
        registered = null;
        var threw = false;
        try {
            connect(source, 'onclick', handler, undefined, unsupported[n]);
        } catch (e) {
            threw = true;
        }
        t.ok(threw, 'Unsupported listener options are rejected');
        t.is(registered, null, 'Invalid options do not register a native listener');
        t.is(S._observers.length, observerCount, 'Invalid options do not add an observer');
    }

    var hookArguments;
    var customSource = {__connect__: function () { hookArguments = arguments; }};
    var customOptions = {custom: true};
    ident = connect(customSource, 'test', handler, undefined, customOptions);
    t.ok(hookArguments[4] === customOptions, 'Non-DOM __connect__ arguments are preserved');
    disconnect(ident);

    if (!document.createEvent || !document.addEventListener) {
        return;
    }
    var parent = document.createElement('div');
    var child = document.createElement('button');
    parent.appendChild(child);
    var fire = function (bubbles) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('mochikitoptions', bubbles, true);
        child.dispatchEvent(event);
        return event;
    };
    var order = [];
    var receiver = {handle: function (event) {
        t.ok(this === receiver, 'Options preserve object-method binding');
        t.ok(event instanceof S.Event, 'Options preserve MochiKit event wrapping');
        order.push('capture');
    }};
    var captureIdent = connect(parent, 'onmochikitoptions', receiver, 'handle', {capture: true});
    var bubbleIdent = connect(parent, 'onmochikitoptions', function () { order.push('bubble'); });
    var targetIdent = connect(child, 'onmochikitoptions', function () {
        t.ok(this === child, 'Options preserve standalone handler binding');
        order.push('target');
    }, {passive: true});
    fire(true);
    t.is(order.join(','), 'capture,target,bubble', 'Capture options control propagation order');
    disconnect(captureIdent);
    order = [];
    fire(true);
    t.is(order.join(','), 'target,bubble', 'Disconnect removes a real capture listener');
    disconnect(bubbleIdent);
    disconnect(targetIdent);

    receiver.handle = function () { this.calls++; };
    receiver.calls = 0;
    ident = connect(parent, 'onmochikitoptions', receiver, receiver.handle, {capture: true});
    fire(false);
    t.is(receiver.calls, 1, 'Object/function form accepts options');
    disconnectAllTo(receiver);
    fire(false);
    t.is(receiver.calls, 1, 'disconnectAllTo removes capture listeners');

    var calls = 0;
    ident = connect(parent, 'onmochikitoptions', function () { calls++; }, {capture: true});
    signal(parent, 'onmochikitoptions');
    t.is(calls, 1, 'Manual signal works with standalone handler options');
    disconnectAll(parent);
    fire(false);
    t.is(calls, 1, 'disconnectAll removes capture listeners');

    var onceObservers = S._observers.length;
    ident = connectOnce(parent, 'onmochikitoptions', function () { calls++; }, {capture: true});
    fire(false);
    fire(false);
    t.is(calls, 2, 'connectOnce captures a non-bubbling event only once');
    t.ok(!ident.connected, 'connectOnce updates connection state');
    t.is(S._observers.length, onceObservers, 'connectOnce removes its capture cleanup listener');

    ident = connectOnce(parent, 'onmochikitoptions', receiver, 'handle', {capture: true});
    fire(false);
    fire(false);
    t.is(receiver.calls, 2, 'connectOnce object-method form accepts options');

    if (supportsPassive) {
        var prevent = function (event) { event.preventDefault(); };
        ident = connect(child, 'onmochikitoptions', prevent, {passive: true});
        t.ok(!fire(true).defaultPrevented, 'Passive handler cannot cancel the native event');
        disconnect(ident);
        ident = connect(child, 'onmochikitoptions', prevent, {passive: false});
        t.ok(fire(true).defaultPrevented, 'Explicitly non-passive handler can cancel the native event');
        disconnect(ident);
    }

    var submitCalls = 0;
    ident = connect('submit', 'onclick', function () { submitCalls++; }, {capture: true});
    document.getElementById('submit').click();
    disconnect(ident);
    document.getElementById('submit').click();
    t.is(submitCalls, 1, 'Element IDs accept listener options and disconnect correctly');
};

tests.test_SignalMouseEnterCapture = function (t) {
    if (!document.createEvent || !document.addEventListener) {
        return;
    }
    var S = MochiKit.Signal;
    var detectsNativeEvents = S._browserAlreadyHasMouseEnterAndLeave;
    var parent = document.createElement('div');
    var child = document.createElement('span');
    var sibling = document.createElement('span');
    var outside = document.createElement('div');
    parent.appendChild(child);
    parent.appendChild(sibling);
    var fire = function (type, related) {
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent(type, true, true, document.defaultView, 0,
            0, 0, 0, 0, false, false, false, false, 0, related);
        child.dispatchEvent(event);
        return event;
    };
    var events = [['mouseenter', 'mouseover'], ['mouseleave', 'mouseout']];
    try {
        S._browserAlreadyHasMouseEnterAndLeave = function () { return false; };
        for (var n = 0; n < events.length; n++) {
            var type = events[n][0];
            var nativeType = events[n][1];
            var order = [];
            connect(parent, 'on' + type, function (event) {
                t.is(event.type(), type, 'Capture emulation retains the requested event type');
                order.push('capture');
            }, {capture: true, passive: true});
            connect(child, 'on' + nativeType, function () { order.push('child'); });
            connect(parent, 'on' + nativeType, function () { order.push('bubble'); });
            var event = fire(nativeType, outside);
            t.is(order.join(','), 'capture,child,bubble', type + ' capture allows target and bubble listeners');
            t.ok(!event.defaultPrevented, type + ' capture does not cancel the native default action');
            order = [];
            fire(nativeType, sibling);
            t.is(order.join(','), 'child,bubble', type + ' internal transitions do not suppress native listeners');
            disconnectAll(parent);

            order = [];
            connect(parent, 'on' + type, function (event) {
                order.push('explicit-stop');
                event.stop();
            }, {capture: true, passive: false});
            event = fire(nativeType, outside);
            t.is(order.join(','), 'explicit-stop', type + ' handler can still explicitly stop propagation');
            t.ok(event.defaultPrevented, type + ' handler can still explicitly cancel the default action');
            disconnectAll(parent);

            order = [];
            connect(parent, 'on' + type, function () { order.push('legacy'); });
            event = fire(nativeType, outside);
            t.is(order.join(','), 'child,legacy', type + ' default registration retains existing order');
            t.ok(event.defaultPrevented, type + ' default registration retains legacy cancellation');
            disconnectAll(parent);
            disconnectAll(child);
        }
    } finally {
        S._browserAlreadyHasMouseEnterAndLeave = detectsNativeEvents;
        disconnectAll(parent);
        disconnectAll(child);
    }
};

tests.test_SignalEventAccessors = function (t) {
    var E = MochiKit.Signal.Event;
    var nativeEvent = {
        type: 'keydown', key: '+', keyCode: 187, detail: 0,
        isComposing: false, repeat: false, isTrusted: false,
        defaultPrevented: false, persisted: false, dataTransfer: null
    };
    var event = new E(null, nativeEvent);
    t.is(event.keyName(), '+', 'keyName returns the interpreted character');
    t.is(event.key().code, 187, 'Legacy key code is unchanged');
    t.is(event.key().string, 'KEY_EQUALS_SIGN', 'Legacy key names are unchanged');
    t.is(event.detail(), 0, 'detail preserves zero');
    t.ok(event.dataTransfer() === null, 'dataTransfer preserves null');
    var flags = ['isComposing', 'repeat', 'isTrusted', 'defaultPrevented', 'persisted'];
    for (var n = 0; n < flags.length; n++) {
        var name = flags[n];
        t.ok(event[name]() === false, name + ' preserves false');
        nativeEvent[name] = true;
        t.ok(event[name]() === true, name + ' reads the current native value');
    }
    nativeEvent.key = 'Z';
    t.is(event.keyName(), 'Z', 'keyName does not lowercase the native key');
    nativeEvent.key = '';
    t.is(event.keyName(), '', 'keyName preserves an empty string');
    nativeEvent.key = 'Unidentified';
    t.is(event.keyName(), 'Unidentified', 'keyName does not invent a legacy fallback');
    nativeEvent.detail = 2;
    t.is(event.detail(), 2, 'detail reads the current click count');
    t.is(new E(null, {type: 'keydown', keyCode: 229}).key().code, 229,
        'The legacy composition guard remains available');
    var character = new E(null, {type: 'keypress', charCode: 43});
    t.is(character.key().string, '+', 'Legacy keypress character decoding is unchanged');

    var transfer = {dropEffect: 'none', files: []};
    nativeEvent.dataTransfer = transfer;
    t.ok(event.dataTransfer() === transfer, 'dataTransfer returns the original object');
    event.dataTransfer().dropEffect = 'copy';
    t.is(transfer.dropEffect, 'copy', 'The caller can still set native dropEffect');
    var missing = new E(null, {});
    var accessors = ['keyName', 'detail', 'isComposing', 'repeat', 'isTrusted',
        'defaultPrevented', 'dataTransfer', 'persisted', 'pointer'];
    for (var n = 0; n < accessors.length; n++) {
        t.ok(missing[accessors[n]]() === undefined,
            accessors[n] + ' preserves a missing native value');
    }
    var hidden = new E(null, {type: 'pagehide', persisted: true});
    var shown = new E(null, {type: 'pageshow', persisted: false});
    t.ok(hidden.persisted() === true, 'pagehide exposes persisted');
    t.ok(shown.persisted() === false, 'pageshow exposes persisted');

    var pointerTypes = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel',
        'pointerover', 'pointerout', 'pointerenter', 'pointerleave', 'pointerrawupdate',
        'gotpointercapture', 'lostpointercapture'];
    for (var n = 0; n < pointerTypes.length; n++) {
        var pointerEvent = {
            type: pointerTypes[n], pointerId: 0, pointerType: 'pen', isPrimary: false,
            button: -1, buttons: 3, clientX: -2.5, clientY: 0,
            pageX: 0, pageY: 4.75
        };
        var wrapped = new E(null, pointerEvent);
        var pointer = wrapped.pointer();
        t.is(pointer.id, 0, pointerTypes[n] + ' preserves pointerId zero');
        t.is(pointer.type, 'pen', 'pointer.type is the device type, not the event type');
        t.ok(pointer.isPrimary === false, 'pointer preserves a non-primary pointer');
        t.is(pointer.button, -1, 'pointer.button preserves native numeric semantics');
        t.is(pointer.buttons, 3, 'pointer.buttons preserves the pressed-button bitmask');
        t.is(pointer.client.x, -2.5, 'pointer preserves negative fractional client coordinates');
        t.is(pointer.client.y, 0, 'pointer preserves client zero');
        t.is(pointer.page.x, 0, 'pointer preserves page zero');
        t.is(pointer.page.y, 4.75, 'pointer preserves fractional page coordinates');
        pointer.client.x = 123;
        t.is(pointerEvent.clientX, -2.5, 'Changing the returned coordinate object does not change the event');
        t.is(wrapped.pointer().client.x, -2.5, 'pointer returns native values on each call');
        t.ok(wrapped.mouse() === undefined, 'Legacy mouse() is not extended or changed');
    }
    t.ok(new E(null, {type: 'mousemove', pointerId: 1}).pointer() === undefined,
        'pointer does not classify ordinary mouse events as pointer events');
    t.ok(new E(null, {type: 'click', pointerId: 1}).pointer() === undefined,
        'pointer has an explicit pointer-event-name contract');
    var sparse = new E(null, {type: 'pointermove'}).pointer();
    t.ok(sparse.id === undefined && sparse.client.x === undefined && sparse.page.y === undefined,
        'pointer does not fabricate absent coordinates or identifiers');

    var immediateCalls = 0;
    var propagationCalls = 0;
    var preventCalls = 0;
    var stoppable = {
        type: 'click',
        stopImmediatePropagation: function () {
            t.ok(this === stoppable, 'Native immediate propagation method keeps its receiver');
            immediateCalls++;
        },
        stopPropagation: function () { propagationCalls++; },
        preventDefault: function () { preventCalls++; }
    };
    var stopEvent = new E(null, stoppable);
    stopEvent.stopImmediatePropagation();
    t.is(immediateCalls, 1, 'Immediate propagation delegates to the native method');
    t.is(propagationCalls, 0, 'Native immediate propagation needs no extra stopPropagation call');
    t.is(preventCalls, 0, 'Immediate propagation does not cancel the default action');
    stopEvent.stop();
    t.is(propagationCalls, 1, 'stop still calls stopPropagation');
    t.is(preventCalls, 1, 'stop still calls preventDefault');
    t.is(immediateCalls, 1, 'stop does not acquire immediate-propagation behavior');
    delete stoppable.stopImmediatePropagation;
    stopEvent.stopImmediatePropagation();
    t.is(propagationCalls, 2, 'Missing native method falls back to stopPropagation');
    var legacy = {type: 'click'};
    new E(null, legacy).stopImmediatePropagation();
    t.ok(legacy.cancelBubble === true, 'Old-browser fallback uses existing cancelBubble handling');

    if (!document.createEvent || !document.addEventListener) {
        return;
    }
    var parent = document.createElement('div');
    var child = document.createElement('button');
    parent.appendChild(child);
    var fire = function () {
        var native = document.createEvent('HTMLEvents');
        native.initEvent('mochikiteventaccessors', true, true);
        child.dispatchEvent(native);
        return native;
    };
    var probe = document.createEvent('HTMLEvents');
    if (typeof(probe.stopImmediatePropagation) == 'function') {
        var order = [];
        try {
            connect(child, 'onmochikiteventaccessors', function (e) {
                order.push('first');
                e.stopImmediatePropagation();
            }, {capture: true});
            connect(child, 'onmochikiteventaccessors', function () { order.push('later-capture'); }, {capture: true});
            connect(child, 'onmochikiteventaccessors', function () { order.push('later-bubble'); });
            connect(parent, 'onmochikiteventaccessors', function () { order.push('parent'); });
            var native = fire();
            t.is(order.join(','), 'first', 'Native immediate propagation suppresses later listeners and ancestors');
            t.ok(!native.defaultPrevented, 'Native immediate propagation leaves the default action uncanceled');
        } finally {
            disconnectAll(child);
            disconnectAll(parent);
        }
    }
    try {
        connect(child, 'onmochikiteventaccessors', function (e) {
            t.ok(e.defaultPrevented() === false, 'defaultPrevented starts false on a cancelable event');
            e.preventDefault();
            t.ok(e.defaultPrevented() === true, 'defaultPrevented observes preventDefault immediately');
        }, {passive: false});
        t.ok(fire().defaultPrevented === true, 'Wrapper cancellation reaches the native event');
    } finally {
        disconnectAll(child);
    }
};
