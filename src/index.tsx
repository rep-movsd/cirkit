import {Component, Updater, h, plantDOMTree, setProp, setStyle, setClass, List, addSlot, wire, emit} from './lib/cirkit.js';

// Data model for the app
type TodoItem = { text: string, color: string };
type TodoColorItem = {color: string, select?: boolean};
export const data =
{
  // The List class emits signals when items are added, set, or deleted
  todos: new List<TodoItem>('todos'),
  colors: new List<TodoColorItem>('colors'),
}

// We always start with a top level component called app
const root: Component =
  <app class='VBox app'>
    <todos class='vscroll' trait='list' tag='ul' span={20} style={{border: "1px solid black", listStylePosition: "inside"}}
           bind={data.todos} selector={setClass('todoSelected')} signals={['item.mousedown']}  >
      <item-template tag={'li'} setter={{color: setStyle('color'), text: setProp('innerText')}} />
    </todos>

    <todoAdd class='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9} signals={['keypress']} />
      <buttonAdd tag='button' span={1} signals={['click']} >
      Add
      </buttonAdd>

    </todoAdd>

    <colors trait='list' class='HBox' span={0} style={{minHeight: '40px'}}
            bind={data.colors} selector={setClass('todoColorSelected')} signals={['item.click']}>
      <item-template setter={{color: setStyle('box.boxColor.backgroundColor')}}>
        <tag>
          <box class='VBox' span={0} style={{minWidth: '32px'}}>
            <boxColor tag='div' span={1} signals={['click']}/>
          </box>
        </tag>
      </item-template>
    </colors>



  </app>

console.log(root);

/*  */
const app = plantDOMTree(root, document.body);

console.log(app);

// Add a slot to the app container that will add a to-do item to the list from the input
// Item will be added at the the selected point in the list if any
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
    const pos = data.todos.selectedIdx;
    data.todos.add({text: elemInput.value, color: data.colors.selectedItem?.color || 'black'}, pos);
    elemInput.value = '';
  }
}
);

// Add a signal to connect to the above slot - ideally we dont call slot functions, instead emit a signal tied to them
// Wire up the main.submit signal to add an item
wire('app.addTodo', app.slots.doAddTodo);

// Wire up the button click and Enter keypress on the input to add an item
wire('app.todoAdd.buttonAdd.click', app.slots.doAddTodo);
wire('app.todoAdd.todoInput.keypress', (evt: any) => evt.key === 'Enter' && emit('app.addTodo'));

// Wire item clicks to selections
wire('todos.item.select', data.todos.slots.doSelect);
wire('app.todos.item.mousedown', 'todos.item.select');

wire('app.colors.item.click', data.colors.slots.doSelect);

// Add colors
data.colors.add({color: 'darkred'});
data.colors.add({color: 'darkgreen'});
data.colors.add({color: 'darkblue'}, 0);

// Select the first color
emit('app.colors.item.click', 0);

console.time('add bulk');
for(let i = 0; i < 10000; i++)
{
  data.todos.add({text: `Item ${i}`, color: 'black'});
}
console.timeEnd('add bulk');
/* */
