import {CKTComponentDef, CKTElem, h,  $signal} from '../lib/citkit-core.js';


export const TodoList = {
  layout: 'VBox',
  $frame: {

    $title: CKTElem('HBox', <div>List component</div>),

    // Button to sort
    $buttonSort:
    {
      layout: 'HBox/1',
      elem: <button>SORT</button>,
      signal: $signal('click', 'item.click', 'change'),
    },

    $items: <ul/>
  },

} satisfies CKTComponentDef;
