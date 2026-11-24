---
name: reference-beta
description: Convert a project's API surface (library, CLI, or OpenAPI spec) into one Markdown file per definition with YAML frontmatter that follows the docs `reference-beta` schema, and add a check script that validates the output. Language-agnostic; use it when onboarding a library, CLI, or HTTP API to the reference-beta docs route.
---

# Reference-beta definitions

The docs `reference-beta` route renders reference pages from **one Markdown file per definition**. Each file is YAML frontmatter holding the whole definition, plus optional Markdown notes. This guide shows how to build, in any language:

1. a **generate** script that turns your source of truth (code docs, CLI command tree, OpenAPI) into those files, and
2. a **check** script that proves the files comply with the docs schema.

The generator and the checker are separate programs. The checker must not trust the generator.

## Example prompt

Run this inside your library's repository, in a coding agent that has this skill loaded. Adjust the tags to the ones your doc comments use:

```text
Use the reference-beta skill to onboard this library to the docs reference-beta route.

Our doc comments use these tags:
- @category <name> marks a symbol as documented and sets its category
- @subcategory <name> puts it in a sub-group of that category
- @param, @returns, @throws, @example, @deprecated for the rest

Readers already know our current reference, e.g.
https://supabase.com/docs/reference/javascript/select. Keep its groups. That
page builds its sidebar in the browser, so read the data behind it instead:
https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/spec/common-client-libs-sections.json
- top-level titles (Database, Auth, ...) are the `@category` values
- titles of nested groups (e.g. "Using filters" with eq, neq, ...) are the
  `@subcategory` values
- match each symbol to an entry by its `id` (eq, select, ...), not by its
  friendly title ("Column is equal to a value")
Add the matching `@category` and `@subcategory` tags to the doc comments, so the
source stays the single source of truth. List every symbol with no match so I
can decide where it goes.

1. Add a generate script that writes one definition per documented symbol to
   docs/reference-beta/definitions, and a check script that validates them
   against a vendored copy of definition.schema.json. Wire them up as
   `docs:reference-beta` and `docs:check`.
2. Run both. Compare the file count with the number of documented symbols.
3. Break one file on purpose to prove the check fails, then regenerate.
4. Show me three generated files and the frontmatter they came from.
```

The reference lines in the prompt are optional, and only help for a library that already has pages in the current reference. They give the agent the **names and membership** of the groups, not a rule for deriving them: those groups are curated by hand in that file, so there is no criterion to extract. Drop the lines for a new library, and expect to review the symbols the agent could not match. The example below uses `Filters`, while the current reference calls the same group "Using filters". Keep the existing name if you want readers to find the same group.

To see how a comment maps to the schema, take this one:

````ts
/**
 * Match only rows where every element appearing in `column` is contained by
 * `value`. Only relevant for jsonb, array, and range columns.
 *
 * @category Database
 * @subcategory Filters
 * @param column - The jsonb, array, or range column to filter on.
 * @param value - The jsonb, array, or range value to filter with.
 * @example Filter rows by an array column
 * ```ts
 * const { data } = await supabase.from('posts').select().containedBy('tags', ['sql', 'auth'])
 * ```
 */
containedBy(column: string, value: string | unknown[] | object): this
````

It should produce `docs/reference-beta/definitions/postgrest-filter-builder-contained-by.md`:

```markdown
---
id: postgrest-filter-builder-contained-by
kind: method
category: Database
subcategory: Filters
title: containedBy
symbol: PostgrestFilterBuilder.containedBy
summary: Match only rows where every element appearing in `column` is contained by `value`. Only relevant for jsonb, array, and range columns.
signature: 'containedBy(column: string, value: string | unknown[] | object): this'
stability: stable
deprecated: false
parameters:
  - name: column
    location: argument
    type: string
    required: true
    description: The jsonb, array, or range column to filter on.
  - name: value
    location: argument
    type: string | unknown[] | object
    required: true
    description: The jsonb, array, or range value to filter with.
returns: { type: this }
examples:
  - id: filter-rows-by-an-array-column
    title: Filter rows by an array column
    lang: ts
    code: |
      const { data } = await supabase.from('posts').select().containedBy('tags', ['sql', 'auth'])
---
```

