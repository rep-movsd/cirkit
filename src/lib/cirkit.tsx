/** @jsx h */

type ComponentTrait = 'list'|'set'|'item';
type Dict = { [key: string]: any };
type Component = Dict & { span?: number; path?: string, data?: Dict, bind?: string, signals?: string[]};
type CollectionComponent = Component & { trait: ComponentTrait }
type ComponentMap = { [key: string]: Component | CollectionComponent };
type IndexedItem = { index: number, item: any };

///////////////////////////////////////////////////////////////////////////////
// region Signal and Slot handling


// Signals names are typically dotted paths For example: 'app.colors.item.click'
type SignalName = string;

// Slots have an arbitrary data object and a signal name
// The data is kept as the first parameter, so that any function with one param can also be a slot
type Slot = (data: any, signal: SignalName) => void;

// Connection switchboard for signals to slots
const SwitchBoard: { [signal: SignalName]: Slot[] } = {};

type Signal = { signal: SignalName, data: any };
const SignalQueue: Signal[] = [];

// Connect a signal to a slot or other signal
const wire = (signal: SignalName, target: Slot|string) =>
{
  // If the target is a function, otherwise its another signal, so create a function that emits the signal.
  let slot: Slot = (typeof target === 'function') ? target : (data, sig) => emit(sig, data);

  // Append the slot to the signal's slot list.
  addToDictArray(SwitchBoard, signal, slot);
};

// When a signal is emitted, add it to the queue
// The dispatch is run only if this is the first signal that came in
// If signal handling causes more signals to be emitted, they will be added to the queue and be picked up
// by the next loop of the dispatch code.
const emit = (signal: SignalName, data: any = null) =>
{
  SignalQueue.push({signal, data});
  if(SignalQueue.length === 1) dispatch();
};

// Dispatch the signals in the queue
const dispatch = () =>
{
  // Keep looping till the queue is empty (slots may emit more signals to get queued)
  while(SignalQueue.length)
  {
    // Grab the first signal call all slots
    // We dont remove it from the queue yet, so that any other signals emitted by the slots are queued up
    const sig: Signal = SignalQueue[0];
    const slots = SwitchBoard[sig.signal] || [];
    for(const slot of slots)
    {
      slot(sig.data, sig.signal);
    }

    // Pop the processed signal
    SignalQueue.shift();
    //console.log(sig);
  }
};

// endregion Signal and Slot handling
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// region JSX handling

// Allow any string as a tag name for our JSX
declare namespace h.JSX
{
  interface IntrinsicElements {[elemName: string]: any;}
}

// These are special properties that are objects and should not be treated as children
const SpecialAttr = ['ref', 'style', 'signals', 'selector', 'bind', 'template'];


// Our custom hyperscript function.
// It builds a nested dictionary of components and their properties.
function h(sTag: string, dctProps: any, ...arrChildren: any[]): any
{
  console.log(sTag);
  console.log('props', JSON.stringify(dctProps));
  console.log('children', JSON.stringify(arrChildren));
  console.log('-----------------');

  const isCollection = dctProps?.trait && dctProps.trait !== 'item';

  // Process children into an object.
  let dctChildObject: { [key: string]: any } = {};
  const processChild = (child: any) =>
  {
    // Skip null values and plain strings.
    if(!child || typeof child === 'string') return;
    const sChildKey = Object.keys(child)[0];
    dctChildObject[sChildKey] = child[sChildKey];
  };

  // A list collection element will have a template property and a selection helper
  if(isCollection)
  {
    dctProps.template = Object.values(arrChildren[0])[0];
  }
  else
  {
    // Iterate over children.
    for(const child of arrChildren)
    {
      // Recursively process children arrays
      if(Array.isArray(child))
        child.forEach(processChild);
      else
        processChild(child);
    }
  }

  // Merge remaining props with the children object
  return {[sTag]: {...dctProps, ...dctChildObject}};
}

// endregion JSX handling
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// region DOM handling
const DOMAttrMap: any =
{
  'input': ['placeholder'],
};


// Finds the index of a collection element, given any child in it
function getIndex(elem: any): number
{
  // Keep moving up the dom tree till we find the top most elem with the _index property
  // or the collection component itself with _trait
  // We can hit the second condition if the event is on the collection component itself
  // and then the return index is null
  while(elem && elem._trait == null && elem._index == null) elem = elem?.parentElement;
  return elem._index;
}


