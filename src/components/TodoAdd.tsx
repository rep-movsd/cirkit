import {CKTComponentDef, CKTElem, h,  $signal} from '../lib/citkit-core.js';


export const TodoAdd = {
  // Input box
  $todoInput:  CKTElem('HBox/9', <input placeholder='Enter item'/>),

  // Button to add item
  $buttonAdd:
  {
    layout: 'HBox/1',
    elem: <button>Insert To-do</button>,
    signal: $signal('click', 'item.click', 'change'),
  },
} satisfies CKTComponentDef;
