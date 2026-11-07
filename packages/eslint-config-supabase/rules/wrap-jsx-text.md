# `supabase/wrap-jsx-text`

Browser translation can replace React-owned text nodes with other DOM elements. A later React update may try to remove or insert relative to a detached text node and throw `NotFoundError`. Dedicated text spans reduce this failure mode by giving React a stable element boundary. See [React issue #11538](https://github.com/facebook/react/issues/11538) and [React issue #22702](https://github.com/facebook/react/issues/22702).

The shared config registers this rule. Studio enables it as a warning for TypeScript JSX files. It is not added to the shared warning ratchet, and enabling it does not rewrite existing components.

## Examples

```tsx
<div>Hello {name}</div>
<div>{isVisible && 'Hello'}</div>
<div>{isReady ? 'Ready' : 'Loading'}</div>
```

When the surrounding markup satisfies the automatic fix restrictions, these become:

```tsx
<div><span>Hello </span>{name}</div>
<div>{isVisible && <span>{'Hello'}</span>}</div>
<div>{isReady ? <span>{'Ready'}</span> : <span>{'Loading'}</span>}</div>
```

Conditional wrappers stay inside their original branches. A false condition does not leave an empty span behind. The rule preserves raw JSX text, including entities, line breaks, and spaces, and preserves the original string or template expression. Reapplying the fix does not add more spans.

## Detection and existing spans

The rule detects non-whitespace JSX text, nonempty string literals, template literals, and string branches within `&&` and ternary expressions. It follows nested fragments and expressions. Arbitrary variables, calls, numbers, and other unknown dynamic values are outside its detection scope.

A span with one text child or one expression that always returns a string is already protected. A span with mixed children still needs review: `<span>Hello {name}</span>` contains independently reconciled text nodes. The rule wraps its known text when safe; it cannot determine whether `name` needs its own wrapper. A conditional that can remove text also needs an inner element boundary, as in `<span>{isVisible && <span>Hello</span>}</span>`.

## Automatic fix restrictions

Automatic fixes require a recognized HTML text container with no attributes, and every surrounding JSX element must meet those same conditions. This deliberately excludes classes, inline styles, spreads, IDs, custom elements, and component ancestors because they may introduce layout or child contracts that the rule cannot infer.

Text inside custom components or markup with attributes is reported for manual review without a fix. Mixed ternary branches containing a React element or unknown dynamic value also receive no fix. A component may expect a string child, clone its child, or use a render prop; inspect its implementation before changing its children.

JSX passed to a function or constructor call, including JSX nested inside an object or array argument, is reported for manual review without a fix because the callee may require string children or inject layout behavior. JSX returned from a callback remains eligible for the surrounding JSX rules. Root fragments are skipped because their effective HTML parent is unknown.

The rule skips SVG, MathML, namespaced JSX, `asChild`, recognized Slot components, and restricted ancestors such as tables, lists, selects, raw text elements, and preformatted/code content. This includes otherwise valid nested text containers beneath those ancestors. Skipping those trees avoids introducing invalid markup or changing specialized behavior.

## Limits

Static analysis cannot prove the absence of global CSS, tag selectors, browser behavior, or DOM manipulation. Even markup with no attributes can change appearance after inserting a span. Review fixed output and test affected layouts before applying fixes broadly.

This rule does not provide universal Google Translate protection. Unknown dynamic children, skipped contexts, third-party components, and other DOM changes remain possible sources of reconciliation failures. It does not patch browser DOM APIs or prevent translation.
