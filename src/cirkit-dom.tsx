import type { Dict, ComponentMap} from './cirkit-types';

import {emit} from './cirkit-junction.js';

const DOMAttrMap: any =
{
  'input': ['placeholder'],
};

// These are special properties that are objects and should not be treated as children
const SpecialAttr = ['template', 'ref', 'style', 'select'];

function plantDOMTree(dct: ComponentMap, elemSite: HTMLElement): void
{
  for(const sKey in dct)
  {
    const dctProps: Dict = dct[sKey];
    let tagName: string = dctProps.tag || 'div';
    let element: HTMLElement;
    element = document.createElement(tagName);

    if(dctProps.kind) element.className = dctProps?.kind;
    if(dctProps.span != null) element.style.flexGrow = String(dctProps.span);
    if(dctProps.text) element.innerText = dctProps.text;
    if(dctProps.style)
    {
      for(const [prop, value] of Object.entries(dctProps.style))
      {
        element.style.setProperty(prop, value as string);
      }
    }

    // Recursively process children
    for(const prop in dctProps)
    {
      const child: any = dctProps[prop];

      // If the child is an object, and not a special property, then it is a child component
      if(typeof child === "object" && !SpecialAttr.includes(prop))
      {
        if(Array.isArray(child))
          child.forEach(item => plantDOMTree({[prop]: item}, element));
        else
          plantDOMTree({[prop]: child}, element);
      }
      else if(typeof child === "string" && DOMAttrMap[tagName]?.includes(prop))
      {
        element.setAttribute(prop, child);
      }
    }

    dctProps.ref = element;
    elemSite.appendChild(element);
  }
}

function exposeEventSignal(app: ComponentMap, path: string, evt: string)
{
  // Drill down the path like a.b.c.d
  const arrPath: string[] = path.split('.');
  let comp: ComponentMap = app;
  for(const sKey of arrPath) comp = comp[sKey];
  comp.ref.addEventListener(evt, (e: any) => emit(path + '.' + evt, e));
}

const setProp = (prop: string) => (elem: any, value: any) => elem[prop] = value;
const setStyle = (prop: string) => (elem: any, value: any) => elem.style[prop] = value;
const setAttr = (attr: string) => (elem: any, value: any) => elem.setAttribute(attr, value);

export {plantDOMTree, exposeEventSignal, setAttr, setProp, setStyle};
