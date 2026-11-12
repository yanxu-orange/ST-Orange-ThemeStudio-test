/** Copy normalized, JSON-shaped theme data without serializing immutable strings.
 * Every mutable object/array is isolated; image strings can safely stay shared.
 * This is not a general-purpose clone for DOM nodes, Maps, or cyclic objects. */
export function snapshotDraft(value){
  if(!value||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(snapshotDraft);
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,snapshotDraft(item)]));
}
