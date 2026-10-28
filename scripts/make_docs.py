#!/usr/bin/env python3
"""Render all API documentation, or use --check to detect stale HTML."""
import argparse
from pathlib import Path
import sys

try:
    from docutils import nodes, utils
    from docutils.core import publish_parts
    from docutils.parsers.rst import roles
except ImportError:
    sys.exit('Install the documentation dependency: python -m pip install -r requirements-docs.txt')

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = '''%(html_prolog)s
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
%(html_head)s
<link rel="stylesheet" href="../../../include/css/documentation.css" type="text/css" />
<script type="text/javascript" src="../../../packed/MochiKit/MochiKit.js"></script>
<script type="text/javascript" src="../../js/toc.js"></script>
</head>
<body>
<a href="../../../index.html"><img id="mainlink" src="../../../include/img/g_logo_doc.gif" alt="MochiKit fork home" /></a>
<p class="fork-notice"><strong>Jason Bunting's MochiKit fork.</strong>
These docs include changes beyond the original project.
<a href="../../../README.md">Fork overview</a> ·
<a href="../../../examples/index.html">Examples</a> ·
<a href="https://github.com/JasonBunting/mochikit/issues">Report an issue</a></p>
%(index_link)s
%(html_body)s
</body>
</html>
'''


def mochi_name(text):
    name = text.split('(', 1)[0].split()[0]
    base = ''
    if name.startswith('MochiKit.'):
        parts = name.split('.')
        base = parts[1] + '.html'
        if parts[-1] in ('call', 'apply'):
            parts.pop()
        name = '.'.join(parts[2:])
    return base, name


def role_mochiref(role, rawtext, text, lineno, inliner, options=None, content=None):
    options = dict(options or {})
    base, name = mochi_name(text)
    ref = base + ('#fn-' + name.lower() if name else '')
    roles.set_classes(options)
    options.setdefault('classes', []).append('mochiref')
    return [nodes.reference(text, utils.unescape(text), refuri=ref, **options)], []


def role_mochidef(role, rawtext, text, lineno, inliner, options=None, content=None):
    options = dict(options or {})
    base, name = mochi_name(text)
    assert not base
    ref = 'fn-' + utils.unescape(name.lower())
    anchor = nodes.raw('', '<a id="%s" name="%s"></a>' % (ref, ref), format='html')
    roles.set_classes(options)
    options.setdefault('classes', []).append('mochidef')
    return [anchor, nodes.reference(text, utils.unescape(text), refuri='#' + ref, **options)], []


roles.register_canonical_role('mochiref', role_mochiref)
roles.register_canonical_role('mochidef', role_mochidef)


def render(source, destination):
    parts = publish_parts(
        source_path=str(source), source=source.read_text(encoding='utf-8'),
        destination_path=str(destination), writer_name='html4css1',
        settings_overrides={
            'embed_stylesheet': False, 'stylesheet_path': None, 'stylesheet': '',
            'output_encoding': 'unicode', 'halt_level': 2,
            'syntax_highlight': 'none',
        },
    )
    parts['index_link'] = (
        '<a class="indexlink" href="index.html">Back to docs index</a>'
        if source.stem != 'index' else ''
    )
    parts['html_prolog'] = parts['html_prolog'].replace('encoding="%s"', 'encoding="utf-8"')
    parts['html_head'] = parts['html_head'].replace('charset=%s', 'charset=utf-8')
    return TEMPLATE % parts


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='check content without writing files')
    args = parser.parse_args(argv)
    rendered = []
    for source in sorted((ROOT / 'doc' / 'rst').rglob('*.rst')):
        destination = ROOT / 'doc' / 'html' / source.relative_to(ROOT / 'doc' / 'rst').with_suffix('.html')
        rendered.append((destination, render(source, destination)))
    stale = []
    for destination, html in rendered:
        if not destination.exists() or destination.read_text(encoding='utf-8') != html:
            stale.append(destination.relative_to(ROOT).as_posix())
            if not args.check:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text(html, encoding='utf-8', newline='\n')
    if args.check and stale:
        print('Stale documentation: ' + ', '.join(stale), file=sys.stderr)
        print('Run: python scripts/make_docs.py', file=sys.stderr)
        return 1
    print(('Checked' if args.check else 'Rendered') + ' %d documentation pages.' % len(rendered))
    return 0


if __name__ == '__main__':
    sys.exit(main())
