import type {ComponentMap} from '../lib/cirkit-types.js';
import {h} from '../lib/cirkit-jsx.js';
import {plantDOMTree} from '../lib/cirkit-dom.js';

import {TodoItemTemplate} from './TodoItem.js';
import {TodoColorItemTemplate} from './TodoColorItem.js';

export const App: ComponentMap = (
  <main kind='VBox'>

    <todoList trait='list' tag='ul' span={20}>
      {{TodoItemTemplate}}
    </todoList>

    <todoAdd kind='HBox' span={1}>
      <todoInput tag='input' placeholder='Enter item to add' span={9} signals={['keypress']} />
      <buttonAdd tag='button' text='Add Item' span={1} signals={['click']} />
    </todoAdd>

    <colors trait='list' kind='HBox' span={2} >
      {{TodoColorItemTemplate}}
    </colors>

  </main>
);

plantDOMTree(App, document.getElementById('root')!);
