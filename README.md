
# Cirkit Framework

Cirkit is a **lightweight, component-based UI framework** for building reactive web applications using **JSX** and a **signal-slot system**. It focuses on **minimalism**, **flexibility**, and **performance**, with a declarative approach to defining **components**, **lists**, **menus**, **tabs**, and other **UI constructs**.
It is currently a work in progress and will get better and more feature-rich with time.

Note:
The first version of this library used JSX for UI definition - while this looked really nice syntactically, JSX has some fundamental limitations related to type enforcement which prevent us from having nice things!
This version ditches JSX in favor of strongly typed TS objects - this increases verbosity a bit and needs the user to follow certain rules, but in return you get a much better development experience. 
---

## Features

- **Simple dict based UI definition syntax** construction
- **Collection components** for lists, menus, tabs, and accordions
- **Signal-slot system** for event propagation and decoupled communication
- **Reactive list binding** with selection support
- **Efficient DOM updates** using direct references and minimal index lookups
- **Simple inbuilt layout styling** using flexbox
- **No dependencies** — just clean TypeScript and vanilla JS

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

### Named component tree

Consider native UI toolkits like QT or Delphi VCL

The way you access some UI element is like `Form1.PanelTodos.ListTodos` (Delphi) or `panelMain->panelTodos->listTodos` (QT)
You have a tree of objects which map to the UI representation - by default, everything has a name and a reference, in contrast to web frameworks where you need to explicitly add a `ref` or some `id` or `name` or custom `data-*` property to the component object or underlying DOM element.  

This always felt counter-intuitive - in React for example, if you have:
```tsx
const comp = 
    <Component>
      <SubComponent>
        // Blah blah
      </SubComponent>
    </Component>
```

You cant just say `comp.subcomponent.changeColor()` or something - you have to introduce extra stuff like refs

Also the idea that the UI is a tree of types/classes as opposed to values is kind of upside down.
It makes more sense that the UI is a tree of values, and those values have a type and name.  

In the first version of this library allowed JSX like this

```tsx
const app = 
<app class='VBox app'>
  <todos class='vscroll' trait='list' bind={data.todos} tag='ul' span={20}
         style={{border: "1px solid black", "list-style-position": "inside"}}>
    <item-template tag={'li'} text={setProp('innerText')}/>
  </todos>
  <todoAdd class='HBox' span={1}>
    <todoInput tag='input' placeholder='Enter item to add' span={1} signals={['keypress']} />
  </todoAdd>
</app>
```

The building blocks are names not types.
Behaviour is attached in whatever way you prefer - you dont need to write a function or class for every block in the UI. 

The JSX approach was not up to spec because JSX works like C macros - JSX gets transformed into function calls which return an object.
However the TS compiler and language server cannot reason the shape of the object perfectly - in theory they could because the JSX is fixed text and if the parser returns a dictionary with fixed keys, it 



### Signals and Slots

Signals and Slots (not to be confused with Javascript signals which now exist as various flavors in Angular, Solid etc.) are an inherently more flexible and sensible paradigm than other forms of event handling.
This is because they allow a sender and receiver of a signal, well as the central dispatcher to be totally agnostic of one another.
The QT framework has been using this paradigm for decades, and it is a very powerful and flexible way to deal with events, both for UIs and for other reactive systems.
For those that may not know, KDE is almost entirely based on QT

Lets consider a simple example that shows how much simple it is to program with signals and slots.

Suppose we had an existing app with an "Upload" button.
Now, assume that we needed to add a UI element, that shows how many times that button was clicked.
In most frameworks, you would have to either add a new event handler to the button or its parent, or change the existing event handler to also update the new UI element.
Even with JS signals, you'd still need some way to make the button click handler update a count that you would have to include in its scope.

In Cirkit, you could simply do this :
```ts
// Setup the count state
data.count = 0;

// Add a slot that updates the label
const doUpdateUploadCount = () => app.panelCounts.labelUploadCount.ref.textContent = `Upload count: ${data.count}`;

// Setup a signal for the above slot
wire('app.updateUploadCount', doUpdateUploadCount);

// Wire the button click to increment the count and emit the update signal
wire('app.updateButton.click', () => {data.count++; emit('app.updateUploadCount')});
```

