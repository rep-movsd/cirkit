// Item data and helper to modify DOM element
import type {ComponentTemplate} from '../lib/cirkit-types.js';
import {setProp, setStyle} from '../lib/cirkit-dom.js';

export const TodoItemTemplate : ComponentTemplate =
{
  tag: 'li',
  signals: ['click'],
  text: setProp('innerText'),
  color: setStyle('color')
};
