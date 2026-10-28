"""Regression checks for documentation, archives, and packed-test serving."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


build = load('build')
serve = load('serve')
make_docs = load('make_docs')
gotapi = load('gotapi')


class MaintenanceTests(unittest.TestCase):
    def test_distribution_preserves_paths_and_excludes_private_or_generated_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            paths = ['MochiKit/Base.js', 'packed/MochiKit/MochiKit.js', 'doc/html/MochiKit/index.html',
                     'scripts/build.py', 'scripts/__pycache__/build.pyc', 'scripts/.secret',
                     '.git/config', '.venv/settings', 'dist/old.zip', 'unrelated.txt']
            for name in paths:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('fixture', encoding='utf-8')
            for name in build.ROOT_FILES:
                (root / name).write_text('fixture', encoding='utf-8')
            with patch.object(build, 'ROOT', root):
                names = {path.relative_to(root).as_posix() for path in build.distribution_files()}
            self.assertIn('MochiKit/Base.js', names)
            self.assertIn('packed/MochiKit/MochiKit.js', names)
            self.assertIn('scripts/build.py', names)
            self.assertEqual(names, set(paths[:4]) | set(build.ROOT_FILES))

    def test_packed_tests_load_bundle_once_and_keep_mock_fixture(self):
        html = ('<script src="../MochiKit/MockDOM.js"></script>'
                '<script src="../MochiKit/Base.js"></script>'
                '<script src="../MochiKit/DOM.js"></script>'
                '<script src="test_Signal.js"></script>')
        result = serve.packed_test_html(html)
        self.assertEqual(result.count('/packed/MochiKit/MochiKit.js'), 1)
        self.assertIn('../MochiKit/MockDOM.js', result)
        self.assertIn('test_Signal.js', result)
        self.assertNotIn('../MochiKit/Base.js', result)
        self.assertNotIn('../MochiKit/DOM.js', result)

    def test_docs_render_includes_and_template_changes_without_timestamp_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'index.rst'
            included = root / 'Changes.rst'
            source.write_text('Title\n=====\n\n.. include:: Changes.rst\n', encoding='utf-8')
            included.write_text('First revision.\n', encoding='utf-8')
            first = make_docs.render(source, root / 'index.html')
            included.write_text('Second revision.\n', encoding='utf-8')
            second = make_docs.render(source, root / 'index.html')
            self.assertIn('First revision.', first)
            self.assertIn('Second revision.', second)
            self.assertNotIn('charset=%s', second)
            self.assertNotIn('encoding="%s"', second)
            with patch.object(make_docs, 'TEMPLATE', make_docs.TEMPLATE + 'template update'):
                self.assertIn('template update', make_docs.render(source, root / 'index.html'))

    def test_api_index_keeps_nested_definition_text(self):
        parser = gotapi.Definitions()
        parser.feed('<a class="mochidef reference external" href="#fn-frompromise">'
                    '<span>fromPromise</span>(promise)</a>')
        self.assertEqual(parser.items, [('#fn-frompromise', 'fromPromise(promise)')])


if __name__ == '__main__':
    unittest.main()
