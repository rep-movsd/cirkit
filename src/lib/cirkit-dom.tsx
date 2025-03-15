import type {Component, ComponentMap, Dict} from './cirkit-types';

import {emit} from './cirkit-junction.js';
import {bindList, firstDictVal} from './cirkit-utils.js';

const DOMAttrMap: any =
{
  'input': ['placeholder'],
};

// These are special properties that are objects and should not be treated as children
const SpecialAttr = ['template', 'ref', 'style', 'signals', 'selector', 'parent', 'bind'];


function handleProps(comp: Component, dctProps: Dict, element: Component, path: string)
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

  if(dctProps.signals)
  {
    for(const signal of dctProps.signals)
    {
      if(dctProps.trait === 'item')
      {
        element.addEventListener
        (
          signal,
          (evt: any) =>
          {
            const index = Array.prototype.indexOf.call(evt.currentTarget.parentElement.children, evt.currentTarget);
            emit(path + '.' + signal, index);
          },
          {capture: true},
        );
      }
      else
      {
        element.addEventListener(signal, (evt: any) => emit(path + '.' + signal, evt));
      }
    }
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


export const setProp = (prop: string) =>
  (refs: any[], value: any, index: number) => refs[index][prop] = value;

export const setAttr = (attr: string) =>
  (refs: any[], value: any, index: number) => refs[index].setAttribute(attr, value);

export const setClass = (className: string) =>
  (refs: any[], index: number, set: boolean) =>
  {
    let ref = refs[index];
    ref = firstDictVal(ref)?.ref || ref;
    ref.classList[set? 'add' : 'remove'](className)
  };


export const setStyle = (prop: string) =>
{
  if(!prop.includes('.'))
    return (refs: any[], value: any, index: number) => refs[index].style[prop] = value;
  else
    return (refs: any[], value: any, index: number) =>
    {
      const arrPath: string[] = prop.split('.');
      let comp = refs[index];
      let styleProp = arrPath.pop()!;
      for(const key of arrPath)
        comp = comp[key];

      comp.ref.style[styleProp] = value;
    }
}
