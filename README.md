
# Cirkit Framework

Cirkit is a **lightweight, component-based UI framework** for building reactive web applications using **JSX** and a **signal-slot system**. It focuses on **minimalism**, **flexibility**, and **performance**, with a declarative approach to defining **components**.
It is currently a work in progress and will get better and more feature-rich with time.

---

Note:

The first version of this library (in the branch `old`) used JSX for UI definition - while this looked really nice syntactically, JSX has some fundamental limitations related to type enforcement which prevent us from having nice things!

This version ditches JSX in favor of strongly typed TS objects - this increases verbosity a bit and needs the user to follow certain rules, but in return you get a much better development experience. 

---

## Features currently implemented

- **Simple dict based UI definition syntax** with strong typing and IDE autocomplete
- **Signal-slot system** for event propagation and decoupled communication
- **Efficient DOM updates** using direct update of DOM elements
- **Clean state model** 
- **No dependencies** — just clean TypeScript and vanilla JS


## Features in the pipeline

- **Collection components** for lists, menus, tabs, accordions and similar
- **Reactive list binding** with selection support
- **Simple layout management** using flexbox

---

## Design Principles and Philosophy

### Motivation

I have been working with web technologies on and off for a very long time, and worked my way up from vanilla JS, jQuery to React (with the legacy class based model).
But I have also been working for far longer with native UI toolkits, all the way from the days of Windows 95, and have always felt that mature GUI frameworks like wxWidgets, Delphi VCL and QT (especially), have been a much more intuitive and powerful way of building UIs than any of web frameworks I have seen.

By the time React 18 came out, with hooks, effects and functional components as the norm (which IMHO is just classes with extra pain), I was less involved with UI development, continuing to maintain a decently large React 16 codebase for work until 2020, occasionally adding features or fixing a bug.

But whenever I did any personal project with a UI, I cursed at the spaghetti code that was React, and the opaque nature of its architecture. The UI codebase that I occasionally modify at work uses AngularJS and it's certainly not simple or elegant.

I wanted a few things in a UI framework (each is described in detail in the following sections)

- Named component tree with IDE autocomplete and strong typing
- Signals and slots as the event mechanism
- Data bound components
- Direct DOM updates 

It is certainly very opinionated and works different from what popular frameworks do, but this is what I wanted.

---

### Named component tree

In native UI toolkits like Qt or Delphi VCL, you always have a **named object tree** that mirrors the UI:

- Delphi: `Form1.PanelTodos.ListTodos`
- Qt: `panelMain->panelTodos->listTodos`

You get a *real object graph* you can navigate, and every UI element already has a name and a handle. In contrast, web frameworks usually give you a tree of component *types*, and you have to bolt on identity yourself with `ref`, `id`, `name`, or `data-*` attributes whenever you want to actually grab something.

That always felt backwards.

In React, for example:

```tsx
const comp =
  <Component>
    <SubComponent>
      {/* ... */}
    </SubComponent>
  </Component>;
```

You **can’t** just write `comp.subComponent.changeColor()`. There is no object tree of “live components” you can walk. You have to introduce refs, context, or other indirection just to talk to specific parts of the UI.

Cirkit flips this around.

The UI is defined as a **tree of values** (plain TypeScript objects), and those values have:
- a **name** (keys starting with `$`)
- a **type** (what kind of component it is)
- and, at runtime, a **handle** with metadata (`$$ref`, `$$update`, `$$signals`, etc. to manipulate the underlying DOM).

Example:

```ts
let appdef = {
  attrs: { className: 'app' },

  $panelTodos: {
    $listTodos: {
      // ... list component definition ...
    },
  },

} satisfies TComponentDef;
```

At build time, this is just a strongly-typed object. At runtime:

```ts
createDOM(appdef, document.body);
const ui = createUIHandles(appdef);

// Navigate the UI tree like a native toolkit:
ui.$panelTodos.$listTodos.$$ref       // underlying DOM element
ui.$panelTodos.$listTodos.$$update({ /* state */ });
```

