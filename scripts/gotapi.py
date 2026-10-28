#!/usr/bin/env python3
"""Emit the legacy API-index XML with local links (or --base-url SITE_ROOT)."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent


class Definitions(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'mochidef' in attrs.get('class', '').split():
            self.current = [attrs['href'], []]

    def handle_data(self, data):
        if self.current is not None:
            self.current[1].append(data)

    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.items.append((self.current[0], ''.join(self.current[1])))
            self.current = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='', help='optional URL of a hosted checkout, ending in /')
    args = parser.parse_args()
    loader = (ROOT / 'MochiKit' / 'MochiKit.js').read_text(encoding='utf-8')
    names = re.search(r'MochiKit.MochiKit.SUBMODULES\s*=\s*\[([^\]]+)', loader).group(1)
    root = ET.Element('pages')
    for module in re.findall(r'[\'"]([^\'"]+)[\'"]', names):
        filename = 'doc/html/MochiKit/' + module + '.html'
        definitions = Definitions()
        definitions.feed((ROOT / filename).read_text(encoding='utf-8'))
        url = urljoin(args.base_url.rstrip('/') + '/' if args.base_url else '', filename)
        page = ET.SubElement(root, 'page', title='MochiKit.' + module, type='package', url=url)
        for anchor, title in definitions.items:
            ET.SubElement(page, 'page', title=title, type='method', url=url + anchor)
    ET.indent(root)
    sys.stdout.buffer.write(ET.tostring(root, encoding='utf-8', xml_declaration=True) + b'\n')


if __name__ == '__main__':
    main()
