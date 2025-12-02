import {isCompName, TComponentDef, TStateBindingMap} from './cirkit-component';


// Define a special proxy type
// createState(T) will create a type that has all the keys of T with values as their name, within a TStateKey wrapper
// This allows component definitions to use the state object similar to React:
// <div>{state.txt}</div> where state = createState<{txt: string}>()
// These references are handled by the parser to allow the values to be changed via a setState slot

export type TStateBinding<K extends string> = { state: K };
export type TStateProxy<S> = { readonly [K in keyof S]: TStateBinding<K & string>; };
export function createState<S>(): TStateProxy<S> {
  return new Proxy(
  {},
  {get(_t, prop: string) {return {state: prop}}}
  ) as any;
}

export type TStateToken = { state: string }
export function isStateBinding(x: any): x is TStateToken {
  return x && typeof x === 'object' && typeof (x as any).state === 'string';
}

// Stateful component helpers
type TStatefulFactory<S> = (() => TComponentDef) & { __stateBrand?: S };
type StateOf<F> = F extends { __stateBrand?: infer S } ? S : never;

export function createComponent<S>(
build: (state: TStateProxy<S>) => TComponentDef
): TStatefulFactory<S> {
  const factory = (() => {
    const state = createState<S>();
    return build(state as TStateProxy<S>);
  }) as TStatefulFactory<S>;
  return factory;
}

export function $<F extends TStatefulFactory<any>>(factory: F) {
  type S = StateOf<F>;
  const comp = factory() as TComponentDef & { update(state: S): void };
  // attach a typed update that applies state to this component
  comp.update = (state: S) => applyState(comp, state as any);
  return comp;
}


// Applies the state to a component by updating all bound text nodes
function applyState(comp: any, state: Record<string, any>) {
  const bindings = comp.bindings as TStateBindingMap | undefined;
  if (!bindings) return;

  for (const key in bindings) {
    if (key in state) {
      const value = String((state as any)[key]);
      const nodes = bindings[key];
      for (const node of nodes) {
        node.textContent = value;
      }
    }
  }
}


type TStripDollar<K> = K extends `$${infer R}` ? R : never;

// Only consider keys that start with '$'
type DollarKey<T> = Extract<keyof T, `$${string}`>;

export type TAppStateOf<T> = {
  // For each $key whose value has an update(state: S) function,
  // emit a key without the '$' and value S
  [K in DollarKey<T> as
  T[K] extends { update?: (state: any) => any }
  ? TStripDollar<K>
  : never
  ]:
  T[K] extends { update?: (state: infer S) => any }
  ? S
  : never;
};


// Analog to buildTree: walk the appdef and build an app state container
export function createAppState<T extends TComponentDef>(node: T): TAppStateOf<T> {
  const result: any = {};

  for (const key in node) {
    if (!isCompName(key)) continue;

    const comp = (node as any)[key];

    // If this component has an update(state) function, allocate an empty state object
    if (comp && typeof comp.update === 'function') {
      const stateKey = key.slice(1); // strip leading '$'
      result[stateKey] = {};         // runtime empty, but typed as S via TAppStateOf
    }
  }

  return result as TAppStateOf<T>;
}
