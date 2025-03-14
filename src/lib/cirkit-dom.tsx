import type {ComponentMap, Dict} from './cirkit-types';

import {emit} from './cirkit-junction.js';

const DOMAttrMap: any =
{
  'input': ['placeholder'],
};

// These are special properties that are objects and should not be treated as children
const SpecialAttr = ['template', 'ref', 'style', 'signals'];


function exposeEvtSignals(dctProps: Dict, element: HTMLElement, path: string)
{
  // Expose signals
  if(dctProps.signals)
  {
    for(const evt of dctProps.signals)
    {
      console.log('expose', element, path, evt);
      element.addEventListener(evt, (e: any) => emit(path + '.' + evt, e));
    }
  }
}

function handleProps(dctProps: Dict, element: HTMLElement, path: string)
{
  // Set the properties
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

  exposeEvtSignals(dctProps, element, path);
}


function plantDOMTree(dct: ComponentMap, elemSite: HTMLElement, path: string = ''): void
{
  for(const sKey in dct)
  {
    const dctProps: Dict = dct[sKey];
    let tagName: string = dctProps.tag || 'div';
    let element: HTMLElement;
    element = document.createElement(tagName);

    // Save the path
    path = path ? path + '.' + sKey : sKey;

    handleProps(dctProps, element, path);

    // Recursively process children
    for(const prop in dctProps)
    {
      const child: any = dctProps[prop];

      // If the child is an object, and not a special property, then it is a child component
      if(typeof child === "object" && !SpecialAttr.includes(prop))
      {
        if(Array.isArray(child))
          child.forEach(item => plantDOMTree({[prop]: item}, element, path));
        else
          plantDOMTree({[prop]: child}, element, path);
      }
      else if(typeof child === "string" && DOMAttrMap[tagName]?.includes(prop))
      {
        element.setAttribute(prop, child);
      }
    }

    element.dataset.path = path;
    dctProps.ref = element;
    elemSite.appendChild(element);
  }
}


const setProp = (prop: string) => (elem: any, value: any) => elem[prop] = value;
const setStyle = (prop: string) => (elem: any, value: any) => elem.style[prop] = value;
const setAttr = (attr: string) => (elem: any, value: any) => elem.setAttribute(attr, value);



export {plantDOMTree, exposeEvtSignals, setAttr, setProp, setStyle};
