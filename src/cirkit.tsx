import {h} from './cirkit-jsx.js';
import {plantDOMTree, exposeEventSignal, setAttr, setProp, setStyle} from './cirkit-dom.js';
import {addSlot, connectList, List} from './cirkit-utils.js';
import {wire, emit} from './cirkit-junction.js';

// Item data and helper to modify DOM element
type TodoItem = { text: string, color: string };
const TodoItemTemplate = { tag: 'li', text: setProp('innerText'), color: setStyle('color') };

// Color selector button item and template
type TodoColorItem = {color: string};
const TodoColorItemTemplate = { tag: 'button', color: setStyle('backgroundColor')};


// Data model for the app
const AppData = {

  // The List class emits signals when items are added, set, or deleted
  todos: new List<TodoItem>('todos'),
  colors: new List<TodoColorItem>('colors'),
}

const App = (
  <main kind='VBox'>

    <todoList tag='ul' span={20} trait='list'>
      {{TodoItemTemplate}}
    </todoList>

    <todoAdd kind='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9}/>
      <buttonAdd tag='button' text='Add Item' span={1}/>
    </todoAdd>

    <colors kind='HBox' span={1} trait='list'>
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
    AppData.todos.add({text: elemInput.value, color: 'black'});
    this.todoAdd.todoInput.ref.value = '';
  }
);

// Wire up the main.submit signal to add an item
wire('App.main.submit', App.main.addTodoItem);

// Wire up the button click to add an item
wire('main.todoAdd.buttonAdd.click', App.main.addTodoItem);

// Wire up the input to add an item on enter key
wire('main.todoAdd.todoInput.keypress', (_, evt: any) => evt.key === 'Enter' && evt.target.value && emit('App.main.submit'));

// Hook up the list components ot the ap data
//connectList(App.main.todoList, AppData.todos);
connectList(App.main.colors, AppData.colors);

// Add some initial data
AppData.colors.add({color: 'red'});
AppData.colors.add({color: 'blue'});
AppData.colors.add({color: 'green'});