In the docs sidebar this definition shows under **Database**, inside a **Filters** group. See "Categories and subcategories" for how groups behave.

## 1. The output contract

```
<docs>/reference-beta/
├── definition.schema.json     # vendored copy of the docs schema (section 2)
└── definitions/
    ├── <id>.md                # one file per definition; file name == frontmatter `id`
    └── ...
```

A definition file:

```markdown
---
id: auth-signup
kind: method
category: auth
title: signUp
symbol: supabase.auth.signUp
summary: Creates a new user.
description: Creates a new user. Supports PKCE for email sign-ups.
signature: 'signUp(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse>'
stability: stable
deprecated: false
parameters:
  - name: credentials
    location: argument
    type: SignUpWithPasswordCredentials
    required: true
    description: Email or phone, a password, and optional sign-up options.
    children: [] # nested fields, same shape
returns: { type: 'Promise<AuthResponse>', description: '...' }
throws: []
examples:
  - id: sign-up
    title: Sign up with an email and password
    lang: js
    code: |
      const { data, error } = await supabase.auth.signUp({ ... })
---

Optional notes in Markdown (remarks, deprecation notice).
```

Rules that apply to every ecosystem:

- **Fully de-referenced.** A reader of one file needs nothing else: referenced option types, schemas and aliases are inlined as `children`/`properties`; links become names.
- **One file per definition**, named `<id>.md`.
- **Closed schema.** Unknown keys are rejected (`additionalProperties: false`). Never invent fields; fold extra information into `description` or the Markdown notes, or ask the docs team to extend the schema.
- **Deterministic output.** Same input, same bytes: sorted, no timestamps. The output directory is wiped and rewritten on every run so deleted definitions don't leave stale files.

## 2. The schema

Snapshot of `definition.schema.json` (JSON Schema draft 2020-12).

- Source: <https://github.com/supabase/supabase/blob/jeremias/reference-beta/apps/docs/content/reference-beta/definition.schema.json> (a temporary location)
- Fetched: 2026-11-24
- SHA-256 of the upstream file: `3a287f1094507663b0a22a9b62c41b899f0f41c8c09909b74213ef396e47a932`

This snapshot goes stale. Before starting, refetch it and compare:

```sh
curl -fsSL "https://raw.githubusercontent.com/supabase/supabase/jeremias/reference-beta/apps/docs/content/reference-beta/definition.schema.json" \
  -o docs/reference-beta/definition.schema.json
```

Commit the vendored copy next to the definitions and have the check script read that copy, never the network: the URL above is temporary and a check that needs the network fails unpredictably. When the docs schema changes, re-download and re-run the check. Formatting tools may reflow the JSON; that is fine, only the content matters.

