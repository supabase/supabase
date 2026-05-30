---
title: 'Postgres Language Server: implementing the Parser'
description: A detailed analysis of our iterations to implement a Parser for Postgres
launchweek: X
categories:
  - product
tags:
  - launch-week
  - postgres
  - planetpg
date: '2023-12-08'
toc_depth: 3
author: philipp
imgSocial: lwx-postgres-language-server/postgres-language-server-og-02.jpg
imgThumb: lwx-postgres-language-server/postgres-language-server-thumb.jpg
---

During our previous Launch Week we [announced](https://news.ycombinator.com/item?id=37020610) the development of a [Postgres Language Server](https://github.com/supabase/postgres_lsp). The response was more enthusiastic than we imagined and we received some excellent ideas.

This is an update on the Parser, which is the fundamental primitive of a Language Server. We’ve been through several iterations of the parser and we want to detail our explorations.

{/* prettier-ignore */}
<details>
  <summary>Want to learn some more acronyms?</summary>

    There will be a few acronyms in this post. We don’t want this post to be “inside baseball” so here are a few concepts that you need to know:

    - ***LSP / Language Server Protocol:*** Something that helps code editors understand code better. It provides functionality like linting and error detection.
    - **Postgres Language Server:** a server that will help with Postgres programming - writing SQL, type inference, etc.
    - **Parser**: A parser converts written code into a form that tools can work with. For example, it identifies variables in code. and then the tools can easily access those variables. We’ll describe this more below.

</details>

## Background: Why build a Language Server?

Postgres is gaining popularity, and yet the tooling around it still needs a lot of work. Writing SQL in editors like VSCode is a pain. One of the unique features of Supabase is the ability to access your Postgres database from a browser or mobile app through our [Data APIs](https://supabase.com/docs/guides/api). This means that developers are writing more [PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html).

While code editors have great support for most programming languages, SQL support is underwhelming. We want to make Postgres as simple as Python.

## Language Server's Core: The Role of the Parser

On the highest level, a language server is a thing which

1. accepts input source code from the client
2. turns it into a semantic model of the code
3. and provides language-specific smarts back to the client.

<Img
  src={{
    dark: '/images/blog/lwx-postgres-language-server/language-server-diagram-dark-mode.png',
    light: '/images/blog/lwx-postgres-language-server/language-server-diagram-light-mode.png',
  }}
  alt="Diagram explaining how a Language server works and the role of the parser"
/>

The parser is the core of every language server. It takes the raw string, turns it into a stream of tokens, and builds a syntax tree. This syntax tree can then be used to extract structural information.

Usually, the parser builds a concrete [syntax tree](https://en.wikipedia.org/wiki/Parse_tree) (CST) before turning it into an [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST). A CST preserves all syntax elements present in the source code with the goal of being able to re-create the exact original source, while an AST contains only the meaning of the source. For example, take a simple expression `2 * (7 + 3)`:

{/* prettier-ignore */}
```markdown
           CST                    AST
          -----                  -----
          expr                     *
       /   |    \                /   \
  term     *   term             2     +
   |             |                   / \
factor         factor               7   3      
   |         /   |    \
   2        (   expr   )   
              /  |  \
          term   +  term
            |        |
          factor   factor
            |        |
            7        3 
```

## Implementing a Parser for Postgres

Implementing a parser for Postgres is challenging because of the ever-evolving and complex syntax of Postgres. Even `select` statements are very complex to parse. Then there are common table expressions, sub-queries and the like. This is one of the reasons why existing Postgres tooling is scarce, badly maintained, and often does not work well.

We decided to not create a custom parser. Instead, we leverage [libpg_query](https://github.com/pganalyze/libpg_query) to parse SQL code reliably. The pganalyze team has a published a great blog post on [why this approach is preferable](https://pganalyze.com/blog/parse-postgresql-queries-in-ruby).

However, libpg*query is designed to parse \_executable* SQL — not to provide language intelligence. Using it for a language server means adapting it to our specific use case. Let’s explore how we adapted it:

### Tokenization

Before any syntax tree can be built, the input string needs to be converted into a stream of tokens. libpg_query exposes a `scan` API that returns all non-whitespace tokens of the source, even for invalid SQL. For example, a simple statement `select '1';` returns

```rust
ScanToken {
        start: 0,
        end: 6,
        token: Select,
        keyword_kind: ReservedKeyword,
},
ScanToken {
		    start: 7,
		    end: 10,
        token: Sconst,
        keyword_kind: NoKeyword,
},
ScanToken {
        start: 10,
        end: 11,
        token: Ascii59,
        keyword_kind: NoKeyword,
}
```

Every `ScanToken` token contains its variant, a range, and a keyword kind. To simplify the implementation of the parser, we extract the text for each token using the range for now. We arrive at the following `Token` struct.

```rust
pub struct Token {
    /// The kind of the token
    pub kind: SyntaxKind,
    /// Text from the input
    pub text: String,
    /// Range within the input
    pub span: TextRange,
    /// Variants from `ScanToken.keyword_kind` + `Whitespace`
    pub token_type: TokenType,
}
```

To have a complete token stream, we merge the results of `scan` with a list of all whitespace tokens in the source, where the latter are extracted by a simple regular expression. For a simple statement `select '1';`, the following tokens are returned by the lexer.

```rust
[
    Token {
        kind: Select,
        text: "select",
        span: 0..6,
        token_type: ReservedKeyword,
    },
    Token {
        kind: Whitespace,
        text: " ",
        span: 6..7,
        token_type: Whitespace,
    },
    Token {
        kind: Sconst,
        text: "'1'",
        span: 7..10,
        token_type: NoKeyword,
    },
    Token {
        kind: Ascii59,
        text: ";",
        span: 10..11,
        token_type: NoKeyword,
    },
]
```

### Conversion to a Syntax Tree

To transform the stream of tokens into a syntax tree, we face the first challenges with `libpg_query`. In a language server, it's important to handle incomplete or improperly formatted input gracefully. When an error occurs you don’t want the parser to “stop”. You want it to check for _all_ errors in your code:

```sql
create table posts (
  id serial primary key # <- ERR: missing comma, Parser should continue
  content text
);

create table comments (
  id serial primary key,
  post_id int references posts # <- ERR: missing comma, second error returned
  comment text
);
```

Unfortunately, the `parse` api from `libpg_query` only parses the entire input — if any SQL statement contains a syntax error, an error is returned for the entire input.

To overcome this, we implemented a resilient `source` parser. This parser breaks the input into individual SQL statements and parses them one by one, allowing us to handle syntax errors within each statement independently. It is implemented as a top-down [LL parser](https://en.wikipedia.org/wiki/LL_parser). Specifically, the parser iterates the token stream left-to-right, and checks if the cursor currently is at the start of a new statement. Once a statement is entered, it walks the tokens until `;` or another statement start is encountered while skipping sub-statements.

Luckily, Postgres statements always start with distinct keywords. An update statement is identifiable with `update`, a delete statement with `delete from`. There are a few statements that need more than the first few tokens to be distinguishable, but we only care about whether there is a statement, and not what statement there is exactly, so ambiguity is very much acceptable.

For the implementation, we only need to provide the distinct keywords each statement starts with and compare it to the current tokens using a lookahead mechanism.

<aside>
💡 Our LL parser is very simple. For more details check out [this blog post](https://matklad.github.io/2023/05/21/resilient-ll-parsing-tutorial.html).

</aside>

### Reverse-Engineering the CST

The second limitation we encountered: `libpg_query` only exposes an API for the AST, not for the CST. To provide language intelligence on the source code, both are required. Since we do not want to implement our own parser, we need to work with what we have to build the CST: the AST and a stream of tokens. The goal is to reverse-engineer the AST into the CST. This involves re-using the AST nodes as CST nodes, and figuring out what token belongs beneath what node. The exemplary statement `select '1';` should be be parsed into

```rust
SelectStmt@0..11
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
    Ascii59@10..11 ";"
```

To do that, we need to know the range of every node that is within the AST.

We made _numerous_ iterations over the past few months to figure out how to accomplish this with minimal manual implementations. Before diving into details, lets take a closer look at the `parse` API of `libpg_query`. For the exemplary statement above, it returns (simplified for readability):

```rust
SelectStmt {
    target_list: [
	    ResTarget {
	        val: Some(
	            Node {
	                node: Some(
	                  AConst {
	                      location: 7,
	                      val: Some(
	                          Sval(
	                              String {
	                                  sval: "1",
	                              },
	                          ),
	                      ),
	                  },
	                ),
	            },
	        ),
	        location: 7,
	    },
    ],
}
```

There are a few limitations:

1. Some nodes do have a `location` property that indicates where the node starts in the source, but not all.
2. There is no information on the range of a node within the source.
3. Some locations are not what you would expect. For example the location of the expression node is the location of the operator, not the start of the left expression.

To summarise: _we need a range for each node, and we only have a start position, but not always, and sometimes it is wrong._

Our first very iterations were naive. We explored what information we could extract from `scan` and `parse`, and if anything can help in reverse-engineering the CST.

It turns out, the most reliable way of determining the range of a node is by knowing all **properties** of that node, and its position in the tree.

A property is any text for which a Token can potentially be found in the source code. For example, a `SelectStmt` node has the `select` keyword as a property, and if there is a `from_clause`, a `from` keyword. For the exemplary statement above, the properties are

```rust
SelectStmt: [Select],
RangeVar: [],
AConst: ['1']
```

Note that we do not have an extra `String` node, and instead add its properties to the parent `AConst` node. This reason is that a `String` node does not bring any value to the CST, since we already know that `‘1'` is a string from the kind of the respective `Token`. The same is true for all nodes that just contain type information such as `Integer`, `Boolean` and `Float`.

The position of any node is the same in AST and CST, and thereby can be reflected from it.

### Implementation

Before the actual parsing begins, the AST returned by `parse` is converted into an uniform tree structure where each node holds the kind of the node, a list of properties, the depth and, if available, the location.

For example, for `select '1';`:

```rust
edges: (0, 1), (1, 2),
nodes: {
    0: Node {
        kind: SelectStmt,
        depth: 1,
        properties: [
            TokenProperty {
                value: None,
                kind: Some(
                    Select,
                ),
            },
        ],
        location: None,
    },
    1: Node {
        kind: ResTarget,
        depth: 2,
        properties: [],
        location: Some(
            7,
        ),
    },
    2: Node {
        kind: AConst,
        depth: 3,
        properties: [
            TokenProperty {
                value: Some(
                    "1",
                ),
                kind: None,
            },
        ],
        location: Some(
            7,
        ),
    },
},
```

To implement such a conversion we need a way to

- get an `Option<usize>` with the location for every node type, if any
- compile a list of all properties that a node contains
- walk down the AST until the leaves are reached

Due to the strict type system of Rust, a manual implementation would be a significant and repetitive effort. With languages such as JavaScript, getting the location of a node would be as simple as `node?.location`. In Rust, a large match statement covering all possible nodes is required to do the same. Luckily, `libpg_query` exports a protobuf definition containing all AST nodes and their fields. For example, an `AExpr` node is defined as

```protobuf
message A_Expr
{
  A_Expr_Kind kind = 1 [json_name="kind"];
  repeated Node name = 2 [json_name="name"];
  Node lexpr = 3 [json_name="lexpr"];
  Node rexpr = 4 [json_name="rexpr"];
  int32 location = 5 [json_name="location"];
}
```

We introspect that definition to generate code at build time using [procedural macros](https://doc.rust-lang.org/reference/procedural-macros.html).

Leveraging the powerful repetition feature of the [`quote`](https://github.com/dtolnay/quote) crate, the `match` statement of a `get_location` function can be implemented with just a few lines of code.

```rust
pub fn get_location_mod(_item: proc_macro2::TokenStream) -> proc_macro2::TokenStream {
		// Parse the proto file using a custom parser
		let parser = ProtoParser::new("libpg_query/protobuf/pg_query.proto");
    let proto_file = parser.parse();

		// get all node identifiers for the left side of the match arm
		let node_identifiers = node_identifiers(&proto_file.nodes);
		// get a TokenStream for each node that returns the location
		// if it is part of the node properties
    let location_idents = location_idents(&proto_file.nodes);

    quote! {
        /// Returns the location of a node
        pub fn get_location(node: &NodeEnum) -> Option<usize> {
            match node {
                #(NodeEnum::#node_identifiers(n) => #location_idents),*
						}
        }
    }
}
```

The `location_idents` function iterates all nodes, searches for a `location` property in the protobuf definition for each node, and returns a `TokenStream` with either `Some(n.location)` or `None` for each.

```rust
fn location_idents(nodes: &[Node]) -> Vec<TokenStream> {
    nodes
        .iter()
        .map(|node| {
            if node
                .fields
                .iter()
								// has location property?
                .find(|n| n.name == "location" && n.field_type == FieldType::Int32)
                .is_some()
            {
                quote! { Some(n.location) }
            } else {
                quote! { None }
            }
        })
        .collect()
}
```

Similarly, we can generate code to recursively walk down the `FieldType == Node` and `FieldType == Vec<Node>` properties of the AST nodes. No manual work required.

Even the function that returns all properties for a node can be generated, at least partly. All AST fields of `FieldType == String` can always be added to the list of properties. In the example above, the `sval: “1”` of the `String` node makes up the properties of its parent, the `AConst` node. What is remaining are mostly just the keywords that need to be defined for every node. A `SelectStmt` node has the `select` keyword as a property, and if there is a `from_clause`, a `from` keyword.

```rust
fn custom_handlers(node: &Node) -> TokenStream {
    match node.name.as_str() {
			"SelectStmt" => quote! {
			    tokens.push(TokenProperty::from(Token::Select));
			    if n.from_clause.len() > 0 {
			        tokens.push(TokenProperty::from(Token::From));
			    }
					...
			},
		...
}
```

<aside>
💡 Implementing this for every node is a time-consuming effort, and ***we would love to get help from the community*** here. Check out [this issue](https://github.com/supabase/postgres_lsp/issues/51) if you like to support.

</aside>

### Parsing a Statement

After the tree has been generated, the parser goes through the tokens and finds the node in whose properties the current token can be found. But not every node is a possible successor. Lets look how the parser builds the CST for the statement `select '1' from contact` at a high level.

We start with the full tree, and all tokens:

{/* prettier-ignore */}
```markdown
Remaining Tokens: ["select", "'1'", "from", "contact"]

Parse Tree:

  SelectStmt (0, [Select, From])
         /         \
1 (ResTarget, [])    2 (RangeVar, ['contact'])
        |             
 3 (AConst, ['1'])
```

Starting with the root node, the parser first searches the current node for the token. In this case, with success. `Select` is removed from `SelectStmt` .

In the next iteration, we search for `'1'`. Since its not in the current node, a breadth-first search is used to find the property within children nodes. We arrive at `AConst` , open all nodes we encountered along the way, and advance.

{/* prettier-ignore */}
```markdown
Remaining Tokens: ["from", "contact"]

Parse Tree:

  SelectStmt (0, [From])
         /         \
1 (ResTarget, [])    2 (RangeVar, ['contact'])
        |             
 3 (AConst, []) 

CST:
SelectStmt
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
```

Since we arrived at a leaf node with no properties left, the next token can not be part of this node or any child. It can be closed immediately after advancing the token. We remove it from the tree and set the current node to its parent. The same now applies to `ResTarget`, so we arrive back at `SelectStmt`:

{/* prettier-ignore */}
```markdown
Remaining Tokens: ["from", "contact"]

Parse Tree:

  SelectStmt (0, [From])
                   \
                     2 (RangeVar, ['contact'])

CST:
SelectStmt
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
```

The `from` token can once again be found within the current node and we just advance the parser. Since `SelectStmt` is not a leaf node, we stay where we are.

{/* prettier-ignore */}
```markdown
Remaining Tokens: ["contact"]

Parse Tree:

  SelectStmt (0, [])
                   \
                     2 (RangeVar, ['contact'])

CST:
SelectStmt
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
    Whitespace@10..11 " "
    From@11..15 "from"
```

From here, it repeats itself: `contact` is found within `RangeVar` using a breadth-first search. It becomes a leaf node that is closed after applying the token. Since no tokens are left, we finish parsing by closing `SelectStmt`, resulting in:

{/* prettier-ignore */}
```markdown
SelectStmt@0..23
    Select@0..6 "select"
    Whitespace@6..7 " "
    ResTarget@7..10
      AConst@7..10
        Sconst@7..10 "'1'"
    Whitespace@10..11 " "
    From@11..15 "from"
    Whitespace@15..16 " "
    RangeVar@16..23
      Ident@16..23 "contact"
```

Keep in mind, this illustration shows you only an overview of the process.If you are interested in the details, take a look at the source code [here](https://github.com/supabase/postgres_lsp/blob/2bb50e7b0733bd4cf630aba453d5132d03dfc113/crates/parser/src/parse/libpg_query_node.rs).

You may have noticed that neither `location` nor `depth` were mentioned. Both are only used to improve performance and safeguard. Among other things, branches with nodes behind the current position of the parser are skipped. Further, the parser panics when a node is opened and either its position or its depth does not match the current state of the parser. This means that the returned CST is guaranteed to be correct.

### Limitations

If the SQL is invalid and `parse` returns an error, the returned CST is just a flat list of tokens. Consequently, the statement parser is not resilient. This is not great, but we have intentionally implemented it so that custom and resilient implementations can be added statement by statement later.

Ultimately, we want the `libpg_query`-based parser to just serve as a fallback. For now however, our goal is to provide a usable language server as fast as possible. And even if some intelligence features will only work on valid statements, we believe it is still better than what we have today: no intelligence at all.

## Next Steps

There are some minor improvements remaining for the parser. But the largest part are the manual implementations missing in `get_node_properties` . Its a time-consuming effort, and **_we would love to get help from the community_** here. Check out [this issue](https://github.com/supabase/postgres_lsp/issues/51) if you like to support.

After that, we will move on to the semantic data model and the language server itself. Other parser features such as support for [PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html) function body parsing will be added later. We want to get this project into a usable state as fast as possible.
