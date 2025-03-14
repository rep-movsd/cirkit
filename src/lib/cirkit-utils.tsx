import {emit, wire, Slot} from './cirkit-junction.js';
import {plantDOMTree} from './cirkit-dom.js';
import type {IndexedItem} from './cirkit-types.js'

function addToDictArray(dct: any, key: string, item: any)
{
  if(!dct[key]) dct[key] = [];
  dct[key].push(item);
}

function addSlot(comp:any, name: string, func: any)
{
  if(!comp.slots) comp.slots = {};
  comp.slots[name] = func.bind(comp);
}

class List<T>
{
  private _data: T[] = [];
  private readonly _name: string;
  private _selected: number = -1;

  constructor(name: string)
  {
    this._name = name;
  }

  get name(): string {return this._name;}

  get items(): T[] {return this._data;}

  get selected(): number {return this._selected;}

  public add(item: T): void
  {
    this._data.push(item);
    const ii: IndexedItem = {item, index: this._data.length - 1};
    emit(`${this._name}.add`, ii);
  }

  public set(index: number, item: T): void
  {
    this._data[index] = item;
    emit(`${this._name}.set`, item);
  }

  del(index: number): void
  {
    this._data.splice(index, 1);
    emit(`${this._name}.del`, index);
  }

  // Single select
  select(index: number): void
  {
    if(this._selected !== index)
    {
      // Emit a signal to deselect the current selection
      if(this._selected >= 0)
        emit(`${this._name}.sel`, -1);

      // Emit a signal to select the new item
      this._selected = index;
        emit(`${this._name}.sel`, index);
    }
  }
}


function connectList(comp: any, list: List<any>)
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
      setter(elem.refs, data.item[key], data.index);
    }
  }

  const addElem = (_: any, data: IndexedItem) =>
  {
    // Get the template and make the DOM element, set all properties, add to the parent, save ref
    const elem = document.createElement(template.tag);
    comp.ref.appendChild(elem);
    addToDictArray(comp, 'refs', elem);
    setData(data, comp);
  }

  const addComp = (_: any, data: IndexedItem) =>
  {
    // Plant the dom subtree, then save the refs of all children in a tree
    plantDOMTree({...template.tag}, comp.ref);
    const childRefs = getChildRefs(template.tag);
    addToDictArray(comp, 'refs', childRefs);
    setData(data, comp);
  }

  const delElem = (_: any, index: number) =>
  {
    comp.ref.removeChild(comp.ref.children[index]);
  }

  // Connect the list add signal to the add function
  wire(`${name}.add`, isComp?  addComp: addElem);

}


export {addSlot, connectList, addToDictArray, List};
