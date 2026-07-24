# Supabase documentation word list

Use this list when you write or review Supabase documentation. It records preferred
spelling, capitalization, and usage for terms that commonly appear in developer
documentation.

This list supplements [CONTRIBUTING.md](./CONTRIBUTING.md). If the two documents
conflict, follow `CONTRIBUTING.md`. Match literal code, API names, UI labels, and
third-party product names even when they differ from this guidance, and format them
as code or UI text as appropriate.

Many unambiguous rules in this list are checked by `supa-mdx-lint`. Run
`pnpm lint:mdx` from `apps/docs` after editing MDX. A lint warning still requires
judgment: rewrite the sentence instead of applying a replacement that changes its
meaning.

## Numbers and symbols

### `+`

Don't use `+` to mean _or later_.

- Recommended: Postgres 15 or later
- Not recommended: Postgres 15+

### `&`

Use _and_ instead of `&` in prose, headings, navigation, and tables of contents.
Keep `&` when it is part of a UI label, code, or a space-constrained table or
diagram label.

## A

### abbreviations

Spell out an unfamiliar abbreviation on first use. Don't expand familiar technical
abbreviations such as API, CPU, HTML, HTTP, or SQL unless the audience needs it.

Use `for example` instead of `e.g.` when practical. If space is constrained, write
`e.g.` with both periods. Use `that is` instead of `i.e.`.

The linter warns about malformed forms of `e.g.` and about `i.e.`.

### abort

Use _stop_, _exit_, _cancel_, or _end_ in general prose. Use `abort` when it is the
name of a command, signal, API, or operation.

### above

Don't use _above_ to refer to a location in a document or UI. Link to or name the
section or control. For versions, use _later_.

### access

When possible, use a more specific verb such as _view_, _find_, _edit_, _open_, or
_use_. Keep _access_ when it accurately describes authorization or connectivity.

### admin

Use _administrator_ in prose. Use _admin_ when it is part of a product name, API,
role, command, or UI label.

### AI

You can use _AI_ without spelling out _artificial intelligence_ when the audience
is familiar with the term.

### allowlist and denylist

Use _allowlist_ and _denylist_ as nouns. Prefer a precise verb that describes the
action instead of using either term as a verb.

- Recommended: Allow requests from the IP address.
- Recommended: Add the IP address to the allowlist.
- Not recommended: Allowlist the IP address.

Don't use _blacklist_ or _whitelist_. The linter reports these terms as errors.
When a literal code item contains one of them, format the item as code and explain
what it does.

### allows you to

Use _lets you_, or make the reader the subject of the sentence.

- Recommended: You can query the table.
- Recommended: The API lets you query the table.
- Not recommended: The API allows you to query the table.

### alpha and beta

Use lowercase when describing a release stage. Preserve capitalization when it is
part of an official product name.

### among and between

Use _between_ for distinct items, even when there are more than two. Use _among_
for members of a group or items that aren't distinct.

### and/or

Rewrite to use _and_, _or_, or explicitly state that either or both apply.

### API

Use _API_ for a web API or a language-specific API. Don't use _API_ to mean an
individual method, function, class, or endpoint.

### app and application

Use _app_ for web and mobile software intended for end users. Use _application_
when it is part of an established term, such as _application programming
interface_, or when the distinction is technically useful.

### as and since

Use _because_ when you mean causation. _As_ and _since_ can be mistaken for
references to time.

### authentication and authorization

Authentication verifies an identity. Authorization determines what an
authenticated identity can access or do. Don't use the terms interchangeably.

Avoid _authN_ and _authZ_ in prose. Use _authentication_ and _authorization_.

### auto-

Follow the spelling established by the relevant technology. Common closed forms
include _autoscaling_, _autofill_, and _autogenerate_. Don't invent a hyphenated
variation when an established form exists.

## B

### backend

Write _backend_, not _back-end_ or _back end_.

### base64

Use _base64_ in general prose. Use the capitalization required by a formal name or
literal code item.

### below

Don't use _below_ to refer to a location in a document or UI. Link to or name the
section or control. For versions, use _earlier_.

### black-box, gray-box, and white-box

Prefer a description of what the monitoring or testing method can observe. If the
established term is necessary, define it on first use.

### boolean

Use the spelling and capitalization of the programming-language type when
referring to code. Use lowercase _boolean_ for the abstract data type and uppercase
_Boolean_ for Boolean logic.

### button

Use _button_ only for an element that is actually a button. In desktop
instructions, users _click_ a button. Preserve the exact button label and format
it in bold.

## C

### can, may, might, must, and should

