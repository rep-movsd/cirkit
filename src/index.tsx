import {CKTComponentDef, CKTComponent, CKTCollectionComponent, CKTElem, h, renderApp, buildTree} from './lib/citkit-core.js';
import {wire, emit} from './lib/cirkit-junction.js';
import {List} from './lib/cirkit-data.js';
import './lib/cirkit.css';

import {TodoList} from './components/TodoList';
import {TodoAdd} from './components/TodoAdd';

let appdef =
{
  layout: 'VBox',
  props: {className: 'app'},
  style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'},

  $title:    CKTElem('VBox/1', <div><hr/><h2>To-do List</h2><hr/></div>),
  $todoList: CKTComponent('VBox/15', TodoList),
  $todoAdd:  CKTComponent('HBox/1', TodoAdd),
} satisfies CKTComponentDef;


appdef = renderApp(appdef);
const tree = buildTree(appdef);

const addTodoItem = () =>
{
  const elemInput = tree.$todoAdd.$todoInput.$$ref as HTMLInputElement;
  //tree.$todoList.$$data.add({item: {text: elemInput.value, done: false, color: 'black'}, index: -1});
  elemInput.value = '';
}


wire(tree.$todoAdd.$buttonAdd.$$signal.click, addTodoItem);

wire(tree.$todoAdd.$buttonAdd.$$signal.click, addTodoItem);


console.log(tree.$todoList)



/*
// Todo data
type TodoItem = {text: string, done: boolean, color: string};
//tree.$todoList.$$data = new List<TodoItem>('todoList');

*/
// Wire button click to add todo item
