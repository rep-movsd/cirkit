import type { ComponentMap, ComponentTemplate} from './cirkit-types';

import {h} from './cirkit-jsx.js';
import {plantDOMTree, exposeEventSignal, setAttr, setProp, setStyle} from './cirkit-dom.js';
import {addSlot, connectList, List} from './cirkit-utils.js';
import {wire, emit} from './cirkit-junction.js';

// Item data and helper to modify DOM element
type TodoItem = { text: string, color: string };
const TodoItemTemplate : ComponentTemplate = { tag: 'li', text: setProp('innerText'), color: setStyle('color') };

// Color selector button item and template
type TodoColorItem = {color: string, select?: boolean};

// Data model for the app
const AppData =
{
  // The List class emits signals when items are added, set, or deleted
  todos: new List<TodoItem>('todos'),
  colors: new List<TodoColorItem>('colors'),
}

// Template for each item in the color list
const TodoColorItemTemplate = {
  tag:
  <box kind='VBox' span={0} style={{'min-width': '50px'}}>
    <boxColor tag='div' span={1} />
  </box>,

  color: (refs: any, value: any) => { refs.box.boxColor.ref.style.backgroundColor = value; },
};

const App: ComponentMap = (
  <main kind='VBox'>

    <todoList trait='list' tag='ul' span={20} >
      {{TodoItemTemplate}}
    </todoList>

    <todoAdd kind='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9}/>
      <buttonAdd tag='button' text='Add Item' span={1}/>
    </todoAdd>

    <colors trait='list' kind='HBox' span={2} >
      {{TodoColorItemTemplate}}
    </colors>

  </main>
);

// Construct the DOM tree
plantDOMTree(App, document.getElementById('root')!);

// Expose signals from UI components
exposeEventSignal(App, 'main.todoAdd.buttonAdd', 'click');
exposeEventSignal(App, 'main.todoAdd.todoInput', 'keypress');

// Add a slot to the main container that will add a to-do item to the list from the input
addSlot(App.main, 'addTodoItem',
  function(this: any)
  {
    const elemInput = this.todoAdd.todoInput.ref;
    if(elemInput.value)
    {
      AppData.todos.add({text: elemInput.value, color: 'black'});
      this.todoAdd.todoInput.ref.value = '';
    }
  }
);

// Wire up the main.submit signal to add an item
wire('App.main.submit', App.main.addTodoItem);

// Wire up the button click to add an item
wire('main.todoAdd.buttonAdd.click', App.main.addTodoItem);

// Wire up the input to add an item on enter key
wire('main.todoAdd.todoInput.keypress', (_, evt: any) => evt.key === 'Enter' && emit('App.main.submit'));

// Hook up the list components ot the ap data
connectList(App.main.todoList, AppData.todos);
connectList(App.main.colors, AppData.colors);

// Add some initial data
AppData.colors.add({color: 'red'});
AppData.colors.add({color: 'blue'});
AppData.colors.add({color: 'green'});

console.log('App', App);