```json
{
  "title": "Reference definition frontmatter",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "description": "Stable, shared across languages. Must match the file name.",
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "kind": {
      "type": "string",
      "enum": ["method", "command", "endpoint", "class", "type", "constant"]
    },
    "category": {
      "description": "Groups definitions in the navigation.",
      "default": "general",
      "type": "string"
    },
    "subcategory": {
      "description": "Groups definitions within their category, as a sub-group in the navigation.",
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "symbol": {
      "description": "Fully qualified name, e.g. `supabase.auth.signUp`.",
      "type": "string"
    },
    "summary": {
      "description": "One line, used in lists.",
      "type": "string"
    },
    "description": {
      "description": "Markdown.",
      "type": "string"
    },
    "signature": {
      "description": "Methods, classes, types and constants.",
      "type": "string"
    },
    "usage": {
      "description": "Commands only.",
      "type": "string"
    },
    "http": {
      "description": "Endpoints only.",
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        }
      },
      "required": ["method", "path"],
      "additionalProperties": false
    },
    "type_params": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "stability": {
      "default": "stable",
      "type": "string",
      "enum": ["stable", "beta", "experimental"]
    },
    "deprecated": {
      "default": false,
      "type": "boolean"
    },
    "since": {
      "type": "string"
    },
    "requires": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "inherits_flags": {
      "description": "Commands that also accept a shared flag group.",
      "type": "string"
    },
    "auth": {
      "description": "Endpoints only.",
      "type": "object",
      "properties": {
        "scopes": {
          "default": [],
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "permissions": {
          "default": [],
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "parameters": {
      "description": "Arguments of methods, commands and endpoints; constructor arguments of classes.",
      "default": [],
      "type": "array",
      "items": {
        "$ref": "#/$defs/__schema0"
      }
    },
    "properties": {
      "description": "Members of classes and types. Same shape as parameters, `location: property`.",
      "default": [],
      "type": "array",
      "items": {
        "$ref": "#/$defs/__schema0"
      }
    },
    "returns": {
      "description": "Methods.",
      "type": "object",
      "properties": {
        "type": {
          "type": "string"
        },
        "description": {
          "type": "string"
        }
      },
      "required": ["type"],
      "additionalProperties": false
    },
    "responses": {
      "description": "Endpoints only.",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "status": {
            "type": "integer",
            "minimum": -9007199254740991,
            "maximum": 9007199254740991
          },
          "description": {
            "type": "string"
          },
          "schema": {}
        },
        "required": ["status"],
        "additionalProperties": false
      }
    },
    "throws": {
      "default": [],
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "description": "Error type. Omitted when only a description is given.",
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        },
        "additionalProperties": false
      }
    },
    "examples": {
      "default": [],
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "description": "Stable within the definition.",
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "description": "Markdown.",
            "type": "string"
          },
          "lang": {
            "description": "Code fence language, e.g. `js`, `sh`.",
            "default": "plaintext",
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "response": {
            "description": "Sample output.",
            "type": "string"
          }
        },
        "required": ["id", "title", "code"],
        "additionalProperties": false
      }
    }
  },
  "required": ["id", "kind", "title", "summary"],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "location": {
          "description": "Where the parameter is passed.",
          "type": "string",
          "enum": ["argument", "positional", "flag", "path", "query", "header", "body", "property"]
        },
        "type": {
          "type": "string"
        },
        "required": {
          "default": false,
          "type": "boolean"
        },
        "description": {
          "description": "Markdown.",
          "type": "string"
        },
        "default": {},
        "allowed_values": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              }
            ]
          }
        },
        "short": {
          "description": "Short flag, e.g. `-i`. Commands only.",
          "type": "string"
        },
        "env": {
          "description": "Environment variable that sets this parameter.",
          "type": "string"
        },
        "variadic": {
          "type": "boolean"
        },
        "deprecated": {
          "type": "boolean"
        },
        "replaced_by": {
          "type": "string"
        },
        "children": {
          "description": "Nested fields, same shape.",
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        }
      },
      "required": ["name"],
      "additionalProperties": false
    }
  }
}
```

### Which kind, which fields

| `kind`     | Use for                                                   | Fields that apply                                                                      |
| ---------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `method`   | functions and methods (including free functions)          | `signature`, `parameters` (`location: argument`), `returns`, `throws`, `examples`      |
| `class`    | classes, structs with behavior, error types               | `signature`, `parameters` (constructor args), `properties`, `examples`                 |
| `type`     | interfaces, type aliases, enums, structs, traits, schemas | `signature`, `properties` (`location: property`)                                       |
| `constant` | exported constants, error-code values, config maps        | `signature`, `properties` for object-like constants                                    |
| `command`  | one CLI command                                           | `usage`, `parameters` (`location: positional` or `flag`), `inherits_flags`, `examples` |
| `endpoint` | one HTTP operation                                        | `http`, `auth`, `parameters` (`path`/`query`/`header`/`body`), `responses`, `examples` |

Always required: `id`, `kind`, `title`, `summary`.

### Categories and subcategories

`category` groups definitions in the docs sidebar. `subcategory` is optional and splits a category further. Both normally come from doc tags on the symbol (Step 2):

