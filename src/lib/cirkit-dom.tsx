import {TComponentDef, TComponentName, TJSXElement, isCompName, TStateBindingMap} from './cirkit-component';
import {isStateBinding, TStateToken} from './cirkit-state';

function isJSXElement(x: any): x is TJSXElement {return x && typeof x === 'object' && typeof x.tag === 'string';}

type TChildNodeType = 'State' | 'JSX' | 'Static';
function getChildNodeType(child: any): TChildNodeType {
  if(isStateBinding(child)) return 'State';
  if(isJSXElement(child)) return 'JSX';
  if(typeof child === 'string' || typeof child === 'number') return 'Static';
  throw new Error('Unknown child node type');
}


export function createDOM(appdef: TComponentDef, root: HTMLElement = document.body) {
  normalizeAppDef(appdef);
  renderNode(appdef, root);
}


// Preprocesses a component tree and converts
// Short form $foo: <div> </div> to canonical $foo: { elem: <div> </div> }
export function normalizeAppDef(node: TComponentDef) {
  for (const key of Object.keys(node)) {
    if(isCompName(key))
    {
      const child = node[key as TComponentName];
      if(isJSXElement(child)) {
        node[key as TComponentName] = { elem: child as TJSXElement } satisfies TComponentDef;
      }
      else {
        normalizeAppDef(child as TComponentDef);
      }
    }
  }

  // Normalize the the structure so that we always have an elem key with attrs and tag properties.
  // style properties are put into attrs as well for components that are not JSX elements
  if(!node?.elem) node.elem = {tag: node.tag || 'div', ...{attrs: node.attrs ?? {}}}
  delete node.attrs;
  delete node.tag;
}

// Applies attributes to a DOM element
function setAttrs(elem: HTMLElement, attrs: any)
{
  if(attrs)
  {
    for(const [k, v] of Object.entries(attrs))
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


// Renders a JSX element into a DOM element
function renderJSX(node: TJSXElement, registerBinding?: (key: string, textNode: Text) => void): HTMLElement
{
  const el = document.createElement(node.tag);
  setAttrs(el, node.attrs);

  // Handle multiple children
  if(node.children)
  {
    for(const child of node.children)
    {
      let elemNew: HTMLElement | Text;
      switch(getChildNodeType(child))
      {
        case 'JSX':     elemNew = renderJSX(child as TJSXElement, registerBinding);       break;
        case 'Static':  elemNew = document.createTextNode(String(child));  break;
        case 'State':
          if(!registerBinding)
            throw new Error('State binding found outside a stateful component');
          registerBinding((child as TStateToken).state, elemNew = document.createTextNode(''));
          break;
        default:
          throw new Error('Unknown child node type');
      }

      el.appendChild(elemNew);
    }
  }
  return el;
}

// Renders a component node and its children into DOM elements
function renderNode(comp: any, elemParent: any = document.body, bindingOwner: any = null)
{
  // Determine the topmost stateful owner - either this component with an update function or what was passed down
  const isStatefulRoot = typeof comp.update === 'function';
  const owner = isStatefulRoot ? comp : bindingOwner;

  // Initialize the bindings map (which contains a map of state keys to arrays of text nodes)
  if(owner && !owner.bindings) owner.bindings = {} as TStateBindingMap;

  // Pass this function down the tree so nested children will register their state bindings to the topmost owner
  const registerBinding = owner ? (key: string, textNode: Text) => (owner.bindings[key] ??= []).push(textNode) : undefined;

  // Render the element and append it to the parent if not exists
  comp.ref = comp.ref || elemParent.appendChild(renderJSX(comp.elem, registerBinding));

  // Render children
  Object.keys(comp).filter(isCompName).map(sChild => renderNode(comp[sChild], comp.ref, owner));
}
