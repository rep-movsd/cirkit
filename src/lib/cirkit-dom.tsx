import type {Component, ComponentMap, Dict} from './cirkit-types';

import {emit} from './cirkit-junction.js';
import {bindList, firstDictVal} from './cirkit-utils.js';

const DOMAttrMap: any =
{
  'input': ['placeholder'],
};

// These are special properties that are objects and should not be treated as children
const SpecialAttr = ['template', 'ref', 'style', 'signals', 'selector', 'parent', 'bind'];


function getIndex(elem: any): number
{
  // Keep moving up the dom tree till we find the top most elem with the _index property or the collection component
  while(!elem._trait && elem._index == null) elem = elem.parentElement;
  return elem._index;
}


function attachSignalHandlers(dctProps: Dict, element: HTMLElement, path: string)
{
  for(const signal of dctProps.signals)
  {
    // Item signal handlers are attached to the parent
    if(signal.startsWith('item.'))
    {
      element.addEventListener(signal.split('.')[1], (evt: any) => (evt.target !== element) && emit(path + '.' + signal, getIndex(evt.target)));
    }
    else
    {
      element.addEventListener(signal, (evt: any) => emit(path + '.' + signal, getIndex(evt.target)));
    }
  }
}


function handleProps(comp: Component, dctProps: Dict, element: any, path: string)
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

  if(dctProps.trait) element._trait = dctProps.trait;

  if(dctProps.signals)
  {
    attachSignalHandlers(dctProps, element, path);
  }

  // Bind the list to the component
  if(dctProps.bind)
  {
    bindList(dctProps, dctProps.bind);
  }

  dctProps.ref = element;
}


export function plantDOMTree(dct: ComponentMap, elemSite: HTMLElement, path: string = ''): ComponentMap
{
  for(const sKey in dct)
  {
    const dctProps: Dict = dct[sKey];
    let tagName: string = dctProps.tag || 'div';
    let element: HTMLElement;
    element = document.createElement(tagName);

    // Save the path
    path = path ? (elemSite.dataset.path + '.' + sKey) : sKey;
    element.dataset.path = path;

    //console.log(element, path);

    handleProps(dct, dctProps, element, path);

    // Recursively process children
    for(const prop in dctProps)
    {
      const child: any = dctProps[prop];

      if(!SpecialAttr.includes(prop))
      {
        // If the child is an object, and not a special property, then it is a child component
        if(typeof child === "object")
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
    }

    elemSite.appendChild(element);
  }

  // Return the first element of the tree (used to save the top level element as the application object)
  return firstDictVal(dct);
}


export const setProp = (prop: string) => (ref: any, value: any) => ref[prop] = value;
export const setAttr = (attr: string) => (ref: any, value: any) => ref.setAttribute(attr, value);
export const setClass = (className: string) =>
  (ref: any, set: boolean) => (firstDictVal(ref)?.ref || ref).classList.toggle(className, set);

export const setStyle = (prop: string) =>
{
  if(!prop.includes('.'))
    return (ref: any, value: any) => ref.style[prop] = value;
  else
    return (comp: any, value: any) =>
    {
      const arrPath: string[] = prop.split('.');
      let styleProp = arrPath.pop()!;
      for(const key of arrPath)
        comp = comp[key];
      comp.ref.style[styleProp] = value;
    }
}
