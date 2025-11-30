import {TComponentDef, h, createDOM, createUITree, wire, $} from './lib';
import {Counter} from './components/Counter';
import {createAppState} from './lib/cirkit-state';

let appdef = {
  attrs: {
    className: 'app',
    style: {borderStyle: 'solid', borderWidth: '1px', borderColor: 'black', padding: '5px'}
  },

  $title: <div><hr/><h2>"Counter" example</h2><hr/></div>,
  $counter: $(Counter),
  $buttonInc: {elem: <button>Increment</button>, signals: ['click']},

} satisfies TComponentDef;

createDOM(appdef);

let appState = createAppState(appdef);
appState.counter = {val: 99};

let uix = createUITree(appdef);
uix.$counter.$$update(appState.counter!);
wire(
  uix.$buttonInc.$$signals.click,
  () =>
  {
    appState.counter.val++;
    uix.$counter.$$update(appState.counter);
  }
);
