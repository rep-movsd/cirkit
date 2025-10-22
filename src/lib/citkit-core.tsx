/** @jsx h */
import type {JSX as ReactJSX} from 'react';
import {emit} from './cirkit-junction.js';

declare global
{
  namespace h.JSX
  {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

export type TJSXElement = {
  tag: string;
  props?: any;
  children?: any[];
};


export function h(tag: string, props: any, ...children: any[]): TJSXElement
{
  return {tag, props, children};
}

type TLayoutParams = Record<string, any>;
export type TLayout = Record<string, TLayoutParams>

export type TCollectionKind = 'List' | null

// Internal system-reserved keys
type TInternalKey = 'elem' | 'item';

type TDOMEventName = keyof HTMLElementEventMap;

export type TComponentName = `$${string}`;

// Accepts 'click', 'change', etc., or 'prefix.click', 'prefix.change', etc.
export type TSignalName = TDOMEventName | `${string}.${TDOMEventName}`;

export type TSignals = TSignalName[];

export type SignalMap = {
  [key in TSignalName]?: any;
}

export type TComponentElem = {
  ref?: HTMLElement;
  props?: Partial<HTMLDivElement>;
  style?: Partial<CSSStyleDeclaration>;
  layout?: TLayout;
  signals?: TSignals;
}

export type CKTCollectionElem = {
  [K in TInternalKey]?: TJSXElement;
}

// Component node structure
export type CKTComponentDef =
& { [K in TComponentName]: CKTComponentDef | TJSXElement; }
& { [K in TInternalKey]?: CKTComponentDef | TJSXElement }
& { kind?: TCollectionKind }
& TComponentElem


type TLayoutHandler = (params: TLayoutParams, container: HTMLElement) => void;
export const LayoutRegistry: Record<string, TLayoutHandler> = {};


type ExtractComps<T> = {
  // Only allow keys that start with $ and are not InternalKey
  [K in keyof T as K extends TComponentName ? K : never]:
  T[K] extends object
  ?
    // Recursively extract components
    & ExtractComps<T[K]>

    // Add $$ref and $$path for all components
    & { $$ref: HTMLElement | null; $$path: string; }

    // Add $$data and $$items if the component has a kind property
    & (T[K] extends { kind?: TCollectionKind } ? { $$data: any } : {})
    & (T[K] extends { kind?: TCollectionKind } ? { $$items: any } : {})

    // Add $$signal if the component has a signal property
    & (T[K] extends { signals: infer S } ? S extends readonly string[] ? { $$signals: Record<S[number], string> } : {} : {})
  :
    T[K];
};


// Given an app definition, build a same shaped UI tree object with reference to each component
// and $$ref, $$path, $$data, and $$signal to each component node
export function buildTree<T extends object>(app: T, sPath = '', first = true): ExtractComps<T> & { $$path: string }
{
  const result: any = {$$path: sPath};

  for(const key in app)
  {
    const child = app[key];
    if(key.startsWith('$') && typeof child === 'object' && child)
    {
      const currentPath = sPath ? `${sPath}.${key}` : key;
      const node: any = buildTree(child as object, currentPath, false);

      // Attach $$ref
      node.$$ref = (child as any).ref ?? null;

      // Attach $$path
      node.$$path = currentPath;

      // Attach $$signal and wire event listeners
      if('signals' in child && typeof child.signals === 'object')
      {
        node.$$signals = {};

        for (const signalKey of child.signals as string[])
        {
          const signalPath = `${currentPath}.${signalKey}`;
          node.$$signals[signalKey] = signalPath;

          if(node.$$ref)
          {
            node.$$ref.addEventListener(signalKey, () => emit(signalPath, node.$$ref));
          }
        }
      }

      // Attach $$data if it's a collection
      if('item' in child)
      {
        node._data = null;
      }

      result[key] = node;
    }
  }


  if((app as CKTComponentDef).kind === 'List')
  {
    let refItems = null;
    const getItemsRef = (comp: any) : any =>
    {
      if(comp.$items) return comp.$items;

      for(const key in app)
      {
        const child = app[key];
        if(key.startsWith('$') && typeof child === 'object' && child)
        {
          return getItemsRef(child);
        }
      }

      return null
    };

    result._items = getItemsRef(app);
  }

  return result;
}



export function renderApp(appdef: CKTComponentDef)
{
  function setProps(elem: HTMLElement, props: any)
  {
    if(props)
    {
      for(const [k, v] of Object.entries(props))
      {
        if(k === 'style' && typeof v === 'object')
        {
          Object.assign(elem.style, v);
        }
        else if(k in elem)
        {
          (elem as any)[k] = v;
        }
        else
        {
          elem.setAttribute(k, String(v));
        }
      }
    }
  }

  function renderJSX(node: TJSXElement): HTMLElement
  {
    const el = document.createElement(node.tag);
    setProps(el, node.props);

    if(node.children)
    {
      for(const child of node.children)
      {
        if(typeof child === 'string')
        {
          el.appendChild(document.createTextNode(child));
        }
        else if(typeof child === 'object' && child !== null)
        {
          el.appendChild(renderJSX(child));
        }
      }
    }

    return el;
  }

  function preProcessNode(comp: any)
  {
    const hasElem = comp?.elem;

    // First normalize the the structure so that we always have elem with props and tag
    // and style properties are put into props as well for components that are not JSX
    if(!hasElem)
    {
      comp.elem = {
        tag: 'div',
        props: {...(comp.props ?? {}), style: comp.style ?? {}},
      };
    }

    if(!comp.elem.props) comp.elem.props = {};
  }

  function renderNode(comp: any, elemParent: any, bTopLevel = false)
  {
    // Pre-process the component to normalize its structure
    preProcessNode(comp);

    // Render the element and append it to the parent
    comp.ref = renderJSX(comp.elem);
    setProps(comp.ref, comp.elem.props);
    elemParent.appendChild(comp.ref);

    // Delete the render-time properties except layout
    if(!bTopLevel) delete comp.elem;  // preserve elem for the top-level component
    delete comp.props;
    delete comp.style;
    // delete comp.layout;

    const arrComp = Object.keys(comp).filter(k => k.startsWith('$'));
    for(const sChild of arrComp)
    {
      // Get the child dict and handle the case where the component is a direct JSX element without "elem"
      const child = comp[sChild];
      if(child.tag) comp[sChild] = {elem: child};
      renderNode(comp[sChild], comp.ref);
    }

    // All the children are rendered, apply the layout if any
    if(comp.layout)
    {
      const layoutKind = Object.keys(comp.layout)[0];
      const layoutFn = LayoutRegistry[layoutKind];
      layoutFn(comp.layout[layoutKind], elemParent);
    }
  }

  function cloneElem(x: any) {

  }

  const app = JSON.parse(JSON.stringify(appdef));

  renderNode(app, document.body, true);

  return app;
}


const $ = (comp: any) => comp?.$$ref;
