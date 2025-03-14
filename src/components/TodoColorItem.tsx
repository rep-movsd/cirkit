import {h} from '../lib/cirkit-jsx.js';
import type {ComponentTemplate} from '../lib/cirkit-types';

// Template for each item in the color list
export const TodoColorItemTemplate: ComponentTemplate = {
  tag:
  <box kind='VBox' span={0} style={{'min-width': '50px'}}>
    <boxColor tag='div' span={1} />
  </box>,

  color: (refs: any, value: any, index: number) => { refs[index].box.boxColor.ref.style.backgroundColor = value; },

  signals: ['click'],
};