```ts
/**
 * Matches rows whose column contains every element of the given value.
 *
 * @category Database
 * @subcategory Filters
 */
containedBy(column, value) {}
```

becomes this frontmatter:

```yaml
category: Database
subcategory: Filters
```

**Expected result.** On the library's pages the left sidebar lists one group per category, with sub-groups inside it:

```
Database                 <- category: the group heading
  select                 <- no subcategory: a plain link, listed first
  Filters                <- subcategory: a collapsible group
    containedBy
    eq
  Modifiers              <- another subcategory of Database
    order
Auth
  signUp
```

How it behaves:

- Definitions with the **same category and the same subcategory** share one group. The same subcategory name under two categories makes two separate groups.
- A definition **without** a subcategory is a plain link directly under its category, above that category's groups.
- Sub-groups are sorted alphabetically, and so are the definitions inside a group (by `title`). The docs team sets the order of the categories themselves in the library's `index.md`; categories it doesn't list follow alphabetically.
- There is **one level** of nesting. A subcategory can't contain further subcategories.
- **Always emit `category` when you emit `subcategory`.** A definition with only a subcategory falls back to the `general` category, which is rarely what you want.
- Labels are shown exactly as written when they contain a capital letter or a space (`Filters`, `Realtime channels`). An all-lowercase value is capitalized and its hyphens become spaces (`user-management` shows as "User management"). Prefer written-out labels.
- Neither field changes a definition's URL, which stays `/reference-beta/<library>/<id>`.

## 3. Build the generate script

Write it in the language your project already uses to build or document itself, so contributors don't need a new toolchain. It needs only: read a structured description of your API, write text files, and emit YAML.

### Step 1: Pick a machine-readable source of truth

Do not parse source code yourself. Use a tool that already understands the language and emits structured data, and read that.

| Project type  | Typical source of structured data                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| TypeScript    | TypeDoc JSON (`typedoc --json out.json`)                                                                            |
| Rust          | rustdoc JSON (nightly: `cargo +nightly rustdoc -- -Z unstable-options --output-format json`)                        |
| Python        | `griffe dump <package>` (JSON), or the `ast`/`inspect` modules                                                      |
| Go            | the `go/doc` and `go/packages` standard-library packages                                                            |
| Swift         | symbol graphs (`swift package dump-symbol-graph`)                                                                   |
| Java / Kotlin | a Javadoc doclet, or Dokka                                                                                          |
| Anything else | the language's doc tool's JSON/XML output, or a reflection API                                                      |
| CLI           | the command tree itself: your CLI framework's introspection (cobra, clap, click, commander, ...) or `--help` output |
| HTTP API      | the OpenAPI 3.x document (YAML or JSON)                                                                             |

Run the tool as the first step of the same command that runs your generator, so the JSON is never stale.

### Step 2: Decide what gets documented (opt-in, not opt-out)

Public export is not the same as documented. Use an explicit marker so adding a page is a deliberate act:

- **Libraries:** a doc tag on the symbol, e.g. `@category <name>`. Skip everything without it. This also drops re-exports, which have no comment of their own and are documented where they are defined. An optional `@subcategory <name>` next to it places the definition in a sub-group of its category (see "Categories and subcategories"); it never opts a symbol in on its own.
- **OpenAPI:** include operations that have at least one tag, and skip `x-internal: true`.
- **CLI:** include commands that are not hidden.

Also skip anything the doc tool already hides (`@hidden`/`@ignore`/private). `@internal`-style tags are only hidden if the doc tool is configured to exclude them, so check.

### Step 3: Map each definition to the schema

