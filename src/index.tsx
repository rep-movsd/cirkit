import {CKTComponentDef, h,  renderApp, buildTree, $signal} from './lib/citkit-core.js';

const appdef =
{
  layout: 'VBox',
  props: {className: 'app'},
  style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'},

  $title:
  {
    layout: 'VBox/1/22',
    elem:
    <div>
      <h2>
        <hr/>
        Todo List
        <hr/>
      </h2>
    </div>,
  },

  $todoList:
  {
    layout: 'VBox/20/22',
    elem: <ul className='vscroll' style={{listStyle: 'none'}}/>,
    item: <li/>,
  },

  $todoAdd:
  {
    layout: 'HBox/1/22',
    $todoInput:
    {
      layout: '9/10',
      elem: <input placeholder='Enter item'/>,
    },

    $buttonAdd:
    {
      layout: '1/10',
      elem: <button>Insert Todo</button>,
      signal: $signal('click', 'item.click', 'change'),

    },
  },
} satisfies CKTComponentDef;


renderApp(appdef);

const tree = buildTree(appdef);
console.log(tree);
console.log(appdef);
