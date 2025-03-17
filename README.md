
# Cirkit Framework

Cirkit is a **lightweight, component-based UI framework** for building reactive web applications using **JSX** and a **signal-slot system**. It focuses on **minimalism**, **flexibility**, and **performance**, with a declarative approach to defining **components**, **lists**, **menus**, **tabs**, and other **UI constructs**.

It is currently a work in progress and will get better and more feature-rich with time.

---

## Features

- **JSX-based component tree** construction
- **Collection components** for lists, menus, tabs, and accordions
- **Signal-slot system** for event propagation and decoupled communication
- **Reactive list binding** with selection support
- **Efficient DOM updates** using direct references and minimal index lookups
- **Simple styling with CSS flexbox layouts** (`HBox`, `VBox`)
- **No dependencies**—just clean TypeScript and vanilla JS

---


## Design Principles and Philosophy

### Motivation

I have been working with web technologies on and off for a long time, and I have worked my way up from vanilla JS, jQuery to React (classic).
But I had been working with UI toolkits from the days of Windows 95 and always felt that mature GUI frameworks like wxWidgets, Delphi VCL and especially QT had a much more intuitive and powerful way of building UIs than any of web frameworks I had used or seen.

By the time React 18 came out with hooks and effects and functions as components (which IMHO is just classes with extra pain), I was less involved with UI development, continuing to maintain a decently large React 16 codebase for work until 2020, occasionally adding features or fixing a bug.

Whenever I did any personal project with a UI, I cursed at the spaghetti code that was React, and the opaque nature of its architecture.

I'd been thinking of "rolling my own" for a very long time, but only recently managed to crystallize a coherent design. 

Cirkit is designed with a very narrowed expectation for web design based on the idea that most web apps do not require the complex and hard to understand features that most popular frameworks provide. It is meant to make things as simple as needed, without just having complex technologies for the sake of it.

Facebook had an entire video on how they fixed phantom message notifications with React, but many years later, we still see them. I put this down to the fact that the complexity of the frameworks internals is so high that it is impossible to understand all the edge cases and interactions that can happen. The fact that React code needs to be compiled in order to optimize away the re-rendering because no one can get it right, is something that anyone should find troubling.

We (meaning I and our dear friend ChatGPT) have hashed out a few opinionated ideas that guide the design of Cirkit, and followed our heart to get what I have here.

### Signals and Slots

Signals and Slots (not to be confused with the new Javascript signals concept) are inherently more flexible and sensible than other forms of event handling. This is because they allow a source and sink of a signal to be agnostic of each other, and also allow the central dispatch mechanism to be agnostic of the sources or sinks. The QT C++ GUI framework has been using this paradigm for decades, and it is a very powerful and flexible way to deal with events, both for UIs and for other reactive systems.
For those that may not know, KDE is almost entirely based on QT

Lets consider a simple example that shows how much simpler it is to program with signals and slots, compared to other systems.

Suppose we had an existing app with an "Upload" button. 
Now assume we need to add a UI element that shows how many times that was clicked.
In most frameworks, you would have to either add a new event handler to the button or its parent, or change the existing event handler to also update the new UI element. With JS signals, you'd still need some way to make the button click handler update a count that you would have to include in its scope. 

In Cirkit, you could simply do this :
```ts
// Setup the count state
data.updateCount = 0;

// Add a slot that updates the label
const doUpdateUploadCount = () => app.panelCount.labelUploadCount.ref.textContent = `Upload count: ${data.updateCount}`;

// Wire the button click to increment the count and emit the update signal
wire('app.updateButton.click', () => { data.count++; emit('app.doUpdateUploadCount');});
```

We could add this code anywhere, in any file, and it would work.
The button doesn't need to know about the count, and the count doesn't need to know about the button. 
They are all linked up internally by the signal-slot "switch-board".

With signals and slots, every event is "broadcast" and any entity can listen to it and take appropriate action.


Cirkit uses signals and slots exclusively as the control mechanism. 
- Signals have arbitrary names and contain arbitrary data 
- They are wired to one or more Slots.
  Slots are simply functions that receive the data and the signal name.
- Signals can also be wired to other Signals to create a chain of events.
Alternatively, one can send arbitrary signals from any code including the slots themselves via the `emit()` function.

Another major advantage of using signals and slots is that it is possible to completely automate all user interactions to your application. It would be fairly simple to do things like macro recording and replay, or even to make end to end UI tests part of your app itself.