// Attaches event handlers to the element that emit signals
// We can prefix signal names with 'item.' to indicate that the signal is on the item
function attachSignalHandlers(dctProps: Dict, element: HTMLElement, path: string)
{
  for(const signal of dctProps.signals)
  {
    // Item signal handlers are attached to the parent rather than to each item
    const sSignalName = path + '.' + signal;
    if(signal.startsWith('item.'))
    {
      // Item signals will send their index as the data
      element.addEventListener(
        signal.split('.')[1],
        evt => (evt.target !== element) && emit(sSignalName, getIndex(evt.target)),
      );
    }
    else
    {
      element.addEventListener(signal, evt => emit(sSignalName, evt));
    }
  }
}

// Set the properties for an element when planting
function handleProps(dctProps: Dict, element: any, path: string)
{
  // Kind sets the classname(s)
  if(dctProps.kind) element.className = dctProps?.kind;

  // Span is the flexGrow, can be 0 to override with fixed size
  if(dctProps.span != null) element.style.flexGrow = String(dctProps.span);

  // Text just sets the innerText statically
  if(dctProps.text) element.innerText = dctProps.text;

  // We need to save the trait property on the element itself
  if(dctProps.trait) element._trait = dctProps.trait;

  // Signals and data binding
  if(dctProps.signals) attachSignalHandlers(dctProps, element, path);
  if(dctProps.bind) bindList(dctProps, dctProps.bind);

  // copy all the style properties into the element style
  if(dctProps.style)
  {
    for(const [prop, value] of Object.entries(dctProps.style))
    {
      element.style.setProperty(prop, value as string);
    }
  }

  // Save the ref in the component object
  dctProps.ref = element;
}


function plantDOMTree(dct: ComponentMap, elemSite: HTMLElement, path: string = ''): ComponentMap
{
  for(const sKey in dct)
  {
    const dctProps: Dict = dct[sKey];
    let tagName: string = dctProps.tag || 'div';
    let element: HTMLElement;
    element = document.createElement(tagName);

    // Save the path
    path = path ? (elemSite.dataset.path + '.' + sKey) : sKey;
    element.dataset.path = path;

    //console.log(element, path);

    handleProps(dctProps, element, path);

    // Recursively process children
    for(const prop in dctProps)
    {
      const child: any = dctProps[prop];

      // Skip special props
      if(!SpecialAttr.includes(prop))
      {
        // If the child is an object, and not a special property, then it is a child component
        if(typeof child === "object")
        {
          if(Array.isArray(child))
            child.forEach(item => plantDOMTree({[prop]: item}, element, path));
          else
            plantDOMTree({[prop]: child}, element, path);
        }
        else if(typeof child === "string" && DOMAttrMap[tagName]?.includes(prop))
        {
          element.setAttribute(prop, child);
        }
      }
    }

    // Attach the element to the site
    elemSite.appendChild(element);
  }

  // Return the first element of the tree (used to save the top level element as the application object)
  return firstDictVal(dct);
}

// Given a component and a dotted property path, return the component ref for the elem at that path and the prop name
// For example getPathRef(app, 'todos.box.boxColor.color') will return [todos.box.boxColor.ref, 'color']
export function getPropPathRef(comp: any, path: string): any
{
  // Split the path into an array
  const arrPath: string[] = path.split('.');
  let target = comp;

  // Iterate over the all but the last of the dotted path, walking down the component tree
  for(let i = 0; i < arrPath.length - 1; i++)
  {
    const key = arrPath[i];
    target = target[key];
  }

  // The prop name is the last element of the path
  return [target, arrPath.pop()];
}

// Helper to make updater functions for style attribute, classname or property
const makeUpdater = ( prop: string, apply: (target: any, propName: string, value: any) => void) => {
  return (comp: any, value: any) =>
  {
    const [target, propName] = getPropPathRef(comp, prop);
    apply(firstDictVal(target)?.ref || target.ref || target, propName, value);
  };
};

// Updater functions for setting properties, styles, attributes and classnames for components
const setProp = (prop: string) => makeUpdater(prop, (target, propName, value) => target[propName] = value);
const setStyle = (prop: string) => makeUpdater(prop, (target, propName, value) => target.style[propName] = value);
const setClass = (prop: string) => makeUpdater(prop, (target, propName, value) => target.classList.toggle(propName, value));
const setAttr = (prop: string) => makeUpdater(prop, (target, propName, value) => target.setAttribute(propName , value));

// endregion DOM handling
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// region Data Binding

// Abstraction of an array like collection that emits signals on add, set, delete and can be selected
class List<T>
{
  // Store data as an array
  private _data: T[] = [];

  // Name the list the same as the component that uses it - for example data.todos = new List<TodoItem>('todos')
  private readonly _name: string;

