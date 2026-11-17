export function springFontLinks(baseUrl=import.meta.url) {
  return {
    title:{url:new URL('./materials/fonts/spring/bodoni-moda-24pt.woff2',baseUrl).href,faceWeight:'400'},
    poem:{url:new URL('./materials/fonts/spring/poem-serif-light.ttf',baseUrl).href,faceWeight:'300'},
  };
}
export function applySpringFonts(config,baseUrl=import.meta.url) {
  const fonts=springFontLinks(baseUrl);
  for(const caption of config.captions)if(['spring','letter','to-you','to-you-second'].includes(caption.id))caption.fontLink={...fonts.title};
  const toYou=config.captions.find(caption=>caption.id==='to-you');if(toYou)toYou.lineHeight=1;
  config.reasoningStyle.entry.fontLink={...fonts.poem};
  return config;
}

/** Return a copy with known bundled fonts resolved beside the current extension. */
export function rebaseBundledFontLinks(config,baseUrl=import.meta.url) {
  const copy=structuredClone(config);
  const bundled=/\/scripts\/extensions\/third-party\/[^/]+\/materials\/fonts\/spring\/(bodoni-moda-24pt\.woff2|poem-serif-light\.ttf)$/;
  function visit(value) {
    if(!value||typeof value!=='object')return;
    for(const [key,item] of Object.entries(value)) {
      if(key==='fontLink'&&item&&typeof item==='object'&&typeof item.url==='string') {
        let source;try{source=new URL(item.url);}catch{continue;}
        const match=/^https?:$/.test(source.protocol)&&source.pathname.match(bundled);
        if(match){const target=new URL('./materials/fonts/spring/'+match[1],baseUrl);target.search=source.search;target.hash=source.hash;item.url=target.href;}
      } else if(item&&typeof item==='object')visit(item);
    }
  }
  visit(copy);
  return copy;
}
