import {emit, wire, Slot} from './cirkit-junction.js';
import {plantDOMTree} from './cirkit-dom.js';


function addSlot(comp:any, name: string, func: any)
{
  comp[name] = func.bind(comp);
}


class List<T>
{
  private _data: T[] = [];
  private readonly _name: string;

  constructor(name: string)
  {
    this._name = name;
  }

  get name(): string {return this._name;}

  get items(): T[] {return this._data;}

  public add(item: T): void
  {
    this._data.push(item);
    emit(`${this._name}.add`, item);
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
}


function connectList(comp: any, list: List<any>)
{
  const name = list.name;
  const template = comp.template;

  // Components have tag as a JSX parsed Object
  const isComp = typeof template.tag == 'object';

  const setData = (data:any, elem:any) =>
  {
    // Set each property via the adaptor functions
    for(const key of Object.keys(data))
    {
      const setter = template[key];
      setter(elem, data[key]);
    }
  }

  const addElem = (_: any, data: any) =>
  {
    // Get the adaptor from the parent component and make the DOM element
    const elem = document.createElement(template.tag);

    // Set each property via the adaptor functions and add to dom
    setData(data, elem);
    comp.ref.appendChild(elem);
  }

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

  const addComp = (_: any, data: any) =>
  {
    // Plant the dom subtree
    plantDOMTree({...template.tag}, comp.ref);

    // After planting, adaptor.tag has the refs of its DOM elements
    // We need to collect the refs tree for this item
    comp.refs = getChildRefs(template.tag);
    setData(data, comp.refs);
  }

  wire(`${name}.add`, isComp?  addComp: addElem);
}


export {addSlot, connectList, List};