- Use _can_ for ability, permission, or an optional action.
- Use _might_ for possibility or an uncertain outcome.
- Reserve _may_ for policy or legal guidance when possible.
- Use _must_ or _need to_ for a requirement.
- Avoid ambiguous _should_. State whether an action is required, recommended, or
  optional.

### checkboxes

Users _select_ and _clear_ checkboxes. Don't use _check_, _uncheck_, or _deselect_
for these actions.

### click

Use _click_ for buttons, links, and other controls in a desktop interface. Don't
write _click on_. Use _tap_ when the environment is specifically a touch
interface.

### click here

Don't use _click here_ or _here_ as link text. Describe the destination or action.

### client

In API documentation, a _client_ is usually an app that sends requests. Don't use
_client_ as an abbreviation for _client library_ when that could be ambiguous.

Use _concurrent connections_, not _concurrent clients_, when discussing database
connections. The linter checks this usage.

### codebase

Write _codebase_, not _code base_.

### command-line interface

Name the specific interface, such as _Supabase CLI_. Use _CLI_ after the name is
clear.

### config

Use _configuration_ in general prose. Keep _config_ when referring to a literal
file, command, property, or established technical name.

### console and dashboard

Use the product's official name. Don't use _console_ and _dashboard_
interchangeably, and don't call a UI a dashboard unless it presents a dashboard.
Use _Supabase Dashboard_ for the Supabase product.

### currently

Avoid _currently_ when the sentence describes the product's present behavior.
State the behavior directly.

## D

### data

Treat _data_ as a singular mass noun: _the data is_ and _less data_.

### data center

Write _data center_, not _datacenter_.

### data source

Use _data source_ in prose. Preserve `datasource` when it is a code item or
official product term.

### data type

Write _data type_, not _datatype_.

### deprecate

Use _deprecated_ when use is discouraged, usually because support will end. Don't
use it to mean _removed_, _deleted_, or _unavailable_.

### dialog

Use _dialog_ for a UI element that presents information or asks for input. Don't
use _dialogue_ or _popup_.

### directory and folder

Use _directory_ in command-line contexts and _folder_ in graphical interfaces.
Match the product UI when it uses a specific term.

### disable

Use _disable_ or _turn off_ for an available feature or option. Don't use
_disabled_ to mean that something is broken or unavailable.

### display

_Display_ is a transitive verb and requires an object.

- Recommended: The Dashboard displays the query results.
- Recommended: The query results appear.
- Not recommended: The query results display.

### docs

Use _documentation_ in prose. Use _docs_ in informal contributor instructions,
repository paths, URLs, or established product names.

### dropdown

Prefer the specific control name, such as _list_ or _menu_. Use _dropdown_ only
when the distinction matters, and don't use _drop-down_.

### dummy

Don't use _dummy_ for placeholders or sample values. Use _placeholder_, _sample_,
or a name that describes the value's role. For the statistical concept commonly
called a dummy variable, use _indicator variable_ or another established,
context-appropriate term.

## E

### easy, quick, and simple

Avoid claiming that a task is _easy_, _quick_, or _simple_. These words can be
subjective and usually add no information. The linter warns about _easy_,
_easily_, _quickly_, _simple_, and _simply_.

### email

Write _email_, not _e-mail_. Don't use _email_ as a verb; use _send email_.

### enable

Use _enable_ or _turn on_ consistently for activating a feature. When describing
capability, prefer _lets you_ over _enables you_.

### endpoint

Write _endpoint_, not _end point_. Don't use _endpoint_ when the more specific
term is _function_, _method_, or _route_.

### enter

Use _enter_ for adding text to a field. Use _type_ only when the physical act of
typing matters.

### etc.

Avoid _etc._, _and so on_, and _and more_. Introduce a non-exhaustive list with
_including_, _such as_, or _for example_.

### execute

Use _run_ when it has the same meaning. Keep _execute_ when it is the precise
technical term, such as an execute permission or query execution plan.

### extract

Use _extract_ instead of _unarchive_, _uncompress_, _untar_, or _unzip_ in prose.
Preserve literal command names.

## F

### fail over and failover

Use _fail over_ as a verb. Use _failover_ as a noun or adjective.

### filename

Write _filename_, not _file name_.

### file system

Write _file system_, not _filesystem_, unless the latter is part of a code item or
official name.

### fill in and fill out

Users _fill in_ individual fields and _fill out_ an entire form.

### first person

Address the reader as _you_. Don't use singular first person (_I_, _me_, _my_, or
_mine_); the linter reports it as an error.

Use _we_ only when it clearly refers to Supabase, not when it means the writer and
reader together.

### foo, bar, and baz

