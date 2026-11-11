import {DRAWERS} from '../chrome.mjs';
import {mutationObserverFor} from './mutation-observer.mjs';
const normalizedDocuments=new WeakSet();

// Native host markup belongs to the test environment, never the editor runtime.
export function seedNativeChat(document) {
 if(!normalizedDocuments.has(document)){document.defaultView.MutationObserver=mutationObserverFor(document);normalizedDocuments.add(document);}
 const chat=document.querySelector('#chat');
 if(!chat)throw new Error('seedNativeChat requires the host #chat');
 if(!chat.querySelector('.mes'))for(const [id,user] of [[0,false],[1,true],[2,false]])chat.insertAdjacentHTML('beforeend',`<div class="mes" mesid="${id}" is_user="${user}" is_system="false"><div class="mesAvatarWrapper"><div class="avatar"><img src="/native-avatar-${id}.png"></div><div class="mesIDDisplay">#${id}</div><div class="tokenCounterDisplay">42</div><div class="mes_timer">2.5s</div></div><div class="mes_block"><div class="ch_name"><div class="flex1"><div class="alignItemsBaseline"><span class="name_text">${user?'用户':'角色'}</span><small class="timestamp">2026-11-11 12:00</small></div></div><div class="mes_buttons"><button class="mes_edit mes_button">编辑</button><button class="mes_button extraMesButtonsHint">更多</button><div class="extraMesButtons"><button class="mes_copy">复制</button></div></div><div class="mes_edit_buttons" style="display:none"><button>取消</button></div></div><details class="mes_reasoning_details" data-state="done"><summary class="mes_reasoning_summary"><div class="mes_reasoning_header"><span class="mes_reasoning_header_title" data-duration="2.5">原生思维耗时</span><span class="arrow">⌄</span></div><button class="mes_reasoning_copy">复制</button></summary><div class="mes_reasoning">原生思维正文</div></details><div class="mes_text"><p>原生消息正文 ${id}</p></div></div><button class="swipe_left">上一条</button><div class="swipeRightBlock"><span class="swipes-counter">1/2</span><button class="swipe_right">下一条</button></div></div>`);
 if(!document.querySelector('#top-bar'))document.body.insertAdjacentHTML('afterbegin',`<div id="top-bar"><div id="top-settings-holder">${DRAWERS.map(([id,label])=>`<div class="drawer" id="${id}"><button class="drawer-toggle"><span class="drawer-icon">${label}</span></button></div>`).join('')}</div></div>`);
 for(const [id,label] of DRAWERS){const drawer=document.getElementById(id);if(!drawer||drawer.querySelector('.drawer-content'))continue;
  const content=document.createElement('div');content.className='drawer-content';content.id='native-content-'+id;content.innerHTML=`<h4>${label}</h4><input class="text_pole" aria-label="${label}测试设置" value="原生设置"><textarea class="text_pole" aria-label="${label}测试文本">原生文本</textarea>`;drawer.append(content);
  drawer.querySelector('.drawer-toggle')?.addEventListener('click',()=>content.classList.toggle('openDrawer'));
 }
 let holder=document.querySelector('#form_sheld');if(!holder){holder=document.createElement('div');holder.id='form_sheld';(document.querySelector('#sheld')||document.body).append(holder);}
 if(!document.querySelector('#send_form')){
  const textarea=document.querySelector('#send_textarea');
  holder.insertAdjacentHTML('beforeend','<form id="send_form"><div id="nonQRFormItems"><div id="leftSendForm"><button id="options_button">菜单</button><button id="extensionsMenuButton">工具</button></div><div id="rightSendForm"><button id="send_but">发送</button><button id="mes_stop" hidden>停止</button></div></div></form>');
  const composer=document.querySelector('#nonQRFormItems');if(textarea)composer.insertBefore(textarea,document.querySelector('#rightSendForm'));else composer.insertAdjacentHTML('beforeend','<textarea id="send_textarea">真实当前草稿</textarea>');
 }
 return {chat,messages:[...chat.querySelectorAll('.mes')],avatars:[...chat.querySelectorAll('.avatar > img')],textarea:document.querySelector('#send_textarea')};
}

// Execute queued animation frames in order, retaining normal asynchronous timing.
export const requestNativeFrame=callback=>setImmediate(()=>callback(Date.now()));
export const cancelNativeFrame=id=>clearImmediate(id);
export async function settleNativeCanvas(){for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));}