So instead of “a tree of component classes that React will instantiate somehow”, you have:
a **named component tree** of concrete values, and a parallel **UI handle tree** that gives you structured access to refs, signals, and state slots.

In an earlier iteration I tried to twist JSX into giving me this kind of value tree directly. It worked up to a point, but JSX makes it hard to enforce types and names in the way I wanted. The current design leans into plain TypeScript objects with `$`-prefixed keys for components, which keeps the model simple, explicit, and very friendly to both humans and tools (including LLMs).

---

### UI definition

We don’t use JSX as the *primary* paradigm in this library – the core is a **plain object** description of the UI. JSX is only used as a convenient way to write raw HTML-like elements.

Let’s look at a simple app definition:

```tsx
let appdef = {
  attrs: {
    className: 'app',
    style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'}
  },

  $title: <div><hr/><h2>"Counter" example</h2><hr/></div>,
  $counter: $(Counter),
  $buttonInc: {elem: <button>Increment</button>, signals: ['click']},

} satisfies TComponentDef;
```

We’ll go through this piece by piece.

---

#### DOM attributes (`attrs`)

```js
attrs: {
  className: 'app',
  style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'}
}
```

The `attrs` key describes the DOM attributes of the component node - in this case it is the root element of the app itself.

- `className` becomes the CSS class of the root `<div>` (or whatever tag you choose).
- `style` is a partial `CSSStyleDeclaration`, applied directly to the DOM element.


In effect you get the following DOM element:

```tsx
<div className="app" style={{ borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px' }}>
  {/* children here */}
</div>
```

But instead of JSX, it’s just a plain object that TypeScript can check structurally.

---

#### Named child components (`$title`, `$counter`, `$buttonInc`)

All child components are stored under keys starting with `$`:

- `$title`
- `$counter`
- `$buttonInc`

This is how Cirkit knows “this is a **component node**” rather than just some random property. At runtime, these become the named nodes in your **UI handle tree**:

```ts
const ui = createUIHandles(appdef);

ui.$title.$$ref;
ui.$counter.$$update(...);
ui.$buttonInc.$$signals.click;
```

The choice of $ is simply because it’s valid in JS/TS identifiers, and usually used by frameworks.
It also has the advantage of being the topmost entry in IDE autocomplete list.

---

#### Static JSX element as a component (`$title`)

```tsx
$title: <div><hr/><h2>"Counter" example</h2><hr/></div>,
```

Here `$title` is defined directly with JSX. Internally, the custom `h` factory turns this into a `TJSXElement`:

```tsx
$title: {
  tag: 'div',
  children: [
    { tag: 'hr', /* ... */ },
    { tag: 'h2', children: ['"Counter" example'] },
    { tag: 'hr', /* ... */ },
  ]
}
```

When `createDOM(appdef, root)` runs, this JSX element is rendered into a real DOM subtree, and its root element is exposed later as:

```tsx
ui.$title.$$ref;  // HTMLElement for the <div>…</div>
```

This kind of component is meant for simple static HTML fragments, without any state or signals management

---

#### Stateful component node (`$counter: $(Counter)`)

```tsx
$counter: $(Counter)
```

This is a **stateful component**. The pattern is:

- `Counter` is a component factory defined with `createComponent<State>`:

  ```tsx
  type TCounterState = { val: number };

  export const Counter = createComponent<TCounterState>(state => ({
    $title: <span>Count:</span>,
    $value: <span>{state.val}</span>,
  }));
  ```

- `$(Counter)` instantiates that definition and attaches a typed `update` slot to it.

So `$counter` becomes a component value with:

- A UI definition (children, JSX, etc.).
- An `update(state: TCounterState)` function/slot.

And in the UI handle tree, you get:

```ts
ui.$counter.$$update({ val: 42 });  // applies state to all child nodes under $counter where state.val is used
ui.$counter.$$ref;                  // root DOM element of the counter
```

