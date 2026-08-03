import unittest
import os
import importlib.util

spec = importlib.util.spec_from_file_location("env_document", os.path.join(os.path.dirname(__file__), "env-document.py"))
env_document = importlib.util.module_from_spec(spec)
spec.loader.exec_module(env_document)
EnvDocument = env_document.EnvDocument

class TestEnvDocument(unittest.TestCase):
    def test_parse_and_get(self):
        doc = EnvDocument("FOO=bar\n# comment\nBAZ=qux\n")
        self.assertEqual(doc.get("FOO"), "bar")
        self.assertEqual(doc.get("BAZ"), "qux")
        self.assertIsNone(doc.get("NOT_FOUND"))

    def test_set_existing(self):
        doc = EnvDocument("FOO=bar\n")
        doc.set("FOO", "baz")
        self.assertEqual(doc.get("FOO"), "baz")
        self.assertEqual(doc.to_string(), "FOO=baz\n")

    def test_set_new(self):
        doc = EnvDocument("FOO=bar\n")
        doc.set("BAZ", "qux")
        self.assertEqual(doc.get("BAZ"), "qux")
        self.assertEqual(doc.to_string(), "FOO=bar\nBAZ=qux\n")

    def test_delete(self):
        doc = EnvDocument("FOO=bar\nBAZ=qux\n")
        doc.delete("FOO")
        self.assertIsNone(doc.get("FOO"))
        self.assertEqual(doc.to_string(), "BAZ=qux\n")

    def test_quotes(self):
        doc = EnvDocument('FOO="bar baz"\n')
        self.assertEqual(doc.get("FOO"), "bar baz")
        doc.set("FOO", 'qux "qoo"')
        self.assertEqual(doc.to_string(), 'FOO="qux \\"qoo\\""\n')

if __name__ == '__main__':
    unittest.main()