We could add this code anywhere, in any file in our code, and it would work.
The button doesn't need to know about the count, and the count doesn't need to know about the button - they are all linked up internally by the signal-slot "switch-board" which itself is agnostic of who talks to whom.

With signals and slots, every event is "broadcast" and any entity can listen to it and take appropriate action.

Cirkit emphasizes signals and slots as the control mechanism.
- Signals have arbitrary names and contain arbitrary data and are wired to one or more Slots.
- Slots are simply functions that receive the data and the signal name.
- Signals can also be wired to other Signals to create a chain of events and they can be sent from any code including slots via the `emit()` function.

Another major advantage of using signals and slots, is that it is possible to use them to completely automate all user interactions to your application.
It would be fairly simple to do things like macro recording and replay, or even to make end to end automated UI tests as part of your app itself.


### JSX and UI Design

JSX is a very powerful way to define UI, but tends to be overcomplicated in popular frameworks, who have also biased the perception of how to use it.

For Cirkit we think of JSX as a way to model the UI layout rather than a way to embed UI, logic and code in one.

- We treat the UI as a series of nested boxes, much like a desktop application
- Some of those boxes are homogenous collections of some other type of box, and these are almost always dynamic (items are added, removed etc.)
- 99% of UIs can be built with horizontal and vertical packing of boxes with proportional and fixed sizing
- We rarely need to manipulate the DOM by inserting and deleting elements, unless it is a collection of items that are dynamic

Let's get into some of the details in the following section using an example

### A simple TODO list

Here is the entire code for a todo list which adds entries to a list when you type something into the input field and press **Enter**

```tsx
import {ComponentMap, h, plantDOMTree, setProp, setStyle, List, wire, emit} from './lib/cirkit.js';

type TodoItem = { text: string };
export const data = { todos: new List<TodoItem>('todos')}

const root: ComponentMap =
<app class='VBox app'>
  <todos class='vscroll' trait='list' bind={data.todos} tag='ul' span={20}
         style={{border: "1px solid black", "list-style-position": "inside"}}>
    <item-template tag={'li'} text={setProp('innerText')}/>
  </todos>
  <todoAdd class='HBox' span={1}>
    <todoInput tag='input' placeholder='Enter item to add' span={1} signals={['keypress']} />
  </todoAdd>
</app>

const app = plantDOMTree(root, document.body);

// Slot to add a to-do item to the list from the input
const doAddTodo = function() {
  const elemInput = app.todoAdd.todoInput.ref;
  if(elemInput.value) {
    data.todos.add({text: elemInput.value});
    elemInput.value = '';
  }
}

// Add a signal to connect to the above slot - ideally we dont call slot functions, instead emit a signal tied to them
wire('app.addTodo', doAddTodo);

// Wire up Enter keypress on the input to add an item
wire('app.todoAdd.todoInput.keypress', (evt: any) => evt.key === 'Enter' && emit('app.addTodo'));
```

I dare say it looks pretty simple and grokkable

---

Let's look at each section of the code briefly, and explore things in more detail in the next section

#### Data Model
Cirkit uses the concept of a central data store, typically called **data** to store all the state that the UI needs.
This is a simple dict that can contain any data you wish.

```ts
type TodoItem = { text: string };
export const data = { todos: new List<TodoItem>('todos') };
```
Here we define a list of text todo items that we want to display in the UI.
Each List mush have a unique name, in this case `'todos'` and also be stored in the data object under the same key.
This convention simplifies the code that binds the data to the UI.

---

#### JSX (UI Definition)

The Cirkit parser converts JSX this into a **component map**, which is merely a nested object structure that represents the UI tree.

```tsx
const root: ComponentMap =
<app class='VBox app'>
  <todos class='vscroll' trait='list' bind={data.todos} tag='ul' span={20}
         style={{border: "1px solid black", "list-style-position": "inside"}}>
    <item-template tag={'li'} text={setProp('innerText')}/>
  </todos>
  <todoAdd class='HBox' span={1}>
    <todoInput tag='input' placeholder='Enter item to add' span={1} signals={['keypress']} />
  </todoAdd>
</app>

const app = plantDOMTree(root, document.body);
```