Note that the return value of `createComponent` is nothing special, its simply a dict that you could very well write by hand.
It just allows using state inside the HTML templates like we are used to in most frameworks and converts such references to a form that teh renderer can use to handle the update logic.

You can then drive it from application state:

```ts
let appState = createAppState(appdef);
appState.counter = {val: 99};

ui.$counter.$$update(appState.counter);
```

`createAppState` is a magic helper that creates a typed state object for all stateful components in the app definition.

It returns a plain object with keys matching the stateful components, and values typed according to their state definitions.


---

#### Signal-emitting node (`$buttonInc`)

```jsx
$buttonInc: { 
  elem: <button>Increment</button>, 
  signals: ['click'] 
}
```

This is a more explicit component definition without a custom factory:

- `elem` – a JSX element describing the DOM node to render.
- `signals` – which DOM events from this element should be exposed as **signals**.

At render time:

- `elem` becomes a `<button>` DOM element with the text `Increment`.
- The `click` event handler on that button is wired into the Cirkit signal system.
- In the UI handle tree, the signal paths are available as:

  ```ts
  ui.$buttonInc.$$signals.click;
  ```

You can then wire logic to this signal:

```ts
wire(ui.$buttonInc.$$signals.click, () => {
  appState.counter.val++;
  ui.$counter.$$update(appState.counter);
});
```

The button doesn’t own any state; it just emits a signal. The `Counter` component takes care of the view, and your app-level state (`appState`) holds the data.

---

So the full picture for the app definition is:

- `appdef` is a **pure data description** of the UI:
    - DOM attributes (`attrs`)
    - named child components (`$title`, `$counter`, `$buttonInc`, …)
    - child components have the same recursive structure  
- `createDOM(appdef, root)` realizes that description into real DOM nodes.
- `createUIHandles(appdef)` gives you a **structured handle tree** (`ui`) with:
    - `$$ref` for direct DOM access,
    - `$$signals` for wiring,
    - `$$update` for applying typed state.

Everything else (state management, business logic, derived behavior) lives outside in plain TypeScript code, wired through signals and slots.


### Signals and Slots

Signals and Slots (not to be confused with modern “signals” in Angular, SolidJS, etc.) are an inherently more flexible and sensible paradigm than ad-hoc event handlers.

They allow:

- the **sender** of a signal,
- the **receiver** (slot),
- and the **central dispatcher**

to all be completely agnostic of one another.

The Qt framework has used this model for decades, and it’s a powerful way to deal with events in UIs and other reactive systems. KDE, for example, is largely built on Qt’s signal/slot mechanism.

Let’s look at a simple example that shows how much simpler it is to program with signals and slots.

---

#### Example: A button and label without tight coupling

Suppose we have an existing app with an **Upload** button.  
Now we want to add a UI element that shows how many times that button was clicked.

In most frameworks you would:

- change the existing click handler, or
- add a new handler that knows about both the button and the label, or
- introduce some shared state/store and wire both components to it.

Even with JS “signals”, you usually end up adding more wiring so the button’s handler can update some piece of shared state.

In Cirkit, we keep the **button**, the **count**, and the **label** loosely coupled.

First, imagine part of the UI definition:

```tsx
let appdef = {
  attrs: { className: 'app' },

  $panelCounts: {
    $labelUploadCount: <span>Upload count: 0</span>,
  },

  $uploadButton: {
    elem: <button>Upload</button>,
    signals: ['click'],
  },

} satisfies TComponentDef;
```

In this definition, the `$uploadButton` declares that it emits a `'click'` signal, but it has no idea what happens when it is clicked.

The `$labelUploadCount` is just a static view (for now).

Now, in our initialization code, we wire them together:

```ts
// Create the runtime handles
const ui = createUITree(appdef);

// Define our state (simple JS variable here for demonstration)
let uploadCount = 0;

// Wire the signal to a slot
wire(ui.$uploadButton.$$signals.click, 
  () => {
    uploadCount++;
    ui.$panelCounts.$labelUploadCount.$$ref.textContent = `Upload count: ${uploadCount}`; 
  }
);
```

