import {PAGE_ROOTS} from './page-style.mjs';
import {glassRule} from './glass-style.mjs';
/** Only outer surfaces. Do not reuse common panel selectors: they also include
 * nested entries, headings and controls, which would double-filter the backdrop. */
export function glassPageRules(config,{preview=false,page=null,portable=false}={}){
 const root=preview?'html[data-orange-lab]':'html[data-orange-live]',rules=[];
 for(const [key,selector]of Object.entries(PAGE_ROOTS)){
  if(page&&page!==key)continue;
  const target=preview?`${root} #chat>.otl-native-page[data-otl-page="${key}"]`:`${root} ${selector}`;
  rules.push(glassRule(target,config,key,{preview,portable}));
 }
 if(!page||page==='home')rules.push(glassRule(`${root} #chat > .welcomePanel .recentChatList > .recentChat`,config,'home',{preview,portable}));
 return rules.filter(Boolean).join('\n');
}
