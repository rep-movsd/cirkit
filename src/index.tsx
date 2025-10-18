import {CKTComponentDef, h, renderApp, buildTree, $signal, CKTLayoutType} from './lib/citkit-core.js';
import {wire, emit} from './lib/cirkit-junction.js';
import {List} from './lib/cirkit-data.js';


const compTodoAdd = {
  // Input box
  $todoInput:  {layout: 'HBox/9',  elem: <input placeholder='Enter item'/> },

  // Button to add item
  $buttonAdd:
  {
    layout: 'HBox/1',
    elem: <button>Insert To-do</button>,
    signal: $signal('click', 'item.click', 'change'),
  },
} satisfies CKTComponentDef;


// Generic helper to apply a layout override to any component def
function Component<T extends CKTComponentDef>(base: T, layout: CKTLayoutType): T {
  return { ...base, layout } as T;
}



let appdef =
{
  layout: 'VBox',
  props: {className: 'app'},
  style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'},

  // Top title bar
  $title: { layout: 'VBox/1', elem: <div><hr/><h2>To-do List</h2><hr/></div>},

  // To-do list with scrolling
  $todoList: { layout: 'VBox/15', elem: <ul className='vscroll' style={{listStyle: 'none'}}/>, item: <li/>},

  // Panel with input and button to add new to-do item
  $todoAdd: {...compTodoAdd, layout: 'HBox/1'},
  $todoAdd2: Component(compTodoAdd, 'HBox/1'),

} satisfies CKTComponentDef;



appdef = renderApp(appdef);


const tree = buildTree(appdef);

// Todo data
type TodoItem = {text: string, done: boolean, color: string};
//tree.$todoList.$$data = new List<TodoItem>('todoList');

const addTodoItem = () =>
{
  const elemInput = tree.$todoAdd.$todoInput.$$ref as HTMLInputElement;
  //tree.$todoList.$$data.add({item: {text: elemInput.value, done: false, color: 'black'}, index: -1});
  elemInput.value = '';
}

// Wire button click to add todo item
wire(tree.$todoAdd.$buttonAdd.$$signal.click, addTodoItem);

wire(tree.$todoAdd2.$buttonAdd.$$signal.click, addTodoItem);

console.log(tree.$todoAdd2.$buttonAdd.$$signal.click);
