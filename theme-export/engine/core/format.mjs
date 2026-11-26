import {fontFor} from './regions/shared.mjs';

export const THEME_FORMAT_VERSION=1;
export const FORMAT_VARIABLES=Object.freeze({
  bodyFont:'--正文字体',bodySize:'--正文字号',bodyLineHeight:'--正文行高',bodyParagraphGap:'--正文段间距',
  reasoningEntryFont:'--思维入口字体',reasoningEntrySize:'--思维入口字号',
  reasoningBodyFont:'--思维正文字体',reasoningBodySize:'--思维正文字号',
  inputFont:'--输入文字字体',inputSize:'--输入文字字号',
  placeholderFont:'--输入框文案字体',placeholderSize:'--输入框文案字号',
  bodyIndent:'--正文首行缩进',
});

export function createFormatTypography(c,ctx){
  const values={},references={};
  const register=(key,value,fallback=value)=>{
    const property=FORMAT_VARIABLES[key];
    values[key]=value;
    references[key]=`var(${property},${fallback})`;
  };
  const font=(key,value,follows)=>{
    // Preserve native/custom-property inheritance at the original element.
    // CSS-wide keywords are consumed in the declaration fallback, not on :root.
    const deferred=follows||/^(?:inherit|initial|unset|revert(?:-layer)?|var\()/i.test(value);
    register(key,deferred?'initial':value,follows||value);
  };
  const size=(key,value)=>register(key,`${value}px`);
  font('bodyFont',ctx.family('bodyFontLink.url',c.font));
  size('bodySize',c.fontSize);
  register('bodyLineHeight',c.lineHeight);
  size('bodyParagraphGap',c.bodyParagraphGap);
  for(const [part,fontKey,sizeKey] of [
    ['entry','reasoningEntryFont','reasoningEntrySize'],['body','reasoningBodyFont','reasoningBodySize'],
  ]){
    const type=c.reasoningStyle[part];
    font(fontKey,fontFor(c,part,null,ctx),type.fontSource==='body'?references.bodyFont:null);
    size(sizeKey,type.size);
  }
  const input=c.chromeStyle.input;
  if(input.enabled){
    const family=input.fontMode==='chat'?references.bodyFont:input.fontMode==='interface'?'var(--mainFontFamily,sans-serif)':ctx.family('chromeStyle.input.fontLink.url',input.font);
    font('inputFont',family);
    size('inputSize',input.size);
    if(input.emptyText.enabled&&input.emptyText.idle){
      font('placeholderFont',family,references.inputFont);
      size('placeholderSize',input.emptyText.size);
    }
  }
  register('bodyIndent',c.bodyIndent?1:0);
  return {values,...references};
}

const major=title=>`/*\n${'━'.repeat(40)}\n${' '.repeat(12)}🍊 ${title}\n${'━'.repeat(40)}\n*/`;
export const subsection=(title,lines)=>`/* ${'─'.repeat(lines)} 🌱 ${title} 🌱 ${'─'.repeat(lines)} */`;
const block=(title,lines,css)=>css?`${subsection(title,lines)}\n${css}`:'';
const region=(title,...parts)=>[major(title),...parts.filter(Boolean)].join('\n\n');
const declarations=(values,keys)=>keys.filter(key=>Object.hasOwn(values,key)).map(key=>`  ${FORMAT_VARIABLES[key]}: ${values[key]};`).join('\n');
function settingsCss(values,types){
  const groups=[
    ['思维入口',['reasoningEntryFont','reasoningEntrySize']],
    ['思维正文',['reasoningBodyFont','reasoningBodySize']],
    ['聊天正文',['bodyFont','bodySize','bodyLineHeight','bodyParagraphGap']],
    ['实际输入文字',['inputFont','inputSize']],
    ['输入框空框文案',['placeholderFont','placeholderSize']],
  ];
  const text=groups.map(([title,keys])=>{
    const css=declarations(values,keys);
    return css?`  /* ${title} */\n${css}`:'';
  }).filter(Boolean).join('\n\n');
  return [block('中文自定义',7,`:root {\n${text}\n}`),
    block('装饰自定义',7,`:root {\n  /* 首行缩进，1 开启，0 关闭 */\n${declarations(values,['bodyIndent'])}\n}`),
    '/* ━━━━━━━━━│ 禁  止  通  行 │━━━━━━━━━ */',block('内部变量',7,types),
  ].join('\n\n');
}

export function formatThemeCss(sections,{values,header,chrome,glass}){
  return [
    `/* 绘境导出格式：${THEME_FORMAT_VERSION} */`,
    region('变量与自定义设置',settingsCss(values,header.types)),
    region('全局基础样式',block('原生映射与页面基础',5,[header.foundation,sections.canvasColor].filter(Boolean).join('\n'))),
    region('共用控件',block('表单字段',7,sections.common)),
    region('聊天消息',block('消息卡片与头像区',5,header.chat),block('思维入口',7,sections.reasoning),
      block('正文代码与引用',6,sections.body),block('尾部分隔装饰',6,sections.composition),sections.avatarStatic,
      block('消息工具',7,[sections.controlsLayout,sections.controls,sections.controlsSafety].filter(Boolean).join('\n')),glass.message),
    region('顶栏与聊天输入区',block('顶栏',8,chrome.topbar),block('输入台',8,chrome.input),
      block('空框提示',7,chrome.prompt),chrome.artwork,glass.chrome),
    region('页面与插件特殊样式',block('页面容器',7,sections.pages),
      block('页面插画标题',6,sections.pageHeaders),glass.pages),
    region('字体与图片资源',block('图片与图标',7,sections.resources)),
  ].join('\n\n');
}
