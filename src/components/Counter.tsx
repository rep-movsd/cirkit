import {h, TComponentDef, createComponent} from '../lib';

// Counter component state type
export type TCounterState = { val: number };

// Component template
export const Counter = createComponent<TCounterState>(state => {
  return {
    $title: <span>Count:</span>,
    $value: <span>{state.val}</span>,
  } satisfies TComponentDef
});
