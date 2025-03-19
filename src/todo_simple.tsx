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