The component map is then passed to the `plantDOMTree` function, which creates the actual DOM elements and attaches them to the document body.
During the process, it adds several properties to the component map, including `ref` which is a reference to the actual DOM element corresponding to a component in the tree

---

#### Slot (Action Handler)
Now we define a slot that does the actual job of adding an item to the list
```ts
function addTodo() {
  const elemInput = app.todoAdd.todoInput.ref;
  if (elemInput.value) {
    data.todos.add({ text: elemInput.value });
    elemInput.value = '';
  }
}
```

Notice two things here:
- We can access the input element as a dotted path in the app object as `app.todoAdd.todoInput.ref`
- The `data.todos` list is modified directly, and the UI is automagically updated to reflect the change

---
#### Signal Connections

Every reactive operation is accomplished in Cirkit by wiring up signals and slots.
It's a bit like electronics, where you have a bunch of components that are connected by wires, and the signals flow from one to trigger an action in another.

```ts
wire('app.addTodo', addTodo);
wire('app.todoAdd.todoInput.keypress', evt => evt.key === 'Enter' && emit('app.addTodo'));
```

Even if a slot function could be called directly, it is better to emit a signal that is connected to the slot, in order to maintain decoupling between the various bits of code.

Here we wire a signal `app.addTodo` to the slot function that adds the item to the list.
We also wire the keypress event of the input field to emit that signal when the Enter key is pressed.

Cirkit automatically sets up event handlers for the DOM events specified in the `signals` array property of a component - in this case we had `signals={['keypress']}` so a keypress event handler was added that would emit the signal `'app.todoAdd.todoInput.keypress'`


## Diving a bit deeper

Now that we have seen the basics, lets look at some of the concepts and implementation in more detail

### Collection components and data binding

A collection component is meant to represent a group of similar items.
It maps a UI element to a List<T> object, such that manipulating the list will automatically update the UI.

The obvious case for such components are lists and tables, but a number of UI elements can be thought of as collections, including menus, tab controls and accordions. List<T> includes a selection index which can be used for any sort of choice based UI

As of now, we support single selection collections bound to arrays - eventually we will add multiselect and binding to Set or Map collections as well.

A List<T> provides add(), del(), set(), and select() methods to manipulate it. Calling any of these methods will emit a signal. List components expect T to be an object, not a primitive type.

When a collection component is bound to a List object, Cirkit internally connects these signals to slots that manipulate the underlying DOM.
During this phase, the component map also gets `ref` properties pointing to the DOM elements.

Let's look at a slightly more complex TODO list (signal and slot code are omitted for brevity)

```tsx
const root: ComponentMap =
<app class='VBox app'>

  <todos class='vscroll' trait='list' tag='ul' span={20} style={{border: "1px solid black", "list-style-position": "inside"}}
         bind={data.todos} selector={setClass('todoSelected')} signals={['item.mousedown']}  >
    <item-template tag={'li'} text={setProp('innerText')} color={setStyle('color')} />
  </todos>

  <todoAdd class='HBox' span={1}>
    <todoInput tag='input' placeholder='Enter item to add' span={9} signals={['keypress']} />
    <buttonAdd tag='button' text='Add Item' span={1} signals={['click']} />
  </todoAdd>

  <colors trait='list' class='HBox' span={0} style={{'min-height': '40px'}}
          bind={data.colors} selector={setClass('todoColorSelected')} signals={['item.click']}>
    <item-template color={setStyle('box.boxColor.backgroundColor')}>
      <tag>
        <box class='VBox' span={0} style={{'min-width': '32px'} }>
          <boxColor tag='div' span={1} signals={['click']} style={{margin:'4px'}}/>
        </box>
      </tag>
    </item-template>
  </colors>
</app>

```

We have added a color selection box to the above example - notice that this colors collection has a nested structure, with a box containing a div that is the actual color box. Whereas the tag was specified as a property in the `todos` collection, here the tag is specified as a nested JSX element.

