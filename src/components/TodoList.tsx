import { CKTComponentDef, h} from '../lib/citkit-core.js';
import {FlexLayout} from '../lib/cirkit-layouts';


export function TodoList() {
  return {
    layout: FlexLayout('VBox', [1,1,5]),
    $frame: {

      $title: <div>List component</div>,

      // Button to sort
      $buttonSort:
      {
        //layout: 'HBox/1',
        elem: <button>SORT</button>,
        signals: ['click', 'item.click', 'change', 'keypress'],
      },

      $items: <ul/>
    },
  } satisfies CKTComponentDef;
}
