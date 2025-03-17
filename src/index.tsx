import type {ComponentMap, Component} from './lib/cirkit-types';
import {h} from './lib/cirkit-jsx.js';
import {addSlot, List} from './lib/cirkit-utils.js';
import {wire, emit} from './lib/cirkit-junction.js';
import {plantDOMTree, setProp, setStyle, setClass} from './lib/cirkit-dom.js';

// Todo and color item types
type TodoItem = { text: string, color: string };
type TodoColorItem = {color: string, select?: boolean};

// Data model for the app
export const data =
{
  // The List class emits signals when items are added, set, or deleted
  todos: new List<TodoItem>('todos'),
  colors: new List<TodoColorItem>('colors'),
}

// We always start with a top level component called app
const root: ComponentMap =
  <app kind='VBox app'>

    <todos trait='list' tag='ul' span={20} bind={data.todos} selector={setClass('todoSelected')} signals={['item.click']}  >
      <item-template tag={'li'} text={setProp('innerText')} color={setStyle('color')} />
    </todos>

    <todoAdd kind='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9} signals={['keypress']} />
      <buttonAdd tag='button' text='Add Item' span={1} signals={['click']} />
    </todoAdd>

    <colors trait='list' kind='HBox' span={2} bind={data.colors} selector={setClass('todoColorSelected')} signals={['item.click']}>
      <item-template color={setStyle('box.boxColor.backgroundColor')}>
        <tag>
          <box kind='VBox' span={0} style={{'min-width': '50px'}}>
            <boxColor tag='div' span={1} signals={['click']}/>
          </box>
        </tag>
      </item-template>
    </colors>
  </app>

const app = plantDOMTree(root, document.body);

// Add a slot to the app container that will add a to-do item to the list from the input
addSlot
(
  app,
  'doAddTodo',
  function(this: Component)
  {
    // Get the input element value and add to the list if not empty
    const elemInput = this.todoAdd.todoInput.ref;
    if(elemInput.value)
    {
      data.todos.add({text: elemInput.value, color: data.colors.selectedItem?.color || 'black'});
      elemInput.value = '';
    }
  }
);

// Add a signal to connect to the above slot - ideally we dont call slot functions, instead emit a signal tied to them
// Wire up the main.submit signal to add an item
wire('app.addTodo', app.slots.doAddTodo);

// Wire up the button click and Enter keypress on the input to add an item
wire('app.todoAdd.buttonAdd.click', app.slots.doAddTodo);
wire('app.todoAdd.todoInput.keypress', evt => evt.key === 'Enter' && emit('app.addTodo'));

// Wire item clicks to selections
wire('app.colors.item.click', data.colors.slots.doSelect);
wire('app.todos.item.click', data.todos.slots.doSelect);

// Add colors
data.colors.add({color: 'darkred'});
data.colors.add({color: 'darkgreen'});
data.colors.add({color: 'darkblue'});
