# Tulisix

Transform text nodes into any format imaginable.

## Overview

Tulisix lets you transform text nodes into specific formats based on rules you define.

- Rule-based transformation
- Supports dynamic variables
- Function-based output for advanced logic
- Automatic HTML escaping (XSS-safe by default)

## Installation & Usage

### Installation

#### Browser

Include via CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/rezzvy/tulisix@465b13b/dist/tulisix.min.js"></script>
```

```javascript
const tulisix = new Tulisix();
```

#### Node

Install via npm:

```bash
npm install tulisix
```

```javascript
import Tulisix from "tulisix";
const tulisix = new Tulisix();
```

### Usage

```html
<div id="app">Hello Reza</div>
```

```javascript
tulisix.addRule({
  from: "Hello {name}",
  to: "<strong>Hello {name}</strong>",
});

tulisix.replace("#app");
```

## Examples

### Multiple Patterns

```html
<p class="text">Hi Reza</p>
```

```javascript
const tulisix = new Tulisix();

tulisix.addRule({
  from: ["Hi {name}", "Hello {name}"],
  to: "<b>{name}</b>",
});

tulisix.replace(".text");
```

### Dynamic Output (Function)

```html
<p class="price">Price: 100</p>
```

```javascript
const tulisix = new Tulisix();

tulisix.addRule({
  from: "Price: {value}",
  to: (safe, match, raw) => {
    return `<span>$${Number(raw.value).toFixed(2)}</span>`;
  },
});

tulisix.replace(".price");
```

### Case Insensitive

```html
<p class="text">hello Reza</p>
```

```javascript
const tulisix = new Tulisix();

tulisix.addRule({
  from: "hello {name}",
  to: "<i>{name}</i>",
  caseSensitive: false,
});

tulisix.replace(".text");
```

### Escaping Curly Braces

```html
<p class="text">{not a variable}</p>
```

```javascript
const tulisix = new Tulisix();

tulisix.addRule({
  from: "\\{not a variable\\}",
  to: "<span>literal</span>",
});

tulisix.replace(".text");
```

### Multiple Rules

```html
<p class="text">**bold** and *italic*</p>
```

```javascript
const tulisix = new Tulisix();

tulisix.addRule([
  {
    from: "**{text}**",
    to: "<strong>{text}</strong>",
  },
  {
    from: "*{text}*",
    to: "<em>{text}</em>",
  },
]);

tulisix.replace(".text");
```

## Documentation

### API Reference

#### `addRule(param)`

Register one or more transformation rules.

| Parameter | Type                        | Description                           |
| :-------- | :-------------------------- | :------------------------------------ |
| `param`   | `Object` \| `Array<Object>` | Rule object or array of rule objects. |

##### Rule Object Structure

| Property        | Type                        | Required | Default | Description                             |
| :-------------- | :-------------------------- | :------- | :------ | :-------------------------------------- |
| `from`          | `String` \| `Array<String>` | Yes      | -       | Pattern(s) with optional `{variables}`. |
| `to`            | `String` \| `Function`      | Yes      | -       | Replacement string or function.         |
| `caseSensitive` | `Boolean`                   | No       | `true`  | Enable/disable case-sensitive matching. |

##### `to` Function Arguments

Used when `to` is a function:

| Argument   | Type     | Description                               |
| :--------- | :------- | :---------------------------------------- |
| `safeVars` | `Object` | Escaped variables (safe for HTML output). |
| `match`    | `Array`  | Result from `RegExp.exec()`.              |
| `rawVars`  | `Object` | Original (unescaped) variable values.     |

#### `replace(target)`

Apply all registered rules to the target.

| Parameter | Type                                                    | Description                                        |
| :-------- | :------------------------------------------------------ | :------------------------------------------------- |
| `target`  | `String` \| `Element` \| `NodeList` \| `Array<Element>` | Selector or collection of DOM elements to process. |

### Limitations

#### Text nodes only

Tulisix only processes text nodes. It does not parse or transform HTML attributes or element structures.
Example: `<div title="Hello Reza">` will NOT be transformed.

#### No cross-node matching

Patterns must exist within a single text node.
Text split across multiple elements will not match.

Example:

```html
<span>Hello</span> <span>Reza</span>
```

Will NOT match `Hello {name}`.

#### HTML output is not sanitized

Only variables are automatically escaped.
If you return raw HTML in `to`, you are responsible for ensuring it is safe.

#### Greedy / ambiguous patterns

Patterns using `{variables}` may behave unexpectedly if the structure is ambiguous.

Example:

```
"{a} {b}"
```

may produce unintended matches depending on content.

#### Order matters

Rules are applied sequentially.
Earlier rules can affect later matches.

#### Not a full template engine

Tulisix is designed for lightweight text transformation, not full HTML templating or parsing.

## Contributing

There's always room for improvement. Feel free to contribute!

## Licensing

The project is licensed under the MIT License. Check the license file for more details.