  // Currently selected index
  private _selected: number = -1;

  // place holder for slots - TODO: Why not make all the methods slots
  public slots: any;

  constructor(name: string)
  {
    this._name = name;

    this.slots = {
      // Single select slot
      doSelect: (index: number) =>
      {
        if(this._selected !== index)
        {
          // Emit a signal to deselect the current selection
          if(this._selected >= 0)
            emit(`${this._name}.sel`, {index: this._selected, selected: false});

          // Emit a signal to select the new item
          this._selected = index;
          emit(`${this._name}.sel`, {index, selected: true});
        }
      }
    }
  }


  get name(): string {return this._name;}

  get items(): T[] {return this._data;}

  get selectedItem(): T
  {
    return this._data[this._selected];
  }

  public add(item: T): void
  {
    this._data.push(item);
    const ii: IndexedItem = {item, index: this._data.length - 1};
    emit(`${this._name}.+`, ii);
  }

  public set(index: number, item: T): void
  {
    this._data[index] = item;
    emit(`${this._name}.*`, item);
  }

  public del(index: number): void
  {
    this._data.splice(index, 1);
    emit(`${this._name}.-`, index);
  }

  public addAll(items: T[]): void
  {
    // TODO
  }
}

// Connects the collection component to the list
function bindList(comp: Component, list: List<any>)
{
  console.assert(comp.trait, 'Collection components must have a trait property');

  const name = list.name;
  const template = comp.template;

  // Components have tag as a JSX parsed Object
  const isComp = typeof template.tag == 'object';

  // Makes a tree of components with only the ref property
  // For e.g. {box: {ref: <div>}, boxColor: {ref: <div>}}
  const getChildRefs = (dct: any) =>
  {
    const refs: Dict = {};
    for(const key of Object.keys(dct))
    {
      const child = dct[key];
      if(child.ref) refs[key] = {ref: child.ref};
      if(child.tag || child.kind) Object.assign(refs[key], getChildRefs(child));
    }
    return refs;
  }

  // Applies the updater functions to the element for each key in data
  const setData = (data: IndexedItem, elem: any) =>
  {
    for(const key of Object.keys(data.item))
    {
      template[key](elem.refs[data.index], data.item[key]);
    }
  }

  // Add an element to the list
  const addElem = (data: IndexedItem) =>
  {
    // Get the template and make the DOM element, set all properties, add to the parent, save ref
    const elem = document.createElement(template.tag);

    // Inserting an element into the dom tree is slow unless it is at the end
    // We always need to update the dataset.index property of all elements below the new one
    // It seems from benchmarks that we may as well append at the end, and update all the elements from the
    // insertion point

    elem._index = data.index;
    comp.ref.appendChild(elem);
    addToDictArray(comp, 'refs', elem);
    setData(data, comp);
  }

  const addComp = (data: IndexedItem) =>
  {
    // Inject parent path into the item
    const tag = {...template.tag};
    //tag[Object.keys(tag)[0]].parent = comp.ref.dataset.path;

    // Plant the dom subtree, then save the refs of all children in a tree
    plantDOMTree(tag, comp.ref, comp.ref.dataset.path);
    const childRefs = getChildRefs(template.tag);
    addToDictArray(comp, 'refs', childRefs);

    // Get the top level element and save the index into it
    firstDictVal(comp.refs[data.index]).ref._index = data.index;
    setData(data, comp);
  }

  const delElem = (index: number) =>
  {
    const elem = comp.refs[index];
    comp.ref.removeChild(elem);
    comp.refs.splice(index, 1);
  }

  // Connect the list signals to corresponding ones here
  wire(`${name}.+`, isComp? addComp: addElem);
  wire(`${name}.-`, delElem);

  if( comp.selector)
  {
    wire(`${name}.sel`, item => comp.selector(comp.refs[item.index], item.selected));
  }
}

// endregion Data Binding
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// region Misc Helpers
function addToDictArray(dct: any, key: string, item: any)
{
  if(!dct[key]) dct[key] = [];
  dct[key].push(item);
}

function firstDictVal(dct: any): any
{
  return dct[Object.keys(dct)[0]];
}

export function addSlot(comp:any, name: string, func: any)
{
  if(!comp.slots) comp.slots = {};
  comp.slots[name] = func.bind(comp);
}
// endregion Misc Helpers
///////////////////////////////////////////////////////////////////////////////


export {Dict, ComponentMap, Component, CollectionComponent, IndexedItem, List};
export {wire, emit, SignalName, Slot};
export {h, plantDOMTree, setProp, setStyle, setClass};
