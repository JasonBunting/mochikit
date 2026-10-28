#!/usr/bin/env python3
"""Check local files and anchors linked by first-party docs and examples."""
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.links = []
        self.anchors = set()
        self.feed(path.read_text(encoding='utf-8-sig'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ('id', 'name'):
            if attr in attrs:
                self.anchors.add(attrs[attr])
        for attr in ('href', 'src'):
            if attrs.get(attr):
                self.links.append(attrs[attr])


def check(root=ROOT):
    files = (list((root / 'doc/html').rglob('*.html'))
             + list((root / 'examples').glob('*/*.html'))
             + [root / 'examples/index.html', root / 'index.html',
                root / 'packed/MochiKit/customize.html'])
    cache = {path.resolve(): Page(path) for path in files}
    errors = []
    for path, page in list(cache.items()):
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or link == '#':
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            reason = None
            if not target.exists():
                reason = 'missing file'
            elif url.fragment and target.suffix == '.html':
                if target not in cache:
                    cache[target] = Page(target)
                if unquote(url.fragment) not in cache[target].anchors:
                    reason = 'missing anchor'
            if reason:
                errors.append('%s: %s (%s)' % (path.relative_to(root), link, reason))
    return len(files), errors


if __name__ == '__main__':
    count, errors = check()
    for error in errors:
        print(error, file=sys.stderr)
    print('Checked %d HTML pages; %d broken local links.' % (count, len(errors)))
    sys.exit(1 if errors else 0)
