# PostgREST documentation https://postgrest.org/

PostgREST docs use the reStructuredText format, check this [cheatsheet](https://github.com/ralsina/rst-cheatsheet/blob/master/rst-cheatsheet.rst) to get acquainted with it.

To build the docs locally, see [the Nix development readme](/nix/README.md#documentation).

## Documentation structure

This documentation is structured according to tutorials-howtos-topics-references. For more details on the rationale of this structure, 
see https://www.divio.com/blog/documentation.

## Translating

To create `.po` files for translation into a new language pass the language code as the first argument to `postgrest-docs-build`.

Example to add German/de:

```
postgrest-docs-build de
```

The livereload server also supports a language/locale argument to show the translated docs during translation:

```
postgrest-docs-serve de
```

Spellcheck is currently only available for the default language.
