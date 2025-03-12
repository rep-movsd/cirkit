/** @jsx h */

declare namespace h.JSX {
  interface IntrinsicElements { [elemName: string]: any; }
}


// Our custom hyperscript function.
// It builds a nested dictionary whose keys are constructed as tag+id (if id is provided).
function h(sTag: string, dctProps: any, ...arrChildren: any[]): any
{
  //console.log(`\nh: tag=${sTag}, dctProps=${JSON.stringify(dctProps)}, arrChildren=${JSON.stringify(arrChildren)}`);

  // The JSX tag is the component name and becomes the key in the dictionary.

  // Process children into an object.
  let dctChildObject: { [key: string]: any } = {};
  const processChild = (child: any) =>
  {
    // Skip null values and plain strings.
    if(!child || typeof child === 'string') return;
    const sChildKey = Object.keys(child)[0];
    dctChildObject[sChildKey] = child[sChildKey];
  };

  // A collection element with childTag has only one adaptor child.
  if(dctProps?.trait == 'list')
  {
    dctProps['adaptor'] = Object.values(arrChildren[0])[0];
  }
  else
  {
    // Iterate over children.
    for(const child of arrChildren)
    {
      if(Array.isArray(child))
        child.forEach(processChild);
      else
        processChild(child);
    }
  }

  // Merge remaining props with the children object after removing id
  return {[sTag]: {...dctProps, ...dctChildObject}};
}

export {h};
