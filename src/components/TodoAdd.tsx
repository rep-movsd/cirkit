import {CKTComponentDef, h} from '../lib/citkit-core.js';


export function TodoAdd() {
  return {
    // Input box
    $todoInput:  {
      elem: <input placeholder='Enter item'/>
    },

    // Button to add item
    $buttonAdd:
    {
      elem: <button>Insert To-do</button>,
      signals: ['click', 'item.click', 'change'],
    },
  } satisfies CKTComponentDef;
}
