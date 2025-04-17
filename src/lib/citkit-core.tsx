/** @jsx h */
import type {JSX as ReactJSX} from 'react';

declare global
{
  namespace h.JSX
  {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

type JSXElement = {
  tag: string;
  props?: any;
  children?: any[];
};


export function h(tag: string, props: any, ...children: any[]): JSXElement
{
  return {tag, props, children};
}


// Layout with optional span (flexGrow) property
export type CKTLayoutType =
| 'HBox'
| 'VBox'
| `HBox/${number}/${number}`
| `VBox/${number}/${number}`
| `${number}/${number}`;


// Internal system-reserved keys
type InternalKey = 'elem' | 'item';
export type CKTComponentName = `$${string}`;

type DOMEventName = keyof HTMLElementEventMap;

// Accepts 'click', 'change', etc., or 'prefix.click', 'prefix.change', etc.
export type SignalName = DOMEventName | `${string}.${DOMEventName}`;

export type SignalMap = {
  [key in SignalName]?: any;
}

export type CKTComponentElem = {
  ref?: HTMLElement;
  props?: Partial<HTMLDivElement>;
  style?: Partial<CSSStyleDeclaration>;
  layout: CKTLayoutType;
  signal?: SignalMap;
}

export type CKTNativeElem = {
  [K in InternalKey]?: JSXElement;
}


// Component node structure
export type CKTComponentDef =
& { [K in CKTComponentName]: CKTComponentDef | JSXElement; }
& CKTNativeElem
& CKTComponentElem

export function $signal<T extends readonly SignalName[]>(
...signals: T
): { [K in T[number]]: null }
{
  const result = {} as { [K in T[number]]: null };
  for(const sig of signals)
  {
    result[sig as T[number]] = null;
  }
  return result;
}


///////////////


export type ExtractComps<T> = {
  // Only allow keys that start with $ and are not InternalKey
  [K in keyof T as K extends CKTComponentName ? K : never]:
  T[K] extends object
  ?
  // Recursively extract components
  & ExtractComps<T[K]>
  // Add $$ref and $$path for all components
  & { $$ref: HTMLElement | null; $$path: string;}
  // Add $$data if the component has an item property
  & (T[K] extends { item?: any } ? { $$data: any } : {})
  // Add $$signal if the component has a signal property
  & (T[K] extends { signal: infer S } ? { $$signal: { [K in keyof S]: string } } : {})
  :
  T[K];
};


export function buildTree<T extends object>(
app: T,
sPath = '',
first = true,
): ExtractComps<T> & { $$path: string }
{
  const result: any = {$$path: sPath};

  for(const key in app)
  {
    const child = app[key];

    if(key.startsWith('$') && typeof child === 'object' && child)
    {
      // Get the dotted path and recursively build the tree
      const currentPath = sPath ? `${sPath}.${key}` : key;
      const node: any = buildTree(child as object, currentPath, false);

      // Add the ref and the path itself
      node.$$ref = (child as any).ref ?? (null as unknown as HTMLElement);
      node.$$path = currentPath;

      // Assign the complete signal pathname string to each signal entry
      if('signal' in child && typeof child.signal === 'object')
      {
        node.$$signal = {};
        for(const signalKey in child.signal)
        {
          node.$$signal[signalKey] = `${currentPath}.${signalKey}`;
        }
      }

      // Expose $$data as the placeholder for the List<T> binding
      if('item' in child)
      {
        node.$$data = null;
      }

      result[key] = node;
    }
  }

  return result;
}



export function renderApp(app: any)
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

  function renderJSX(node: JSXElement): HTMLElement
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

    // Handle the layout property
    const layout = comp.layout;
    if(layout)
    {
      const arrLayout = layout.split('/');

      // Handle <class>/num/denom or <class>
      if(arrLayout.length !== 2)
      {
        const layoutType = arrLayout[0];
        if(!comp.elem.props.className)
          comp.elem.props.className = layoutType;
        else
          comp.elem.props.className += ` ${layoutType}`;

        arrLayout.shift();
      }

      const flexGrow = arrLayout[0];
      if(flexGrow)
      {
        if(!comp.elem.props.style) comp.elem.props.style = {};
        comp.elem.props.style.flexGrow = Number(flexGrow) | 0;
      }
    }
  }

  function renderNode(comp: any, elemParent: any, bTopLevel = false)
  {
    // Pre-process the component to normalize its structure
    preProcessNode(comp);

    // Render the element and append it to the parent
    comp.ref = renderJSX(comp.elem);
    setProps(comp.ref, comp.elem.props);
    elemParent.appendChild(comp.ref);

    // Delete the render-time properties
    if(!bTopLevel) delete comp.elem;  // preserve elem for the top-level component
    delete comp.props;
    delete comp.style;
    delete comp.layout;

    const arrComp = Object.keys(comp).filter(k => k.startsWith('$'));
    for(const sChild of arrComp)
    {
      // Get the child dict and handle the case where the component is a direct JSX element without "elem"
      const child = comp[sChild];
      if(child.tag) comp[sChild] = {elem: child};
      renderNode(comp[sChild], comp.ref);
    }
  }

  renderNode(app, document.body, true);
}



const $ = (comp: any) => comp?.$$ref;