The button remains purely a button. The label remains a label. The logic lives in the wiring.

Note that we did not use a stateful component here, just to demonstrate that we are free to use whatever level of abstraction we want.

---

## The complete "Counter" example

This example demonstrates the full power of Cirkit: combining **Stateful Components**, **App Definition**, and **Reactive Wiring**.

### 1. The Component (`components/Counter.ts`)

First, we define a reusable component. We define the shape of its state and use `createComponent` to build a factory. Notice how we use the `state` proxy to bind values directly into the JSX.

```tsx
import { h, createComponent } from '../lib'; // assuming library is in lib

// 1. Define the State Shape
export type TCounterState = { val: number };

// 2. Create the Component Factory
// 'state' is a proxy that captures property names for binding
export const Counter = createComponent<TCounterState>((state) => ({
  attrs: {
    style: { padding: '10px', border: '1px solid #ccc' },
    tag: 'span' // Root element is a <span>
  },

  $label: <span>Current Value: </span>,

  // Bind the 'val' property to this <b> tag's text content
  $valueDisplay: <b>{state.val}</b>
}));
```

### 2. The App Definition (`index.tsx`)

We import the component and use the `$(...)` helper to register it as a stateful node in our app tree.

```tsx
import { h, createDOM, wire, $ } from '../lib';
import { Counter } from './components/Counter';

// 1. Define the static structure of the App
const appdef = {
  attrs: { className: 'main-app' },
  $title: <h1>Counter Demo</h1>,
  
  // Instantiate the Counter component
  $counter: $(Counter),
  
  // A simple button that exposes the native 'click' event as a signal
  $btn: {
    elem: <button>Increment</button>,
    signals: ['click']
  },

} satisfies TComponentDef;

// 2. Render the DOM
createDOM(appdef, document.getElementById('root'));
```

### 3. State & Wiring (`index.tsx`)

Finally, we bring it to life. We generate the **State Container** and the **UI Tree**, then wire the button's signal to the counter's update slot.

```ts
import { createAppState, createUITree } from '../lib';

// 1. Generate Type-Safe State Container
// appState.counter is automatically typed as TCounterState ({ val: number })
let appState = createAppState(appdef);
appState.counter = { val: 0 };

// 2. Generate UI Handles
let uix = createUITree(appdef);

// 3. Initial Render
// Push the initial state to the component
uix.$counter.$$update(appState.counter);

// 4. Wire Logic

wire(
  // Source: The button's click signal (fully typed path)
  uix.$btn.$$signals.click,
  
  // Slot: An anonymous function to handle the logic
  () => {
    // A. Update Data
    appState.counter.val++;
    // B. Update View
    // We explicitly tell the component to update with the new data.
    // This updates ONLY the bound text nodes in the DOM.
    uix.$counter.$$update(appState.counter);
  }
);
```

### Why this is cool
1. **Type Safety:** If you try to access `uix.$btn.$$signals.hover`, TypeScript will yell at you because we only defined `['click']`.
2. **Refactoring:** If you move `$btn` into a sub-panel inside `appdef`, the compiler will force you to update the `wire` path to `uix.$subPanel.$btn...`.
3. **Performance:** Clicking the button updates the JS object and touches *exactly one* DOM TextNode (`$valueDisplay`). No tree diffing occurs.
4. **Separation of Concerns:** The button doesn't know about the counter, and the counter doesn't know about the button. They communicate purely through signals and slots.


---

Summary and Next Steps

Cirkit offers a fresh take on building web UIs by combining the best ideas from native GUI toolkits with modern web development practices. Its focus on a named component tree, strong typing, and a signal-slot architecture provides a solid foundation for building maintainable and efficient applications.

The current version is still in its early stages, but the core concepts are in place and working well.

Coming up next are:
- Collection components for lists, menus, tabs, and accordions
- Reactive list binding with selection support
- Simple layout management using a plugin system
- Typed signals and slots 
- Async signals
- Signal serialization for macros
- Visual design tool (TBD)
