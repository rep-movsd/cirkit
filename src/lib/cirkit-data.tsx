import { emit } from './cirkit-junction.js';

// Structure representing an indexed operation
export type IndexedItem<T = any> = {index: number; item: T};

export class List<T> {
  private _data: T[] = [];
  private readonly _name: string;
  private _selected: number = -1;

  public $$slots: {
    sel: (idx: number) => void;
    add: (ii: IndexedItem<T>) => void;
    del: (ii: IndexedItem<T>) => void;
    set: (ii: IndexedItem<T>) => void;
  };

  constructor(name: string) {
    this._name = name;

    this.$$slots = {
      sel: this.sel.bind(this),
      add: this.add.bind(this),
      del: this.del.bind(this),
      set: this.set.bind(this),
    };
  }

  get name(): string {return this._name;}
  get items(): T[] {return this._data;}
  get item(): T {return this._data[this._selected];}
  get index(): number {return this._selected;}

  private emitSel(selected: boolean) {
    if(this._selected >= 0) {emit(`${this._name}.sel`, { index: this._selected, selected });}
  }

  private sel(ii: number): void {
    const idx = ii ?? -1;
    if(this._selected !== idx) {
      this.emitSel(false);
      this._selected = idx;
      this.emitSel(true);
    }
  }

  private add(ii: IndexedItem<T>): void {
    const { item, index } = ii;
    const idx = index >= 0 ? index : this._data.length;
    this._data.splice(idx, 0, item);

    this.emitSel(false);
    emit(`${this._name}.+`, { item, index: idx });
    this.emitSel(true);
  }

  private del(ii: IndexedItem<T>): void {
    const { index } = ii;
    if (index >= 0 && index < this._data.length) {
      this._data.splice(index, 1);
      emit(`${this._name}.-`, { index });
    }
  }

  private set(ii: IndexedItem<T>): void {
    const { item, index } = ii;
    if (index >= 0 && index < this._data.length) {
      this._data[index] = item;
      emit(`${this._name}.*`, { item, index });
    }
  }
}
