// Responsive controls only: values still travel through the existing number input.
export function stepOptions(base=1){return [1,5,10].map(n=>Number((n*base).toFixed(8)));}
export function steppedValue(value,delta,min,max){return Math.max(min,Math.min(max,Number((value+delta).toFixed(8))));}
export function addNumericStepper(row,range,number){
 const doc=row.ownerDocument,make=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 const title=range.getAttribute('aria-label')||'数值',base=Number(number.step)||1;
 const minus=make('button','numeric-minus','−'),plus=make('button','numeric-plus','＋'),steps=make('select','numeric-step');
 for(const button of [minus,plus])button.type='button';minus.setAttribute('aria-label',title+' 手机减少');plus.setAttribute('aria-label',title+' 手机增加');steps.setAttribute('aria-label',title+' 调整步长');
 for(const value of stepOptions(base)){const option=make('option','','步长 '+value);option.value=String(value);option.selected=value===base;steps.append(option);}number.setAttribute('inputmode',base<1?'decimal':'numeric');
 const emit=type=>number.dispatchEvent(new doc.defaultView.Event(type,{bubbles:true}));
 const change=direction=>{const current=Number(number.value),min=Number(number.min),max=Number(number.max);if(number.value===''||!Number.isFinite(current)||current<min||current>max)return;const next=steppedValue(current,direction*Number(steps.value),min,max);if(next===current)return;emit('change');number.value=String(next);emit('input');emit('change');};
 minus.addEventListener('click',e=>{e.preventDefault();change(-1);});plus.addEventListener('click',e=>{e.preventDefault();change(1);});
 for(const node of [minus,plus,steps])row.insertBefore(node,range);return {minus,plus,steps};
}
export const NUMERIC_STEPPER_CSS=`.numeric-row>.numeric-minus,.numeric-row>.numeric-plus,.numeric-row>.numeric-step{display:none}@media(max-width:700px){.numeric-row>.nudge-button{display:none!important}.numeric-row,.numeric-row.position-nudge{grid-template-columns:42px minmax(58px,1fr) 42px auto minmax(88px,auto);gap:5px}.numeric-row>input[type=range]{display:none}.numeric-row>.numeric-minus,.numeric-row>.numeric-plus,.numeric-row>.numeric-step{display:block;min-width:0;min-height:44px;padding:5px}.numeric-row>.numeric-minus{grid-column:1;grid-row:1}.numeric-row>.number-input{grid-column:2;grid-row:1;min-height:44px}.numeric-row>.numeric-plus{grid-column:3;grid-row:1}.numeric-row>.control-unit{grid-column:4;grid-row:1}.numeric-row>.numeric-step{grid-column:5;grid-row:1}.paired-fields:has(.numeric-row){grid-template-columns:minmax(0,1fr)}}`;