### JSX and UI Design

JSX is a very powerful way to define UI, but tends to be overcomplicated in popular frameworks. 
The React viewpoint of our JSX being rendered along with state and props is just one of the ways to use it, but very much not the only way.

For Cirkit we think of modeling the majority of UIs via JSX and make the following assumptions and resulting design decisions

- We treat the UI as a series of nested boxes, much like a desktop application
- Some of those boxes are homogenous collections of some type of box and these collections are almost always dynamic
- 99% of UIs can be built with horizontal and vertical packing of boxes with proportional and fixed sizing
- We rarely need to manipulate the DOM by inserting and deleting elements unless it is a collection of items that are dynamic

Let's get into some of the details in the following section using an example

### A simple TODO list 

Here is the entire code for a todo list (the import statements are skipped) which adds entries to a list when you type something into the input field and press **Enter** 

```tsx
// Data model 
type TodoItem = { text: string };
export const data = { todos: new List<TodoItem>('todos') };

// Our app UI JSX
const root: ComponentMap = 
  <app kind='VBox app'>
    <todos trait='list' tag='ul' span={20} style={{ border: "1px solid black", "list-style-position": "inside" }} bind={data.todos}>
      <item-template tag={'li'} text={setProp('innerText')} />
    </todos>
  
    <todoAdd kind='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9} signals={['keypress']} />
    </todoAdd>
  </app>;

const app = plantDOMTree(root, document.body);

// Slot that will add a to-do item to the list from the input
function addTodo() {
  const elemInput = app.todoAdd.todoInput.ref;
  if (elemInput.value) {
    data.todos.add({ text: elemInput.value });
    elemInput.value = '';
  }
}

// Add a signal to connect to the above slot - ideally we don't call slot functions directly, instead emit a signal tied to them
wire('app.addTodo', addTodo);
wire('app.todoAdd.todoInput.keypress', evt => evt.key === 'Enter' && emit('app.addTodo'));
```

---

Let's look at each section of the code briefly and explore things in more detail in the next section

#### Data Model
Cirkit uses the concept of a central data store, typically called **data** to store all the state that the UI needs. This is a simple dict that can contain any data you need.

```ts
type TodoItem = { text: string };
export const data = { todos: new List<TodoItem>('todos') };
```
Here we define a list of text todo items that we want to display in the UI.
Each List mush have a unique name, in this case 'todos' and also be stored in the data object under the same key. 
This convention simplifies the code that binds the data to the UI.

---

#### JSX (UI Definition)

The Cirkit parser converts JSX this into a **component map**, which is merely a nested object structure that represents the UI tree.

```tsx
const root: ComponentMap =
  <app kind='VBox app'>
    <todos trait='list' tag='ul' span={20} style={{ border: "1px solid black", "list-style-position": "inside" }} bind={data.todos}>
      <item-template tag={'li'} text={setProp('innerText')} />
    </todos>

    <todoAdd kind='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9} signals={['keypress']} />
    </todoAdd>
  </app>;

const app = plantDOMTree(root, document.body);
```

The component map is then passed to the `plantDOMTree` function, which creates the actual DOM elements and attaches them to the document body. 

During the process, it attaches several properties to the component map, including 'ref' which is a reference to the actual DOM element corresponding to a component in the tree

---

#### Slot (Action Handler)
Now we define a slo that does the actual job of adding an item to the list
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
- The **data.todos** list is updated directly, and the UI is automagically updated to reflect the change

---
#### Signal Connections

Every reactive operation is accomplished in Cirkit by wiring up signals and slots.

It's a bit like electronics, where you have a bunch of components that are connected by wires, and the signals flow from one to trigger an action in another.

```ts
wire('app.addTodo', addTodo);
wire('app.todoAdd.todoInput.keypress', evt => evt.key === 'Enter' && emit('app.addTodo'));
```

Even if a function could be called directly, it is better to emit a signal that is connected to it as a slot to maintain the decoupling of various bits of code.

Here we wire a signal 'app.addTodo' to the slot function that adds a todo item to the list.
We also wire the keypress event of the input field to emit the 'app.addTodo' signal when the Enter key is pressed.

Cirkit automatically sets up event handlers for the items in the **signals** property of a component - in this case we had `signals={['keypress']}` so a keypress event handler was added that would emit the signal 'app.todoAdd.todoInput.keypress' 

Note that every HTML element that was added to the DOM will have the dotted component path stored in `dataset.path` 