| Field            | Library (any language)                                             | CLI                                                                                           | OpenAPI                                                       |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `kind`           | `method` / `class` / `type` / `constant`                           | `command`                                                                                     | `endpoint`                                                    |
| `id`             | slug of `<module-path>-<name>`, e.g. `core-verify-credentials`     | command path: `db-push`                                                                       | `operationId`, else `<method>-<path>` slug                    |
| `category`       | the `@category` tag from Step 2                                    | command group / parent command                                                                | first tag                                                     |
| `subcategory`    | the optional `@subcategory` tag; omit the key when absent          | n/a                                                                                           | n/a                                                           |
| `title`          | bare name, **no `()`**                                             | command path without the binary: `db push`                                                    | `summary` or `operationId`                                    |
| `symbol`         | fully qualified name incl. package/module                          | full invocation: `supabase db push`                                                           | `POST /v1/projects`                                           |
| `summary`        | first paragraph of the doc comment, newlines collapsed to one line | short help                                                                                    | `summary`                                                     |
| `description`    | full doc comment as Markdown                                       | long help                                                                                     | `description`                                                 |
| `signature`      | the declaration as written in the language                         | _(use `usage`)_                                                                               | _(use `http`)_                                                |
| `usage` / `http` | n/a                                                                | usage line                                                                                    | `{ method, path }`                                            |
| `type_params`    | generic parameter names, when the language has generics            | n/a                                                                                           | n/a                                                           |
| `stability`      | from `beta`/`experimental`-style tags; default `stable`            | from a flag or annotation                                                                     | from an `x-` extension                                        |
| `deprecated`     | tag present → `true`. Put the message in the notes body            | same                                                                                          | `deprecated: true`                                            |
| `parameters`     | arguments, `location: argument`; constructor args for classes      | args `positional`, options `flag` (+ `short`, `env`, `default`, `allowed_values`, `variadic`) | `path`/`query`/`header`; request body as one `body` parameter |
| `properties`     | fields/members, `location: property`                               | n/a                                                                                           | n/a                                                           |
| `returns`        | `{ type, description }`                                            | n/a                                                                                           | use `responses`                                               |
| `responses`      | n/a                                                                | n/a                                                                                           | one per status code, `schema` fully inlined                   |
| `throws`         | `[{ type?, description }]` from the language's error docs          | n/a                                                                                           | n/a                                                           |
| `auth`           | n/a                                                                | n/a                                                                                           | scopes/permissions from `security`                            |
| `examples`       | doc-comment examples: `{ id, title, lang, code }`                  | usage examples                                                                                | request/response samples (`response` = sample output)         |

Details that bite:

- **`id` must match** `^[a-z0-9]+(?:-[a-z0-9]+)*$` and be unique across the whole folder. The same name can exist in several modules (adapters, versions), so always prefix the module path. Split camelCase (`verifyCredentials` → `verify-credentials`).
- **`subcategory` needs a `category`.** Fail generation (or at least warn) when a symbol has `@subcategory` but no `@category`, and omit the key rather than writing an empty string.
- **`required`** means "the caller must provide it". For function parameters, an optional marker or a default value makes it optional. For properties, a default/initializer is **not** an optional marker; only the language's optional marker is.
- **Overloads:** pick one signature deliberately (document the choice in the script) or emit separate definitions with distinct ids. Don't silently take the first.
- **Extra tags** that have no schema field (`@remarks`, deprecation text, default values you can't put in `default`) go in the Markdown notes after the frontmatter.
- **Examples:** `id` is unique within the definition (slug of the title); `lang` is the code fence language; keep `code` free of the surrounding fence.
- **Empty values** are fine for optional arrays; the `required` keys must have real content.

### Step 4: De-reference

Walk each parameter's/property's type. When it resolves to a user-defined structure, inline its members as `children` (same shape, recursively):

```
fields(type, seen):
    decl = resolve(type)            # follow aliases, re-exports, $ref
    if decl is None or decl in seen: return []      # external type, or cycle
    for member in decl.members:     # include inherited members
        yield { name, location, type: render(member.type),
                required, description,
                children: fields(member.type, seen + [decl]) }
```

- Resolve **aliases and re-exports** to the real declaration.
- The **cycle guard** (`seen`) is mandatory: self-referencing types otherwise recurse forever.
- Expand object-like types (interfaces, structs, object aliases, `allOf`/intersections merged). Leave unions, primitives and external library types as a type string.
- Replace doc links (`{@link X}`, `[X]`, intra-doc links) with the target's name in backticks.
- `render(type)` is a small recursive function producing the language's own type syntax (generics, unions, arrays, function types). Unknown shapes should fall back to a visible name, never crash.
- OpenAPI: resolve `$ref`, merge `allOf`, and inline the result into `responses[].schema` / the `body` parameter's `children`.

### Step 5: Serialize the frontmatter

Use a real YAML library. Don't hand-concatenate YAML, and:

- disable line folding (a very wide or infinite width) so long descriptions stay on their own lines;
- emit multi-line strings as literal blocks (`|`) so code examples stay readable;
- keep the schema's key order (don't sort alphabetically);
- remember YAML 1.1 parsers read bare `yes`, `no`, `on`, `off` as booleans. Make sure your emitter quotes such strings (most do), and let the check script parse with a different library than the generator to catch the ones that don't.

