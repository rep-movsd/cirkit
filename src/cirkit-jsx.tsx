/** @jsx h */

declare namespace h.JSX {
  interface IntrinsicElements { [elemName: string]: any; }
}


// Our custom hyperscript function.
// It builds a nested dictionary of components and their properties.
function h(sTag: string, dctProps: any, ...arrChildren: any[]): any
{
  //console.log(`\nh: tag=${sTag}, dctProps=${JSON.stringify(dctProps)}, arrChildren=${JSON.stringify(arrChildren)}`);

  // Process children into an object.
  let dctChildObject: { [key: string]: any } = {};
  const processChild = (child: any) =>
  {
    // Skip null values and plain strings.
    if(!child || typeof child === 'string') return;
    const sChildKey = Object.keys(child)[0];
    dctChildObject[sChildKey] = child[sChildKey];
  };

  // A collection element with childTag has only one template child.
  if(dctProps?.trait == 'list')
  {
    dctProps.template = Object.values(arrChildren[0])[0];
  }
  else
  {
    // Iterate over children.
    for(const child of arrChildren)
    {
      // Recursively process children arrays
      if(Array.isArray(child))
        child.forEach(processChild);
      else
        processChild(child);
    }
  }

  // Merge remaining props with the children object
  return {[sTag]: {...dctProps, ...dctChildObject}};
}

export {h};