Use meaningful placeholder names that help explain the example. Keep conventional
placeholder names only when the convention itself is relevant.

### frontend

Write _frontend_, not _front-end_ or _front end_.

## H

### hardcode and hardcoded

Write _hardcode_ and _hardcoded_ without a hyphen.

### health and healthy

When possible, state the observable condition, such as _responding_, _available_,
or _passing its health check_. Don't use _healthy_ when it could be ambiguous or
anthropomorphic.

### higher and lower

For version ranges, use _later_ and _earlier_, not _higher_ and _lower_.

### hover

Use _hold the pointer over_ when the reader must wait for the interface to react.
Use _point to_ when no waiting is required.

### HTTPS

Write _HTTPS_, not _HTTPs_.

## I

### ID

Write _ID_, not _Id_ or _id_, except when matching code. Use _identifier_ when it
is clearer.

### impact

Use _impact_ as a noun. Prefer _affect_ as the verb.

- Recommended: The change affects performance.
- Not recommended: The change impacts performance.

### index

Use _indexes_ as the plural in database documentation. Use _indices_ only in
domains where it is the established term.

### ingest

Use _import_, _load_, or _copy_ for simple data movement. Use _ingest_ when the
operation also performs substantial processing.

### in order to

Use _to_ unless _in order to_ is necessary to prevent ambiguity. The linter warns
about _in order to_.

### inline

Write _inline_, not _in-line_.

### internet

Use lowercase _internet_ except at the beginning of a sentence.

## J

### just

Remove _just_ when it is filler. If it means _only_ or _previously_, use the more
specific word. The linter warns about _just_.

## K

### key

Don't use _key_ to mean _important_. When referring to a technical key, identify
the kind of key on first use.

### key-value pair

Write _key-value pair_, not _key/value pair_ or _key value pair_.

### kill

Use _stop_, _exit_, _cancel_, or _end_ in general prose. Preserve _kill_ for
literal commands, signals, and established technical operations.

## L

### later and earlier

Use _later_ and _earlier_ for version ranges.

- Recommended: Version 2.2 or later
- Not recommended: Version 2.2 or higher

### latest, new, and soon

Avoid time-relative descriptions that become stale. Provide a version, date, or
specific product state instead.

### leverage

Use _use_ or a more specific verb. The linter warns about _leverage_.

### lifecycle

Write _lifecycle_, not _life cycle_ or _life-cycle_.

### login and log in

Use _login_ as a noun or adjective and _log in_ as a verb. Follow the terminology
in the product UI when it uses _sign in_.

- Recommended: Open the login page, and then log in.
- Not recommended: Login to the Dashboard.

## M

### marketing language

Describe measurable behavior instead of making promotional claims. The linter
warns about:

- _best in class_ and _best-in-class_
- _cutting edge_ and _cutting-edge_
- _effortlessly_
- _game changer_ and _game-changer_
- _hassle free_ and _hassle-free_
- _powerful_
- _seamlessly_

### master and slave

Don't use _master_ and _slave_ together. Prefer terms that describe the
relationship accurately, such as _primary and replica_, _controller and worker_,
or _publisher and subscriber_.

When a literal code item uses either term, format it as code, explain it, and use
the preferred term afterward.

### media type

Use _media type_ rather than _MIME type_. Use _content type_ when referring to the
`Content-Type` HTTP header or when it prevents ambiguity.

### microservices

Write _microservices_, not _micro-services_.

### might

Use _might_ for possibility or an uncertain outcome.

### must

Use _must_ or _need to_ for a requirement. Don't use _must_ for a recommendation.

## N

### native

Use a more precise term when possible, such as _built-in_,
_platform-specific_, or _compiled_. Don't use _native_ to describe people.

### numbers in product versions

Write an explicit comparison, such as _version 3.0 or later_. Don't use _newer_,
_older_, _higher_, _lower_, or a trailing `+`.

## O

### OAuth 2.0

Write _OAuth 2.0_, not _OAuth2_, _OAuth 2_, or _Oauth_.

### obviously and of course

Remove these phrases. They can sound dismissive and don't help the reader. The
linter warns about both.

### once

Use _after_ if that is what you mean. Use _once_ only to mean one time.

### on-premises

Write _on-premises_, not _on-premise_, _on premise_, or _on prem_.

## P

### performant

Use a measurable or specific description, such as _lower latency_, _uses less
memory_, or _handles more concurrent connections_.

### persist

Avoid using _persist_ as a transitive verb.

- Recommended: Store the session.
- Recommended: Make the session persistent.
- Not recommended: Persist the session.

### plain text and plaintext

Use _plain text_ in general contexts. Use _plaintext_ in cryptography.

