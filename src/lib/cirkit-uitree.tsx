// UI tree node properties
import {TComponentName, TComponentDef, isCompName} from './cirkit-component';
import {emit} from './cirkit-junction';

type TUITree = {
  $$ref: HTMLElement | null;
  $$path: string;
};

type ExtractComps<T> = {
  // Only allow keys that start with $ and are not InternalKey
  [K in keyof T as K extends TComponentName ? K : never]:
  T[K] extends object
  ?
  // Recursively extract components
  ExtractComps<T[K]>

  // Add meta props for all components
  & TUITree

  // Add $$signal if the component has a signal property
  & (
  T[K] extends { signals: infer S }
  ?
  S extends readonly string[] ?
  { $$signals: Record<S[number], string> }
  :
  {}
  :
  {}
  )

  // Add a $$update slot if the component has an update property
  & (
  T[K] extends { update: infer U }
  ?
  { $$update: U }
  :
  {}
  )

  :
  T[K];
};


type TSignalSource = { ref?: HTMLElement | null; signals?: readonly string[]; };


// Returns a $$signals map (or undefined if there are no signals)
function attachSignals( node: TSignalSource, path: string): Record<string, string> | undefined {
  if (!Array.isArray(node.signals) || node.signals.length === 0) {
    return undefined;
  }

  const ref = node.ref ?? null;
  const signals: Record<string, string> = {};

  // Assume DOM events only
  for (const sig of node.signals) {
    const sigPath = path ? `${path}.${sig}` : sig;
    if(ref) ref.addEventListener(sig, () => emit(sigPath, ref));
    signals[sig] = sigPath;
  }
  return signals;
}


// Given an app definition, build a same shaped UI tree object with reference to each component
// and adds $$path, $$signal and $$update to each component node
export function createUITree<T extends TComponentDef>(node: T, sPath = ''): ExtractComps<T> & { $$path: string }
{
  const result: any = {$$path: sPath};
  for(const key in node) {
    if(isCompName(key)) {
      // Recursively build the tree for child components
      result[key] = createUITree(node[key] as any, sPath ? `${sPath}.${key}` : key);
    }
  }

  // Attach $$ref
  result.$$ref = node.ref ?? null;

  // Attach $$signals (if any)
  const signals = attachSignals(node as TSignalSource, sPath);
  if(signals) {
    result.$$signals = signals;
  }

  // Add $$update slot (if any)
  if('update' in node) {
    result.$$update = (node as TComponentDef).update;
  }

  return result;
}
