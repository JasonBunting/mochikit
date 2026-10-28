.. title:: MochiKit Documentation Index

Distribution
============

**This is Jason Bunting's modified fork of MochiKit.** It includes SVG and
HTML helpers, Promise adaptation, and modern event APIs beyond upstream.
The module version remains 1.5; use the fork revision to identify your code.

Start with the `fork README <../../../README.md>`_, the
`examples <../../../examples/index.html>`_, or the
`customizer <../../../packed/MochiKit/customize.html>`_.
Both ``MochiKit/`` source modules and the regenerated ``packed/`` bundle
include these additions. The customizer uses this checkout's bundle.

Module reference

- :mochiref:`MochiKit.Async` - manage asynchronous tasks
- :mochiref:`MochiKit.Base` - functional programming and useful comparisons
- :mochiref:`MochiKit.DOM` - painless DOM manipulation API
- :mochiref:`MochiKit.DragAndDrop` - drag and drop
- :mochiref:`MochiKit.Color` - color abstraction with CSS3 support
- :mochiref:`MochiKit.DateTime` - "what time is it anyway?"
- :mochiref:`MochiKit.Format` - string formatting goes here
- :mochiref:`MochiKit.Iter` - itertools for JavaScript; iteration made HARD,
  and then easy
- :mochiref:`MochiKit.Logging` - we're all tired of ``alert()``
- :mochiref:`MochiKit.LoggingPane` - interactive :mochiref:`MochiKit.Logging`
  pane
- :mochiref:`MochiKit.Selector` - selecting elements by CSS selector syntax
- :mochiref:`MochiKit.Signal` - simple universal event handling
- :mochiref:`MochiKit.Style` - painless CSS manipulation API
- :mochiref:`MochiKit.Sortable` - sortable
- :mochiref:`MochiKit.Text` - string formatting and helper functions
- :mochiref:`MochiKit.Visual` - visual effects


Notes
=====

To turn off MochiKit's export feature (which may be necessary for
compatibility with some existing code), do this before loading
MochiKit::

    <script type="text/javascript">MochiKit = {__export__: false};</script>

When export mode is off, you must use fully qualified names for
all MochiKit functions (e.g. ``MochiKit.Base.map(...)``).


Project links
=============

- `Fork repository <https://github.com/JasonBunting/mochikit>`_
- `Fork issue tracker <https://github.com/JasonBunting/mochikit/issues>`_
- `Original project <https://github.com/mochi/mochikit>`_
- `Upstream documentation <https://mochi.github.io/mochikit/>`_ (original APIs)

The domain ``mochikit.com`` is no longer affiliated with MochiKit or its
maintainers. The old Trac tracker and wiki are not support channels for this fork.


Version History
===============

.. include:: VersionHistory.rst


Copyright
=========

Copyright 2005-2008 Bob Ippolito <bob@redivi.com>. This program is
dual-licensed free software; you can redistribute it and/or modify it
under the terms of the `MIT License`_ or the `Academic Free License
v2.1`_.

.. _`MIT License`: http://www.opensource.org/licenses/mit-license.php
.. _`Academic Free License v2.1`: http://www.opensource.org/licenses/afl-2.1.php
