import {emit, wire, Slot} from './cirkit-junction.js';


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
  const adaptor = comp.adaptor;

  const addElem = (_: any, data: any) =>
  {
    // Get the adaptor from the parent component and make the DOM element
    const elem = document.createElement(adaptor.tag);

    // Set each property via the adaptor functions
    for(const key of Object.keys(data))
    {
      const setter = adaptor[key];
      setter(elem, data[key]);
    }

    // Add to the DOM
    comp.ref.appendChild(elem);
  }

  wire(`${name}.add`, addElem);

}


export {addSlot, connectList, List};
