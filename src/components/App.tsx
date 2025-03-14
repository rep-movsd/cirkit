import type {ComponentMap} from '../lib/cirkit-types.js';
import {h} from '../lib/cirkit-jsx.js';
import {plantDOMTree} from '../lib/cirkit-dom.js';
import {data} from '../model.js';

import {TodoItemTemplate} from './TodoItem.js';
import {TodoColorItemTemplate} from './TodoColorItem.js';

// Ideally we always start with a top level component called app
const root: ComponentMap = (
  <app kind='VBox app'>

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

  </app>
);


export const app = plantDOMTree(root, document.body);

app.data = data;