Python example (tested; `pip install pyyaml`):

```python
import yaml

class Literal(str):  # multi-line strings -> `|` block scalars
    pass

yaml.SafeDumper.add_representer(
    Literal, lambda d, s: d.represent_scalar("tag:yaml.org,2002:str", s, style="|")
)

def prep(x):
    if isinstance(x, str) and "\n" in x:
        return Literal(x)
    if isinstance(x, dict):
        return {k: prep(v) for k, v in x.items()}
    if isinstance(x, list):
        return [prep(v) for v in x]
    return x

def render(definition: dict, notes: str = "") -> str:
    y = yaml.dump(prep(definition), Dumper=yaml.SafeDumper, sort_keys=False,
                  allow_unicode=True, width=10**9)
    return f"---\n{y}---\n" + (f"\n{notes}\n" if notes else "")
```

Equivalents: Node `yaml` (`stringify(obj, { lineWidth: 0 })`), Go `gopkg.in/yaml.v3`, Rust `serde_yaml`, Ruby `Psych`.

### Step 6: Write the files

```
defs = []
for item in source.items():
    if not opted_in(item): continue              # step 2
    defs.append(to_definition(item))             # steps 3-4

fail if two defs share an id                     # collisions are bugs, not overwrites
delete out_dir; create out_dir                   # no stale files
for d in sorted(defs, key=id):
    write(out_dir / f"{d.id}.md", render(d))     # step 5
print(f"Wrote {len(defs)} definitions")
```

### Step 7: Expose two commands

Wire these through whatever your project already uses (`package.json` scripts, `Makefile`, `justfile`, `cargo xtask`, `tox`, `go generate`, a CI step):

| Command               | Does                                                          |
| --------------------- | ------------------------------------------------------------- |
| `docs:reference-beta` | runs the doc tool, runs the generator, then runs `docs:check` |
| `docs:check`          | validates the existing files only (section 4)                 |

Chaining the check into the generate command means a bad generation fails immediately.

## 4. Build the check script

The check answers one question: **do these files comply with the docs schema?** It must be fast, offline, and exit non-zero on any problem.

Requirements:

1. Find every `definitions/*.md`; **fail if there are none** (a silently empty run must not pass).
2. Extract the frontmatter (text between the first two `---` lines; normalize CRLF to LF) and parse the YAML. Missing frontmatter is an error.
3. Validate against the vendored `definition.schema.json` with a **JSON Schema draft 2020-12** validator. Select the 2020-12 dialect explicitly, since many libraries default to an older draft.
4. Check that `id` equals the file name without `.md` (JSON Schema can't express this).
5. Report **all** problems in **all** files (path inside the file + message), then exit non-zero. Don't stop at the first failure.
6. Run it after generation, and in CI.

Pick a validator for your language:

| Language | YAML parser        | 2020-12 validator                       |
| -------- | ------------------ | --------------------------------------- |
| Python   | `pyyaml`           | `jsonschema` (`Draft202012Validator`)   |
| Node     | `yaml`             | `ajv` (import `ajv/dist/2020`)          |
| Go       | `gopkg.in/yaml.v3` | `github.com/santhosh-tekuri/jsonschema` |
| Rust     | `serde_yaml`       | `jsonschema` crate                      |
| Ruby     | `Psych` (stdlib)   | `json_schemer`                          |
| Java     | `snakeyaml`        | `com.networknt:json-schema-validator`   |
| .NET     | `YamlDotNet`       | `JsonSchema.Net`                        |

If your project has **no good option** (or you don't want a runtime dependency in the project), keep the check out of the project's own toolchain: convert each file's frontmatter to JSON with any YAML tool and run a standalone validator (`check-jsonschema`, `ajv-cli`) as a CI step. It only has to run in CI, so Python or Node being available there is enough.

Reference implementation in Python (tested against 91 generated definitions: it passes valid files and reports bad `kind`, unknown keys, missing required keys and id/file-name mismatches). `pip install pyyaml jsonschema`:

```python
#!/usr/bin/env python3
"""Validate reference-beta definitions against definition.schema.json."""
import json
import re
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent  # adjust to your repo layout
DEFS = ROOT / "docs/reference-beta/definitions"
SCHEMA = ROOT / "docs/reference-beta/definition.schema.json"

validator = Draft202012Validator(json.loads(SCHEMA.read_text(encoding="utf-8")))

files = sorted(DEFS.glob("*.md"))
if not files:
    sys.exit(f"No definitions found in {DEFS}")

invalid = 0
for f in files:
    errors = []
    text = f.read_text(encoding="utf-8").replace("\r\n", "\n")
    match = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not match:
        errors.append("missing YAML frontmatter")
    else:
        data = yaml.safe_load(match.group(1))
        for e in validator.iter_errors(data):
            path = "/" + "/".join(str(p) for p in e.absolute_path)
            errors.append(f"{path} {e.message}")
        if not isinstance(data, dict) or data.get("id") != f.stem:
            errors.append("id does not match the file name")
    if errors:
        invalid += 1
        print(f"✗ {f.name}", *[f"    {e}" for e in errors], sep="\n", file=sys.stderr)

if invalid:
    sys.exit(f"\n{invalid} of {len(files)} definitions are invalid")
print(f"All {len(files)} definitions match the schema")
```

Optional hardening beyond the schema (it has no per-`kind` rules): `endpoint` has `http`, `command` has `usage`, `method` has `returns`, example ids are unique within a definition, a `subcategory` always comes with a `category`.

### Prove the check can fail

Before trusting it, break a generated file on purpose, confirm the check fails with a useful message and a non-zero exit code, then regenerate:

- change `kind` to a value not in the enum,
- add an unknown key,
- rename the `id`,
- delete `summary`.

## 5. Gotchas

- **Re-exports** show up as separate entries in doc-tool output. Skip them; document the original once.
- **Const functions** (`const f = (...) => ...`) and **callable wrapper types** (a const typed as a callable interface from another package) often have no call signature in the doc tool's output. Detect them and synthesize the signature, or they silently go missing from the output.
- **Counting:** compare the number of generated files with the count of opted-in items in the doc tool's own output. A mismatch usually means a kind of declaration your script skips.
- **Prettier/format-on-save** will reflow generated Markdown and the vendored JSON. Ignore the `definitions/` folder in your formatter so a format run doesn't churn 100 generated files.
- **Shipping:** if the docs folder is published inside a package (npm `files`, a wheel, a crate), decide whether generated definitions should ship with it.
- **YAML 1.1 vs 1.2:** a value like `no` or `on` is a string in YAML 1.2 but a boolean in 1.1. See Step 5.

## 6. Done when

- [ ] `docs:reference-beta` regenerates the whole folder from scratch and finishes with the check.
- [ ] `docs:check` passes, and you have seen it fail on a deliberately broken file.
- [ ] Every opted-in item produced exactly one file; the count matches the doc tool's output.
- [ ] Definitions with a `@subcategory` carry both `category` and `subcategory`, and show as a sub-group in the docs sidebar.
- [ ] `definition.schema.json` is vendored next to the definitions and was refetched at the start.
- [ ] Both commands run in CI.
- [ ] No hand-edited files in `definitions/`: all changes come from the source of truth.