### please

Don't use _please_ in normal instructions. Use it only when asking permission,
apologizing for an inconvenience, or requesting an action that primarily benefits
Supabase. The linter warns about _please_.

### plugin

Use _plugin_ as a noun and _plug in_ as a verb.

### popup

Use the specific UI element, such as _dialog_, _menu_, or _window_. Don't use
_popup_ or _pop-up_ as a generic noun.

### Postgres

Use _Postgres_, not _PostgreSQL_, outside code and literal third-party names. The
linter checks this usage.

### powered by

Prefer _with_, _by_, or _through_, depending on the relationship. The linter warns
about _powered by_.

### prior to and subsequent to

Use _before_ and _after_. The linter checks both phrases.

## R

### read-only

Always hyphenate _read-only_.

### Realtime

Capitalize _Realtime_ when referring to the Supabase product. Use lowercase
_real-time_ as an adjective with its ordinary meaning.

### repository

Prefer _repository_ in documentation prose. _Repo_ is acceptable in informal
contributor instructions and when space is constrained.

### retry

Use _retry_ as a verb or noun. Write around _retriable_, _retryable_, _triable_,
and _tryable_ when practical.

### run time and runtime

Use _runtime_ for an execution environment. Use _run time_ for the time when a
program runs or the duration of a run.

## S

### sanity check

Use _preliminary check_, _confidence check_, or a description of what the check
validates.

### screenshot

Use _screenshot_ as a noun. Use _take a screenshot_, not _screenshot_ as a verb.
Redact secrets and personal information from screenshots.

### select

Use _select_ for choosing an item, selecting text, or marking a checkbox. Preserve
the exact UI label in bold.

### sensitive and confidential

_Sensitive data_ is data whose disclosure might cause harm. _Confidential data_ is
protected against unauthorized access. Use the term that describes the relevant
risk or control.

### setup and set up

Use _setup_ as a noun or adjective and _set up_ as a verb.

- Recommended: Complete the setup to set up authentication.
- Not recommended: Setup authentication.

### singular they

Use _they_, _them_, and _their_ as gender-neutral singular pronouns. Don't use
_s/he_, _he/she_, _(s)he_, or _him/her_. The linter reports these forms as errors.

### slang abbreviations

Don't use internet slang in documentation. The linter warns about _tl;dr_, _ymmv_,
_rtfm_, _imo_, and _fwiw_.

### spin up

Use _create_ or _start_ unless you are literally describing a spinning disk.

### SQL

Write _a SQL query_, not _an SQL query_. Use lowercase SQL keywords in code
examples unless uppercase is required by the surrounding convention.

### SSH

Don't use _SSH_ or `ssh` as a verb.

- Recommended: Connect to the server by using SSH.
- Recommended: Use the `ssh` command.
- Not recommended: SSH into the server.

### startup and start up

Use _startup_ as a noun or adjective and _start up_ as a verb.

### Supabase

Capitalize _Supabase_ outside code. Use _Supabase Platform_ with both words
capitalized. Match literal package names, commands, URLs, and code.

## T

### table name

Write _table name_ as two words. Format a specific table name as code.

### target

Avoid using _target_ as a verb for people. Use _intended for_, _designed for_, or
another description of the audience.

### terminate

Use _stop_, _exit_, _cancel_, or _end_ unless _terminate_ has a specific technical
meaning in the documented context.

### third party and third-party

Use _third party_ as a noun and _third-party_ as an adjective. Don't abbreviate
either form with `3rd`.

### this and that

Add a noun after _this_ or _that_ when the reference could be unclear.

- Recommended: This setting controls connection pooling.
- Not recommended: This controls connection pooling.

### timeout and time out

Use _timeout_ as a noun or adjective and _time out_ as a verb.

### timestamp

Write _timestamp_, not _time stamp_.

### time zone and time-zone

Use _time zone_ as a noun and _time-zone_ as an adjective.

### toggles

Users _enable_ and _disable_ features with toggles. Match and bold the visible
label. Don't instruct the reader to _click the toggle_ when the intended state can
be stated directly.

## U

### UI

Use the specific interface or page name when possible. Use _UI_ only when
discussing a user interface as a general concept.

Match visible UI labels exactly and format them in bold. Describe the element with
the correct noun when it improves clarity, such as _the **Connect** button_ or
_the **Database password** field_.

### URL

Use _URL_, not _web address_, when writing for developers. Use descriptive link
text rather than exposing a URL unless the URL itself is the subject.

### user

Address the reader as _you_. Use _user_ for a person who uses the software that
the reader is building or administering.

### utilize

