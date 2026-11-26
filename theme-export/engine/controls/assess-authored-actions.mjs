import {actionDisplay} from './action-display.mjs';
import {assessReading} from './assess-reading.mjs';
export function assessAuthoredActions(c){
 const plan=assessReading(c,{includeActions:false}),a=c.nativeStyle.actions,diagnostics=[...plan.diagnostics],fieldCoverage=[...plan.fieldCoverage];
 const check=(field,ok,reason)=>{fieldCoverage.push({field,owner:'authored-actions',status:ok?'consumed':'unsupported',reason});if(!ok)diagnostics.push({severity:'error',code:'NATIVE_CONTROLS_UNSUPPORTED',field,reason});};
 check('nativeStyle.actions.design',a.design!=='separate','Role-specific action styling is not implemented by this cross-region layout');
 check('nativeStyle.actions.size',a.size>=10&&a.size<=18,'Cross-region text actions support size10..18');
 check('nativeStyle.actions',a.edit.position!==a.more.position,'This path supports independent header/footer actions; same-region intrinsic paired anchors remain on the existing paths');
 for(const key of ['edit','more']){const v=a[key],p='nativeStyle.actions.'+key;
  check(p+'.anchor',v.anchor==='top','Center/bottom header anchors need independent trigger and expansion metrics and are not implemented');
  const m=actionDisplay(a,v);if(m.size!==null)check(p+'.imageSize',m.size<=(320-2*c.cardPadding)*(v.position==='header'?1+v.x/100:1-v.x/100),'Image/icon trigger must fit its authored anchor at the320px contract width');
  check(p+'.text',m.mode!=='text'||!!v.text.trim()&&!/[\r\n]/.test(v.text)&&v.text.length<=8,'Cross-region action labels must be short single-line text');
  check(p+'.x',v.position==='header'?v.x>=-70&&v.x<=0:v.x>=0&&v.x<=40,'Header actions support inward right-edge offsets -70..0%; footer actions support left-origin0..40%; other inward layouts are not implemented');
  check(p+'.y',v.y>=(v.position==='header'?0:24)&&v.y<=100,'Header y0..100 / footer y24..100 are supported; earlier footer coordinates may overlap native stats');
 }
 const tail=a.edit.position==='footer'?a.edit:a.more;
 for(const key of ['floor','time','tokens'])check('nativeStyle.stats.'+key+'.y',c.nativeStyle.stats[key].y+c.nativeStyle.stats.size*1.5<=tail.y,'Footer statistic bottom must precede the actual footer action; header y does not restrict statistics');
 fieldCoverage.push({field:'nativeStyle.actions.color',owner:'authored-actions',status:'consumed',reason:'Original validated auto/HEX color'});
 return {mode:diagnostics.length?'unsupported':'finite-footer',layout:'authored-reading',diagnostics,fieldCoverage};
}
