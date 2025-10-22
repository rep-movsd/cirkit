import {CKTComponentDef, h, renderApp, buildTree} from './lib/citkit-core.js';
import {wire, emit} from './lib/cirkit-junction.js';
import {List} from './lib/cirkit-data.js';
import './lib/cirkit.css';

import {FlexLayout} from './lib/cirkit-layouts';

import {TodoList} from './components/TodoList';
import {TodoAdd} from './components/TodoAdd';



let appdef = {
  layout: FlexLayout('VBox', [1, 2, 3]),
  props: {className: 'app'},
  style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'},

  $title:    <div><hr/><h2>To-do List</h2><hr/></div>,
  $todoList: TodoList(),
  $todoAdd:  TodoAdd(),

} satisfies CKTComponentDef;


appdef = renderApp(appdef);
const tree = buildTree(appdef);

const addTodoItem = () =>
{
  const elemInput = tree.$todoAdd.$todoInput.$$ref as HTMLInputElement;
  //tree.$todoList.$$data.add({item: {text: elemInput.value, done: false, color: 'black'}, index: -1});
  elemInput.value = '';
}


wire(tree.$todoAdd.$buttonAdd.$$signals.click, addTodoItem);

wire(tree.$todoAdd.$buttonAdd.$$signals.click, addTodoItem);

console.log(tree)