Use _use_. Use _utilization_ only when referring to the measured proportion of a
resource in use. The linter warns about forms of _utilize_ and _utilise_.

## V

### vague verbs

Describe the concrete action. The linter suggests:

- _view and resolve errors_ instead of _handle errors_
- _create, edit, or delete tables_ instead of _manage tables_
- _query and update data_ instead of _work with data_

Choose a different precise verb if the suggested replacement doesn't match the
actual operation.

### versus

Write _versus_ in prose, not _vs._ Use `vs` only when it is part of a literal name
or when space is constrained.

## W

### web

Use lowercase _web_. Use the capitalization established by formal names such as
_WebAssembly_.

### we

Don't use _we_ to mean the writer and reader together. Use _you_ for the reader.
_We_ is acceptable when it unambiguously means Supabase.

### while

Use _while_ for events that occur at the same time. Use _although_ or _whereas_
for contrast. Use _while_, not _whilst_; the linter checks _whilst_.

### will and would

Use present tense for current product behavior. Use _will_ for an actual future
event, not a predictable result. Replace _would_ with _can_ when describing
capability.

### workload

Use a more specific term, such as _app_, _service_, _database_, or _job_, when the
meaning is known. If _workload_ is the established technical term, define its
scope on first use.

## Y

### you

Address the reader as _you_. Use _user_ only for a person who uses the software
that the reader is developing or administering.

## Lint-enforced phrase groups

The alphabetical entries explain the intent behind the rules. This section mirrors
the exact terminology checks configured in
`supa-mdx-lint/Rule004ExcludeWords`. Update this section when those rules change.

### Filler

The linter warns about _actually_, _easily_, _easy_, _just_, _let's_,
_obviously_, _of course_, _please_, _quickly_, _simple_, _simply_, and
_that's it_. Remove the term or state the intended meaning directly.

### Marketing language

The linter warns about _best in class_, _best-in-class_, _cutting edge_,
_cutting-edge_, _effortlessly_, _game changer_, _game-changer_, _hassle free_,
_hassle-free_, _powerful_, and _seamlessly_. Describe specific behavior or
measurable results instead.

### Vague verbs

The linter suggests _view and resolve errors_ for _handle errors_, _create, edit,
or delete tables_ for _manage tables_, and _query and update data_ for _work with
data_. Use a different precise replacement when the suggestion doesn't match the
operation.

### Apologies

The linter warns about _oops_ and _sorry_. State what happened directly. Apologize
only when an apology is genuinely useful to the reader.

### First person

The linter reports _I_, _I'm_, _me_, _my_, and _mine_ as errors. Address the
reader as _you_ and use an explicit noun for other actors.

### Gender-neutral pronouns

The linter reports _s/he_, _he/she_, _(s)he_, and _him/her_ as errors. Use the
singular _they_ or rewrite the sentence.

### Inclusive language

The linter reports these terms as errors:

- _mankind_: use _humankind_ or _people_
- _manmade_: use _manufactured_, _artificial_, or _synthetic_
- _middleman_: use _intermediary_
- _blacklist_: use _denylist_ or a more precise term
- _whitelist_: use _allowlist_ or a more precise term

### Abbreviations

The linter corrects _eg._ and _eg_ to _e.g._. It replaces _i.e._, _ie._, and
_ie_ with _that is_. Prefer _for example_ and _that is_ in prose when space
allows.

### Powered by

The linter warns about _powered by_. Use _with_, _by_, or _through_, depending on
the relationship.

### Preferred usage

The linter suggests:

- _Postgres_ for _PostgreSQL_
- _concurrent connections_ for _concurrent clients_
- _use_ for _utilize_ and _utilise_
- _uses_ for _utilizes_ and _utilises_
- _using_ for _utilizing_ and _utilising_

### Direct, concise language

The linter warns about these phrases:

- _aforementioned_: name the item
- _amongst_: use _among_
- _endeavor_ or _endeavour_: use _try_
- _facilitate_: use _help_ or describe the action
- _for the purpose of_: use _to_
- _in order to_: use _to_
- _leverage_: use _use_ or a more precise verb
- _prior to_: use _before_
- _subsequent to_: use _after_
- _whilst_: use _while_

### Internet slang

The linter warns about _tl;dr_, _ymmv_, _rtfm_, _imo_, and _fwiw_. Write out the
meaning or remove the aside.

## Attribution

Portions of this word list are modifications based on work created and shared by
Google and used according to the terms of the
[Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/).
See the
[Google developer documentation style guide word list](https://developers.google.com/style/word-list)
for the original work. Supabase-specific guidance and adaptations are maintained
in this repository.
