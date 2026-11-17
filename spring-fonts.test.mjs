import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applySpringFonts,springFontLinks} from './spring-fonts.mjs';
import {validateCaptionStyle} from './captions.mjs';
test('Spring packaged fonts resolve beside the extension on either host',()=>{
 for(const base of ['https://tavern.example/scripts/extensions/third-party/theme/spring-fonts.mjs','http://127.0.0.1:8878/scripts/extensions/third-party/orange-test/spring-fonts.mjs']){
  const links=springFontLinks(base);
  for(const link of Object.values(links)){assert.equal(new URL(link.url).origin,new URL(base).origin);assert.deepEqual(validateCaptionStyle({fontLink:link}).fontLink,link);}
  assert.equal(links.title.faceWeight,'400');assert.equal(links.poem.faceWeight,'300');
 }
 const config={captions:['spring','letter','to-you','other','to-you-second'].map(id=>({id,fontLink:null})),reasoningStyle:{entry:{content:'原诗句'}}};applySpringFonts(config,'https://tavern.example/extension/spring-fonts.mjs');
 assert.equal(config.captions[2].lineHeight,1);assert.deepEqual(config.captions[4].fontLink,config.captions[2].fontLink);assert.equal(config.captions[3].fontLink,null);assert.equal(config.reasoningStyle.entry.content,'原诗句');
 for(const file of ['bodoni-moda-24pt.woff2','poem-serif-light.ttf','LICENSE-Bodoni-Moda.txt','LICENSE-Poem-Serif-Light.txt'])assert.ok(fs.statSync(new URL('./materials/fonts/spring/'+file,import.meta.url)).size>0);
});

test('import rebases only known packaged font links without mutating content or user font settings',async()=>{
 const {rebaseBundledFontLinks}=await import('./spring-fonts.mjs');
 const old='http://127.0.0.1:8878/scripts/extensions/third-party/orange-test/materials/fonts/spring/';
 const config={captions:[{content:'用户改过的文字',fontLink:{url:old+'bodoni-moda-24pt.woff2',faceWeight:'700'}},{fontLink:{url:'https://user.example/fonts/custom.woff2',faceWeight:'400'}}],reasoningStyle:{entry:{content:'另一个诗句',fontLink:{url:old+'poem-serif-light.ttf?v=2#face',faceWeight:'300'}}},other:{fontLink:{url:old+'unknown.ttf',faceWeight:'400'}},external:{fontLink:{url:'https://user.example/materials/fonts/spring/bodoni-moda-24pt.woff2',faceWeight:'400'}},url:old+'bodoni-moda-24pt.woff2'};
 const before=structuredClone(config);
 for(const base of ['https://tavern.example/scripts/extensions/third-party/new-name/index.js','https://other.example/mount/scripts/extensions/third-party/%E6%98%A5%E6%97%A5/index.js']) {
  const next=rebaseBundledFontLinks(config,base);assert.notEqual(next,config);assert.deepEqual(config,before);
  assert.equal(next.captions[0].fontLink.url,new URL('./materials/fonts/spring/bodoni-moda-24pt.woff2',base).href);assert.equal(next.captions[0].fontLink.faceWeight,'700');assert.equal(next.captions[0].content,'用户改过的文字');
  assert.equal(next.reasoningStyle.entry.fontLink.url,new URL('./materials/fonts/spring/poem-serif-light.ttf?v=2#face',base).href);assert.equal(next.reasoningStyle.entry.content,'另一个诗句');
  for(const key of ['other','external','url'])assert.deepEqual(next[key],config[key]);assert.deepEqual(next.captions[1],config.captions[1]);assert.deepEqual(rebaseBundledFontLinks(next,base),next);
 }
 for(const url of ['bad-url','data:font/woff2;base64,AAAA','file:///scripts/extensions/third-party/a/materials/fonts/spring/bodoni-moda-24pt.woff2'])assert.deepEqual(rebaseBundledFontLinks({fontLink:{url}},'https://example.test/index.js'),{fontLink:{url}});
});

test('all editor JSON entry points relocate packaged fonts before validation',()=>{
 const source=fs.readFileSync(new URL('./index.js',import.meta.url),'utf8');
 assert.equal((source.match(/validate\(rebaseBundledFontLinks\(JSON\.parse\((raw|json|contents)\), import\.meta\.url\)\)/g)||[]).length,5);
});
