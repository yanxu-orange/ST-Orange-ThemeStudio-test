// Draft-only color editing. The caller owns configuration and commits once.
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
export const validHex=value=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value);
export function hexToHsv(hex){
 if(!validHex(hex))throw new Error('无效颜色');
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 let h=0;if(d)h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60;
 return {h,s:max?d/max:0,v:max};
}
export function hsvToHex({h,s,v}){
 h=((h%360)+360)%360;s=clamp(s);v=clamp(v);const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;
 const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');
}
export function createColorPicker({document,root}){
 let current=null;
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const style=make('style');style.textContent=`
 .otl-color-dialog{box-sizing:border-box;width:min(360px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;margin:auto;padding:18px;border:1px solid #dce3e1;border-radius:16px;background:#fff;color:#34443e;font:14px/1.5 system-ui,sans-serif;box-shadow:0 12px 44px #172b2526}
 .otl-color-dialog::backdrop{background:#152c2638}.otl-color-dialog *{box-sizing:border-box}.otl-color-dialog h3{font-size:16px;font-weight:600;margin:0 0 12px}.otl-color-dialog button,.otl-color-dialog input{font:inherit;color:inherit}.otl-color-dialog button{min-height:44px;border:1px solid #dce3e1;border-radius:8px;background:#fff;padding:8px 14px;cursor:pointer}.otl-color-dialog :focus-visible{outline:2px solid #507c69;outline-offset:3px}
 .otl-color-sv{position:relative;aspect-ratio:1.6;border-radius:8px;overflow:hidden;touch-action:none;background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),var(--picker-hue);cursor:crosshair}
 .otl-color-dot{position:absolute;width:16px;height:16px;border:2px solid white;border-radius:50%;box-shadow:0 0 0 1px #3337;transform:translate(-50%,-50%);pointer-events:none}
 .otl-color-hue{display:block;width:100%;height:44px;accent-color:#527760;margin:8px 0;background:transparent}.otl-color-hue::-webkit-slider-runnable-track{height:12px;border-radius:9px;background:linear-gradient(to right,red,#ff0,#0f0,#0ff,#00f,#f0f,red)}.otl-color-hue::-moz-range-track{height:12px;border-radius:9px;background:linear-gradient(to right,red,#ff0,#0f0,#0ff,#00f,#f0f,red)}
 .otl-color-fine{display:grid;gap:2px;margin:0 0 8px}.otl-color-fine label{display:grid;grid-template-columns:64px minmax(0,1fr) 40px;align-items:center;gap:8px;font-size:12px}.otl-color-fine input{width:100%;height:44px;margin:0;touch-action:pan-y}.otl-color-fine output{text-align:right;font-variant-numeric:tabular-nums}.otl-color-values{display:flex;gap:12px;align-items:end}.otl-color-values label{display:grid;gap:4px;flex:1}.otl-color-values input{min-width:0;width:100%;min-height:44px;border:1px solid #dce3e1;border-radius:8px;padding:8px;background:#fff;font-size:16px}.otl-color-chip{width:44px;height:44px;border:1px solid #dce3e1;border-radius:8px;display:block}.otl-color-compare{display:grid;gap:4px;font-size:12px;color:#66756f}.otl-color-help{font-size:12px;color:#66756f;margin:10px 0}.otl-color-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}.otl-color-actions .confirm{background:#4e6e5d;color:#fff;border-color:#4e6e5d}.otl-color-error{min-height:18px;color:#a13e3e;font-size:12px}.otl-color-launch{width:44px;min-height:44px;padding:5px!important;background:#fff!important;border:1px solid #ccd8cf!important;border-radius:8px}.otl-color-launch span{display:block;width:100%;height:28px;border-radius:4px;border:1px solid #0001}.color-row{grid-template-columns:minmax(0,1fr) 44px}
 @media(max-width:700px){.otl-color-dialog{max-height:calc(var(--picker-height,100dvh) - 24px);padding:16px}.otl-color-sv{aspect-ratio:1.7}}
 `;root.append(style);
 function cancel(){current?.finish(false);}
 function open({value,label='颜色',trigger,onCommit,isValid=()=>true}){
  cancel();if(!validHex(value)||!isValid())return;
  let hsv=hexToHsv(value),draft=value.toLowerCase(),done=false,pointer=null;const dialog=make('dialog','otl-color-dialog');dialog.setAttribute('aria-label',label+'调色盘');
  const title=make('h3','',label),sv=make('div','otl-color-sv'),dot=make('span','otl-color-dot');sv.tabIndex=0;sv.setAttribute('role','group');sv.setAttribute('aria-label','明暗与饱和度，左右调整饱和度，上下调整亮度');sv.append(dot);
  const hue=make('input','otl-color-hue');hue.type='range';hue.min='0';hue.max='360';hue.step='1';hue.setAttribute('aria-label','色相');
  const fine=make('div','otl-color-fine');
  const fineControl=(name)=>{const row=make('label'),caption=make('span','',name),input=make('input'),output=make('output');input.type='range';input.min='0';input.max='100';input.step='1';input.setAttribute('aria-label',name+'微调');row.append(caption,input,output);fine.append(row);return {input,output};};
  const saturation=fineControl('饱和度'),brightness=fineControl('明度');
  const values=make('div','otl-color-values'),original=make('div','otl-color-compare','原色'),oldChip=make('span','otl-color-chip'),next=make('div','otl-color-compare','新色'),newChip=make('span','otl-color-chip'),hexLabel=make('label','','HEX'),hex=make('input');hex.type='text';hex.maxLength=7;hex.spellcheck=false;hex.setAttribute('aria-label','调色盘 HEX');hexLabel.append(hex);oldChip.style.background=value;original.append(oldChip);next.append(newChip);values.append(original,next,hexLabel);
  const error=make('div','otl-color-error');error.setAttribute('role','status');const actions=make('div','otl-color-actions'),no=make('button','','取消'),yes=make('button','confirm','确认');no.type=yes.type='button';actions.append(no,yes);
  const help=make('p','otl-color-help','点色块选色，用饱和度和明度滑条精细调整；确认后应用。');dialog.append(title,sv,hue,fine,values,error,help,actions);
  const viewport=document.defaultView?.visualViewport;
  const resize=()=>{dialog.style.setProperty('--picker-height',(viewport?.height||document.defaultView?.innerHeight||800)+'px');};
  function finish(commit){if(done)return;done=true;const accepted=commit&&isValid()&&validHex(hex.value);const result=draft;pointer=null;viewport?.removeEventListener('resize',resize);try{dialog.close?.();}catch{}dialog.remove();current=null;if(trigger?.isConnected)trigger.focus?.();if(accepted&&result.toLowerCase()!==value.toLowerCase())onCommit(result);}
  current={finish};
  function render(){draft=hsvToHex(hsv);hex.value=draft;hue.value=String(hsv.h);for(const [control,value]of [[saturation,hsv.s],[brightness,hsv.v]]){control.input.value=String(Math.round(value*100));control.output.textContent=Math.round(value*100)+'%';control.input.setAttribute('aria-valuetext',Math.round(value*100)+'%');}sv.style.setProperty('--picker-hue',hsvToHex({h:hsv.h,s:1,v:1}));dot.style.left=hsv.s*100+'%';dot.style.top=(1-hsv.v)*100+'%';newChip.style.background=draft;sv.setAttribute('aria-description',`饱和度 ${Math.round(hsv.s*100)}%，亮度 ${Math.round(hsv.v*100)}%`);hex.setAttribute('aria-invalid','false');error.textContent='';yes.disabled=false;}
  function point(event){const box=sv.getBoundingClientRect();if(!box.width||!box.height)return;hsv.s=clamp((event.clientX-box.left)/box.width);hsv.v=1-clamp((event.clientY-box.top)/box.height);render();}
  sv.addEventListener('pointerdown',event=>{if(event.button!==undefined&&event.button!==0||event.isPrimary===false||pointer!==null)return;event.preventDefault();pointer=event.pointerId;sv.focus?.();try{sv.setPointerCapture?.(pointer);}catch{}point(event);});
  sv.addEventListener('pointermove',event=>{if(pointer!==null&&event.pointerId===pointer){event.preventDefault();point(event);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])sv.addEventListener(type,event=>{if(event.pointerId===pointer){if(type==='pointerup')point(event);pointer=null;}});
  sv.addEventListener('keydown',event=>{const n=event.shiftKey ? 0.1 : 0.01;switch(event.key){case'ArrowLeft':hsv.s=clamp(hsv.s-n);break;case'ArrowRight':hsv.s=clamp(hsv.s+n);break;case'ArrowUp':hsv.v=clamp(hsv.v+n);break;case'ArrowDown':hsv.v=clamp(hsv.v-n);break;default:return;}event.preventDefault();render();});
  hue.addEventListener('input',()=>{const h=Number(hue.value);if(Number.isFinite(h)){hsv.h=clamp(h,0,360);render();}});
  for(const [control,key]of [[saturation,'s'],[brightness,'v']])control.input.addEventListener('input',()=>{const value=Number(control.input.value);if(Number.isFinite(value)){hsv[key]=clamp(value/100);render();}});
  hex.addEventListener('input',()=>{const valid=validHex(hex.value);hex.setAttribute('aria-invalid',String(!valid));yes.disabled=!valid;error.textContent=valid?'':'请输入 # 加六位颜色值';if(valid){const previousHue=hsv.h;hsv=hexToHsv(hex.value);if(!hsv.s)hsv.h=previousHue;render();}});
  no.addEventListener('click',()=>finish(false));yes.addEventListener('click',()=>finish(true));dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});dialog.addEventListener('close',()=>finish(false));
  dialog.addEventListener('keyup',event=>event.stopPropagation());
  dialog.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();finish(false);}else if(event.key==='Tab'){const nodes=[sv,hue,saturation.input,brightness.input,hex,no,...(yes.disabled?[]:[yes])],at=nodes.indexOf(root.activeElement||document.activeElement);if(event.shiftKey&&(at<=0)){event.preventDefault();nodes.at(-1).focus();}else if(!event.shiftKey&&(at===nodes.length-1)){event.preventDefault();sv.focus();}}});
  root.append(dialog);render();resize();viewport?.addEventListener('resize',resize);try{if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}catch{finish(false);return null;}sv.focus?.();return {cancel:()=>finish(false)};
 }
 return {open,cancel};
}
