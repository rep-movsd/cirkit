import {emit, wire, Slot, Signal} from './cirkit-junction.js';
import {plantDOMTree} from './cirkit-dom.js';
import type {Component, IndexedItem} from './cirkit-types.js';

export function addToDictArray(dct: any, key: string, item: any)
{
  if(!dct[key]) dct[key] = [];
  dct[key].push(item);
}

export function firstDictVal(dct: any): any
{
  return dct[Object.keys(dct)[0]];
}

export function addSlot(comp:any, name: string, func: any)
{
  if(!comp.slots) comp.slots = {};
  comp.slots[name] = func.bind(comp);
}

export class List<T>
{
  private _data: T[] = [];
  private readonly _name: string;
  private _selected: number = -1;

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
}


export function bindList(comp: Component, list: List<any>)
{
  const name = list.name;
  const template = comp.template;

  // Components have tag as a JSX parsed Object
  const isComp = typeof template.tag == 'object';

  // Makes a tree of components with only the ref property
  const getChildRefs = (dct: any) =>
  {
    const refs: any = {};
    for(const key of Object.keys(dct))
    {
      const child = dct[key];
      if(child.ref) refs[key] = {ref: child.ref};
      if(child.tag || child.kind) Object.assign(refs[key], getChildRefs(child));
    }
    return refs;
  }

  const setData = (data: IndexedItem, elem:any) =>
  {
    // Set each property via the adaptor functions
    for(const key of Object.keys(data.item))
    {
      const setter = template[key];
      setter(elem.refs[data.index], data.item[key]);
    }
  }

  const addElem = (data: IndexedItem) =>
  {
    // Get the template and make the DOM element, set all properties, add to the parent, save ref
    const elem = document.createElement(template.tag);
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

  const selector = comp.selector;
  if(selector)
  {
    wire(`${name}.sel`, item => selector(comp.refs[item.index], item.selected));
  }
}
