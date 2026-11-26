import {commonStyleRules} from '../../../common-style.mjs';
import {rule} from '../core/regions/shared.mjs';
export function commonCss(c,ctx){
 const family=ctx.fontFamily('commonStyle.text.fontLink.url');
 const nativeScope=':is(.drawer-content,dialog.popup:not(.transparent_dialogue_popup):not(:has(.img_enlarged_container)),#options,.options-content,.list-group)';
 const output=commonStyleRules(c,{family,rootScope:nativeScope,dropdownScope:'body > .select2-container--open .select2-dropdown'});
 const {text:t,panel:p,heading:h,button:b}=c.commonStyle,home='#chat > .welcomePanel',font=family?JSON.stringify(family):t.font==='auto'?'var(--mainFontFamily,sans-serif)':t.font;
 const surface=`rgba(${[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)).join(',')},${p.opacity})`;
 return output+'\n'+[
 rule(home,{color:t.color,'font-family':font,'font-size':`calc(${t.size}px * var(--fontScale,1))`,'text-shadow':'none'}),
 rule(home+' .recentChatList > .recentChat',{color:t.color,background:surface,border:`${p.width}px solid ${p.border}`,'border-radius':p.radius+'px','text-shadow':'none'}),rule(home+' .recentChatList > .recentChat:hover',{background:b.hover}),
 rule(home+' :is(.chatMessage,.chatStats,.chatDate)',{color:t.muted}),rule(home+' :is(.recentChatsTitle,.welcomeHeaderVersionDisplay)',{color:h.color,'font-size':`calc(${h.size}px * var(--fontScale,1))`,'font-weight':h.weight,'text-shadow':'none'}),rule(home+' .mes_button',{color:b.color,opacity:1,filter:'none','text-shadow':'none'})].join('\n');
}
