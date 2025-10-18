///////////////////////////////////////////////////////////////////////////////
// region Misc Helpers
function addToDictArray(dct: any, key: string, item: any)
{
  if(!dct[key]) dct[key] = [];
  dct[key].push(item);
}

function firstDictVal(dct: any): any
{
  return dct[Object.keys(dct)[0]];
}

export function addSlot(comp:any, name: string, func: any)
{
  if(!comp.slots) comp.slots = {};
  comp.slots[name] = func.bind(comp);
}
// endregion Misc Helpers
///////////////////////////////////////////////////////////////////////////////
