# MochiKit, or rather, a fork thereof...

**This repository is a modified fork of [mochi/mochikit](https://github.com/mochi/mochikit), _not_ an official upstream release.** It adds SVG and HTML element helpers, Promise-to-Deferred integration, modern event handling, and test updates. Code written against these additions requires this fork; it will not work unchanged with the original MochiKit distribution.

MochiKit is a suite of JavaScript libraries for DOM construction, asynchronous programming, events, iteration, formatting, and browser UI work. This fork updates selected parts of that toolkit for modern web application development while preserving its familiar programming style and existing APIs where possible.

- **This fork:** [JasonBunting/mochikit](https://github.com/JasonBunting/mochikit)
- **Original project:** [mochi/mochikit](https://github.com/mochi/mochikit)
- **Upstream documentation:** [mochi.github.io/mochikit](https://mochi.github.io/mochikit/) — useful for the original APIs, but does not document this fork's additions.

## Changes since the fork

The changes below cover the seven implementation commits from September–October 2026, following upstream commit [`aea6d58`](https://github.com/mochi/mochikit/commit/aea6d5861705816257c343b27c8086d836a1b0a2) (January 6, 2022), through fork commit [`566426e`](https://github.com/JasonBunting/mochikit/commit/566426e85330609f0a661634a01edcf22cd77c1e). See the [full implementation comparison](https://github.com/JasonBunting/mochikit/compare/aea6d5861705816257c343b27c8086d836a1b0a2...566426e85330609f0a661634a01edcf22cd77c1e).

Subsequent maintenance brings the packed bundle, generated documentation, examples, and Python build tools into sync with those APIs. The [version history](doc/html/MochiKit/VersionHistory.html) records both the feature changes and this maintenance work.

The example audit also uncovered sortable-tree bugs: text and comment nodes before a nested list caused an exception, and serialization could repeat nested items as root siblings. Traversal now skips non-element nodes and visits each list level once, with regression coverage in the drag-and-drop suite.

### SVG construction in MochiKit.DOM

Added `createSVG(name, attrs, ...children)` and `createSVGFunc(tag, ...)`, plus these convenience constructors:

- `SVG` for the root `<svg>` element.
- `SVG.CIRCLE`, `SVG.G`, `SVG.IMAGE`, `SVG.LINE`, `SVG.PATH`, `SVG.POLYGON`, `SVG.RECT`, and `SVG.TEXT` for child elements.

**Why:** SVG elements need the SVG namespace. These helpers use `createElementNS()` while retaining MochiKit's attribute handling and child-node coercion, so SVG can be composed in the same style as HTML. SVG creation has its own path, leaving the existing `createDOM()` behavior intact. Grouping child constructors under `SVG` keeps the namespace tidy and follows MochiKit's namespace conventions.

```javascript
var DOM = MochiKit.DOM;
var drawing = DOM.SVG(
    {viewBox: "0 0 120 60", width: 240, height: 120},
    DOM.SVG.RECT({x: 5, y: 5, width: 110, height: 50, fill: "steelblue"}),
    DOM.SVG.TEXT({x: 15, y: 35, fill: "white"}, "MochiKit")
);
DOM.appendChildNodes(document.body, drawing);
```

Use `createSVG()` for tags without a convenience constructor. The first SVG commit used flat names such as `SVG_RECT`; those were replaced with `SVG.RECT` and are not retained as aliases.

### Additional HTML constructors

Added `MochiKit.DOM.ABBR`, `CODE`, `EM`, `KBD`, `SMALL`, `SUB`, `SUP`, and `TIME`.

**Why:** These additions extend the existing HTML constructor convention to more semantic and inline elements, avoiding repeated calls to `createDOM()` for common markup. They use the same attributes-and-children calling convention as existing helpers such as `DIV` and `SPAN`.

### Promise integration with MochiKit.Async

Added `MochiKit.Async.fromPromise(promise)`, which accepts a JavaScript Promise or thenable and returns a MochiKit `Deferred`.

**Why:** Modern asynchronous APIs return Promises, while existing MochiKit code uses Deferred callback and errback chains. The adapter lets Promise results enter those chains without rewriting the surrounding code.

```javascript
var deferred = MochiKit.Async.fromPromise(Promise.resolve("Ready"));
deferred.addCallback(function (value) {
    return value + "!";
});
```

The adapter preserves Deferred semantics:

- Fulfillment enters the callback chain; rejection enters the errback chain.
- Non-`Error` rejection reasons are wrapped in `MochiKit.Async.GenericError`.
- Invalid input without a callable `then` throws `TypeError`.
- Cancelling the returned Deferred does not cancel the underlying Promise. Later settlement is ignored.
- Fulfillment with a Deferred is unsupported and reaches the errback chain as a `TypeError`. To chain another Deferred, return it from an `addCallback()` handler instead.

The October follow-up fixed Deferred-valued fulfillment and rejection edge cases so the adapter reports errors through the expected errback path instead of leaving the result pending or mishandling the rejection reason.

### Passive and capture listeners in MochiKit.Signal

`connect()` and `connectOnce()` now accept a final options object for DOM listeners:

```javascript
var listener = MochiKit.Signal.connect(
    document, "ontouchmove", function (event) {
        // Observe movement without cancelling the browser's default action.
    }, {passive: true, capture: true}
);

MochiKit.Signal.disconnect(listener);
```

For an object-and-method connection, pass the options as the fifth argument: `connect(element, "onclick", controller, "handleClick", {capture: true})`.

**Why:** Modern event handling needs control over the capture phase and whether a listener may cancel a browser action. These options expose that control through MochiKit's existing connection API and preserve its disconnection bookkeeping.

- `capture` defaults to `false` and is remembered for disconnection, even if the caller later mutates the options object.
- `passive: true` declares that the listener will not cancel the event. `preventDefault()` and the prevention part of `stop()` cannot cancel it. Explicit `false` requests a non-passive listener; omitting it leaves the browser default in effect.
- `connectOnce()` applies the same options to its cleanup listener.
- Browsers without passive-listener support fall back to the capture boolean. The legacy `attachEvent` path ignores both options.
- Native `once` and `signal` options are rejected because native automatic removal would bypass MochiKit's bookkeeping. Use `connectOnce()` or `disconnect()` instead.

Existing calls without options and non-DOM signal handling retain their prior behavior. A follow-up also fixed emulated `mouseenter`/`mouseleave` handling in capture mode: it no longer stops native events before they can reach descendant elements.

### More information on wrapped events

Added the following methods to `MochiKit.Signal.Event`:

| Methods | What they expose and why |
| --- | --- |
| `keyName()`, `isComposing()`, `repeat()` | The native, layout-aware key value, composition state, and key-repeat state, for handling modern keyboard input. |
| `pointer()` | Pointer identity, device type, primary status, buttons, and client/page coordinates for pointer events and pointer-capture events. |
| `dataTransfer()` | Native drag-and-drop data access. |
| `detail()`, `isTrusted()`, `defaultPrevented()`, `persisted()` | Native event detail, trust status, cancellation state, and page-transition persistence information. |
| `stopImmediatePropagation()` | Stops later listeners in the current native listener invocation as well as propagation, when supported by the browser. |

**Why:** These methods make modern event information available through the MochiKit wrapper while preserving the established behavior of `key()`, `mouse()`, and `stop()`.

The native-property accessors return `undefined` when the browser does not supply the property; they do not polyfill browser capabilities. `pointer()` returns `undefined` for other event types, including `click`. `stopImmediatePropagation()` does not prevent the default action, and its legacy fallback to `stopPropagation()` cannot suppress other listeners on the same node.

**One-shot listener caveat:** Do not call `stopImmediatePropagation()` inside a `connectOnce()` handler. It can suppress that helper's separate cleanup listener. Use `connect()` and explicitly disconnect the returned identifier before stopping immediate propagation.

### Tests and documentation

Regression coverage was added for SVG construction, Promise adaptation and cancellation, listener options, event accessors, and capture-mode mouse enter/leave behavior. The relevant API source documentation was expanded alongside those changes.

The existing test harness was also adjusted:

- Selected layout assertions use a one-pixel tolerance instead of exact equality to accommodate browser rendering differences.
- The XHR array-buffer test accepts both LF and CRLF endings in its JSON fixture, avoiding failures caused by checkout line endings.
- The scope-leak filter recognizes a Chromium event-listener helper that can appear after the initial global-scope snapshot.

**Why:** These changes keep the tests useful across modern browsers and checkout environments without treating small layout differences or fixture line endings as library regressions. They change test expectations and utilities, not the production Style implementation.

The October 27, 2026 implementation commit records all **15 suites and 1,542 assertions passing in both Chrome and Firefox**. This is a historical validation result, not a guarantee for every browser or version.

## Using this fork

Use either the individual source files in [`MochiKit/`](MochiKit/) or the generated all-in-one bundle in [`packed/MochiKit/MochiKit.js`](packed/MochiKit/MochiKit.js). Both include this fork's additions. Module version strings still report `1.5`, so the version string alone does not identify this fork; record the Git revision you use.

Clone this repository and serve or copy its `MochiKit/` directory into your application. No build step is needed to use the source scripts. For an ordinary HTML page, include the loader before your application code:

```html
<script src="MochiKit/MochiKit.js"></script>
<script>
    MochiKit.DOM.appendChildNodes(
        document.body,
        MochiKit.DOM.P(null, "Running the MochiKit fork.")
    );
</script>
```

Place this example inside the page's `<body>`. The loader loads its sibling modules using `document.write()`, so load it synchronously during HTML parsing, without `async`, `defer`, or `type="module"`. You can also load individual source files in dependency order. The repository retains its classic script-based structure; it does not provide an npm package manifest or ES module entry point.

To load the packed bundle instead, replace the loader tag with:

```html
<script src="packed/MochiKit/MochiKit.js"></script>
```

The bundle contains all modules and does not load sibling scripts. Keep application code after it. The [browser customizer](packed/MochiKit/customize.html), served over HTTP, creates a downloadable subset from this checkout's packed bundle; it does not fetch upstream builds.

### Maintaining the packed bundle

After changing JavaScript in `MochiKit/`, regenerate and commit the packed bundle alongside the source changes. The packer requires **Python 3.10+** and **Java on PATH** and uses the Rhino compressor already included in `scripts/custom_rhino.jar`:

```sh
python scripts/pack.py
python scripts/pack.py --check
```

`--check` rebuilds in memory and exits with a failure if the checked-in bundle is stale, without modifying it. A failed compilation leaves the existing bundle intact. The output is normalized to LF line endings; the check also accepts CRLF checkouts.

For a custom bundle, supply module names in dependency order. Output goes to standard output instead of replacing the full bundle:

```sh
python scripts/pack.py Base Async > MochiKit-async.js
```

Dependencies are not added automatically by this command; the browser customizer can manage module dependencies interactively. Use UTF-8 when saving redirected output in shells that re-encode text.

The packer's regression checks run with `python -B scripts/test_pack.py`. They cover failed compilation, stale-output detection, checkout line endings, and replacement of the generated file.

## Documentation and tests

For the fork's API details, start with the regenerated [documentation index](doc/html/MochiKit/index.html):

- [DOM API](doc/html/MochiKit/DOM.html)
- [Async API](doc/html/MochiKit/Async.html)
- [Signal API](doc/html/MochiKit/Signal.html)
- [Version history](doc/html/MochiKit/VersionHistory.html)

The [example index](examples/index.html) includes inherited demos and a [runnable fork example](examples/modern/index.html) for SVG, semantic HTML, Promise adaptation/cancellation, keyboard and pointer data, capture/passive listeners, drag data, and immediate propagation stopping. The existing keyboard and mouse examples also demonstrate the related fork additions.

To run the browser tests, serve the repository root over HTTP. For example, with Python 3 installed:

```sh
python scripts/serve.py
```

Open [the test runner](http://127.0.0.1:8000/tests/index.html) in a browser. It runs the 15 suites against the source modules. Stop the server and restart with `python scripts/serve.py --packed` to run the same suites against the packed bundle. The server substitutes the bundle when serving test HTML and leaves test files unchanged; `MockDOM.js` remains a separate test fixture. Use `--port 8001` to choose another port.

Use HTTP rather than opening files directly so asynchronous requests and the customizer can load their local resources. The server binds to `127.0.0.1`.

### Rebuilding documentation and distributions

The Python tools require Python 3.10+. Packing also needs Java on PATH. Install the pinned [Docutils renderer](https://pypi.org/project/docutils/0.21.2/) in a virtual environment for reproducible HTML:

```sh
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements-docs.txt
python scripts/make_docs.py
python scripts/make_docs.py --check
```

Edit the reStructuredText files in [`doc/rst/MochiKit/`](doc/rst/MochiKit/) and the template in [`scripts/make_docs.py`](scripts/make_docs.py), then regenerate and commit the HTML. Generation checks all pages, including included release notes and template changes; it does not rely on file modification times.

To regenerate both documentation and packed JavaScript and create a distribution:

```sh
python scripts/build.py
python scripts/build.py --check
python -B -m unittest discover -s scripts -p "test_*.py"
python scripts/check_links.py
```

The archive is written to `dist/MochiKit-1.5-jasonbunting.zip`, with a fork-specific name, metadata, manifest, license, examples, tests, and build tools. It preserves repository paths instead of moving source files into `lib/`, so the documented commands and local links also work after extraction. Build outputs and the virtual environment are excluded from the archive. `build.py --check` verifies generated docs and JavaScript without writing an archive.

The optional `python scripts/gotapi.py` command emits the legacy API-index XML with relative documentation links. Use `--base-url https://your-host/path/` to target a hosted checkout; it no longer assumes the upstream site contains the fork's APIs.

## Reporting issues

Report problems with these additions in [this fork's issue tracker](https://github.com/JasonBunting/mochikit/issues). Include the Git revision, browser/version, and a minimal reproduction, and indicate whether you loaded source or packed files.

## Credits and license

MochiKit was created by Bob Ippolito and developed by its upstream contributors. This fork builds on their work, with the changes described above maintained by Jason Bunting.

MochiKit is dual-licensed under the MIT License or the Academic Free License 2.1. [`LICENSE.txt`](LICENSE.txt) contains the full terms and the BSD notice for code adapted from Yahoo's DOM utilities.

The original project's notice still applies: **mochikit.com is no longer affiliated with MochiKit or its maintainers.** Use the [upstream GitHub Pages documentation](https://mochi.github.io/mochikit/) and the repositories linked above.
