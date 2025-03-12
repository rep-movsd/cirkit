/**
 * Recursively creates DOM nodes from the data dictionary.
 * @param data - The dictionary representing the component tree.
 * @param container - The existing DOM node to append the elements to.
 */

import {emit} from './cirkit-junction.js';

const DOMAttrMap: any =
{
  'input': ['placeholder'],
};


function plantDOMTree(dct: any, elemSite: HTMLElement): void
{
  for(const sKey in dct)
  {
    const dctProps = dct[sKey];
    let tagName = dctProps.tag || 'div';
    let element: HTMLElement;
    element = document.createElement(tagName);

    if(dctProps.kind) element.className = dctProps?.kind;
    if(dctProps.span) element.style.flexGrow = String(parseFloat(dctProps.span));
    if(dctProps.text) element.innerText = dctProps.text;

    // Recursively process children
    for(const prop in dctProps)
    {
      const child: any = dctProps[prop];
      if(typeof child === "object" && prop !== "adaptor")
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


function exposeEventSignal(app: any, path: string, evt: string)
{
  // Drill down the path like a.b.c.d
  const arrPath = path.split('.');
  let comp = app;
  for(const sKey of arrPath)
  {
    comp = comp[sKey];
  }

  comp.ref.addEventListener(evt, (e: any) => emit(path + '.' + evt, e));
}


const setProp = (prop: string) => (elem: any, value: any) => elem[prop] = value;
const setStyle = (prop: string) => (elem: any, value: any) => elem.style[prop] = value;
const setAttr = (attr: string) => (elem: any, value: any) => elem.setAttribute(attr, value);

export {plantDOMTree, exposeEventSignal, setAttr, setProp, setStyle};


const dctTest = {
  "main": {
    "kind": "VBox",
    "todoList": {
      "tag": "ul",
      "span": 20,
      "childKind": {
        "tag": "li",
        "text": "",
        "color": "",
      },
      "Items": [],
    },
    "todoAdd": {
      "kind": "HBox",
      "span": 1,
      "todoText": {
        "tag": "input",
        "placeholder": "Enter item to add",
        "span": 9,
      },
      "buttonAdd": {
        "tag": "button",
        "text": "Add Item",
        "span": 1,
      },
    },
    "colors": {
      "kind": "HBox",
      "span": 1,
      "childKind": {
        "tag": "button",
        "rgb": "",
      },
      "Items": [],
    },
  },
};
