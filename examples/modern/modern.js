/* Examples of fork-only APIs. Load the packed bundle before this script. */
(function () {
    var DOM = MochiKit.DOM;
    var Async = MochiKit.Async;
    var Signal = MochiKit.Signal;
    var svg = DOM.SVG({viewBox: "0 0 360 90", width: 360, height: 90, role: "img", "aria-label": "SVG shapes and a greeting"},
        DOM.SVG.RECT({x: 5, y: 10, width: 350, height: 70, rx: 8, fill: "#28608b"}),
        DOM.SVG.CIRCLE({cx: 45, cy: 45, r: 20, fill: "#b5db69"}),
        DOM.SVG.TEXT({x: 80, y: 52, fill: "white", "font-size": 22}, "Hello from MochiKit"));
    DOM.appendChildNodes("drawing", svg);
    DOM.appendChildNodes("semantic", DOM.P(null,
        DOM.EM(null, "Semantic markup"), " with ", DOM.CODE(null, "DOM.CODE"), ", ",
        DOM.KBD(null, "Enter"), ", ", DOM.ABBR({title: "HyperText Markup Language"}, "HTML"), ", ",
        "H", DOM.SUB(null, "2"), "O and x", DOM.SUP(null, "2"), ". ",
        DOM.SMALL(null, "Example date: "), DOM.TIME({datetime: "2026-10-28"}, "October 28, 2026")));

    var pending = null;
    function runPromise(reject) {
        DOM.getElement("resolve").disabled = true;
        DOM.getElement("reject").disabled = true;
        DOM.getElement("cancel").disabled = false;
        DOM.replaceChildNodes("promise-status", "Pending…");
        // This timer deliberately continues even when the Deferred is cancelled.
        pending = Async.fromPromise(new Promise(function (resolve, fail) {
            setTimeout(function () {
                if (reject) { fail("Example rejection"); }
                else { resolve("Promise resolved into the Deferred callback."); }
            }, 600);
        }));
        pending.addCallback(function (value) {
            DOM.replaceChildNodes("promise-status", value);
            return value;
        });
        pending.addErrback(function (error) {
            DOM.replaceChildNodes("promise-status", error instanceof Async.CancelledError ?
                "Deferred cancelled; later Promise settlement is ignored." :
                "Errback received " + error.name + ": " + error.message);
            return null; // This demo has handled the error.
        });
        pending.addBoth(function (result) {
            DOM.getElement("resolve").disabled = false;
            DOM.getElement("reject").disabled = false;
            DOM.getElement("cancel").disabled = true;
            pending = null;
            return result;
        });
    }
    Signal.connect("resolve", "onclick", function () { runPromise(false); });
    Signal.connect("reject", "onclick", function () { runPromise(true); });
    Signal.connect("cancel", "onclick", function () { if (pending) { pending.cancel(); } });

    Signal.connect("key-input", "onkeydown", function (event) {
        DOM.replaceChildNodes("key-status", "key=" + event.keyName() +
            "; repeat=" + event.repeat() + "; composing=" + event.isComposing());
    });
    Signal.connect("pointer-area", "onpointermove", function (event) {
        var pointer = event.pointer();
        if (pointer) {
            DOM.replaceChildNodes("pointer-status", pointer.type + " #" + pointer.id +
                " at " + pointer.client.x + ", " + pointer.client.y + "; buttons=" + pointer.buttons);
        }
    }, {passive: true});
    Signal.connect("pointer-area", "onclick", function (event) {
        DOM.replaceChildNodes("capture-status", "Captured " + event.target().id +
            "; detail=" + event.detail() + "; trusted=" + event.isTrusted() +
            "; defaultPrevented=" + event.defaultPrevented());
    }, {capture: true});
    Signal.connect(window, "onpageshow", function (event) {
        DOM.replaceChildNodes("page-status", "Restored from page cache: " + event.persisted());
    });

    Signal.connect("drag-item", "ondragstart", function (event) {
        event.dataTransfer().setData("text/plain", "MochiKit drag data");
    });
    Signal.connect("drop-zone", "ondragover", function (event) {
        event.preventDefault(); // Allow dropping; this listener must not be passive.
    }, {passive: false});
    Signal.connect("drop-zone", "ondrop", function (event) {
        event.preventDefault();
        DOM.replaceChildNodes("drop-status", event.dataTransfer().getData("text/plain"));
    }, {passive: false});

    var once = Signal.connect("stop-once", "onclick", function (event) {
        Signal.disconnect(once);
        event.stopImmediatePropagation();
        DOM.replaceChildNodes("stop-status", "First listener ran; later listener skipped.");
    });
    Signal.connect("stop-once", "onclick", function () {
        DOM.replaceChildNodes("stop-status", "Second listener ran.");
    });
}());