We can access the Nth `<li>` element in `todos` as `app.todos.refs[N]`
For the colors component, since it is nested, we can access the elements of the Nth color component as `app.colors.refs[n].box.ref` and `app.colors.refs[n].box.boxColor.ref`

Unlike most frameworks, you don't need to explicitly maintain refs to parts of your UI DOM with Cirkit. Since all components are named and have a path, you can access them directly from the app object.

Note that the `<item-template>` and `<tag>` elements are placeholders and do not get rendered in the DOM. They are only a convenience to specify the structure of the collection items.
For cleaner syntax, the "tag" property of a component can be specified via property syntax as `<item-template tag={'li'} ... />` or as a nested tag element `<item-template><tag> ... </tag></item-template>` if dealing with nested components

### DOM updates and mutation

Since we have references to all the DOM elements in the component map, directly updating the state of DOM elements is simple.

For collection components, calling add/set methods on the bound List object will update the corresponding collection element, by calling a function for each key of the data element.

In this example - each todo item has text and color key and corresponding properties in the `<item-template>` element for the todos collection.
These properties are assigned to setColor and setText - these are factories that generate updator functions:
- `setStyle('color')` returns a lambda like `(ref, value) => ref.style['color'] = value`
- `setProp('innerText')` returns a lambda like `(ref, value) => ref.innerText = value`

When the data object is updated, the corresponding function is called with the ref and the value to update the DOM element.

Cirkit predefines a few DOM updaters
- setProp - sets a property of the DOM element
- setClass - sets or removes a class for the DOM element
- setAttr - sets an attribute of the DOM element (for example `disabled`)
- setStyle - sets some property on the element style

Notice that for <colors> we have a nested structure, and the color is set on the innermost div element.
We specify the nested reference like `color={setStyle('box.boxColor.backgroundColor')}` which returns a lambda that modifies the nested element.

As of now this system only works for collection elements - eventually we will allow any component to be mapped to a data object and have its properties updated in a similar way.

Another special property for collection components is `selector` - we can assign one of the above updaters to this property and it will be called when an item is selected or deselected via the `select()` method of the bound List object.

This updater is called twice - once to deselect the existing selection if any, and then once to select the new item

### Event handling and signals for collections

Traditionally there are two ways to handle events in a list
- Attach a handler (for example click) to each item in the list
- Attach a single handler to the list itself and detect which item was clicked

The first method is simple but is memory intensive, the second method is more efficient.
In both cases though, it is necessary to know the index of the child in the collection in which the event occurred.

There are two basic and obvious ways to handle this
- Attach an index to each item in the list - but this would need to be updated for all elements whenever the list changes
- Use `Array.indexof` on the parent element and its DOM children[] array - this is slow as well

However we can do better - we can store an array of references to the DOM elements in the collection component itself, and use the `Array.indexOf` method on this array to get the index of the element that was clicked. Since this is a JS array, it is very fast, and the memory overhead is minimal.

In ths JSX above the `signals` property in both the collection components have the prefix `'item.'` which sets up an event handler to listen for events on the collection items and send a signal with the index of the item in it.

---

### Building

There is no complex build or packaging system for Cirkit - it is a single file that can be included in your project.

The build step is simply to run the TypeScript compiler on the source files to generate JS files and add the skeleton `index.html` and `cirkit.css` files to the dist folder

Just run `npm run build` to build the demo project and then use `npm run serve` to start a local server to view the demo

---

That's all for now!!

Demo

https://github.com/user-attachments/assets/3d7bd25d-9c87-4473-a9dd-3ba926385db9


---

## Roadmap

Several features, big and small are planned

- **More example demo apps**
- **More example components** - Tables, Menus, Tabs, Accordions, carousels
- **Virtual lists** - Multi-select lists, Maps, Sets
- **Async signals** - To do work in the background in microtasks, timers or web workers
- **Animations** - Transitions and effects for DOM mutation
- **Layouts** - Modals and overlays
- **OOB signals** - To allow signals to be scheduled ahead of others in the queue
- **Batch updates** - To allow multiple updates to be batched into a single DOM update
- **Complete reference documentation and usage guide**
- **RAD style UI designer** - This is a big one
- **Minified and precompiled version**
- **Type checking and error handling**

----

### Thank you 
