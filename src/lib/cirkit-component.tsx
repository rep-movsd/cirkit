/** @jsx h */
import type {JSX as ReactJSX} from 'react';
import {emit, wire} from './cirkit-junction';

declare global {
  namespace h.JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

// JSX elements get stored into this after parsing, render will create/update the DOM nodes from these
export type TJSXElement = {
  tag: string;
  attrs?: any;
  children?: any[];
};

// BAsic no-brainer JSX parser, converts to a dict
export function h(tag: string, attrs: any, ...children: any[]): TJSXElement {
  return {tag, attrs, children};
}

type TDOMEventName = keyof HTMLElementEventMap;

// Component names start with a $
export type TComponentName = `$${string}`;

// Accepts 'click', 'change', etc., or 'prefix.click', 'prefix.change', etc.
export type TSignalName = TDOMEventName | `${string}.${TDOMEventName}` | `$${string}`;

// Array of names of DOM events that a component will emit signals of
export type TSignals = readonly TSignalName[];

// DOM element attributes type, with partial CSS style
export type TDomAttrs = Omit<Partial<HTMLElement>, 'style'> & { style?: Partial<CSSStyleDeclaration>; };

// This is a map of state key to all DOM Text Nodes that the state key should update
export type TStateBindingMap = Record<string, Text[]>;

// The part of a component excluding the child subcomponents
export type TComponentElem = {
  ref?: HTMLElement;                  // The reference to the underlying DOM element
  tag?: keyof HTMLElementTagNameMap;  // The tag name of the element (if not JSX)
  attrs?: TDomAttrs;                  // and its attributes
  signals?: TSignals;                 // Array of event names that this component emits as signals
  bindings?: TStateBindingMap;        // Map of state keys to text nodes for updating
  update?: unknown;                   // Slot/function that updates a component (typed per component)
}

// Component node structure
export type TComponentDef =
& { [K in TComponentName]: TComponentDef | TJSXElement; }
& { elem?: TComponentDef | TJSXElement }
& TComponentElem;

export const isCompName = (s: string) => s.startsWith('$');
