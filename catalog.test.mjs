import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {ASSETS,SHARED_ASSETS,ASSET_CATEGORIES,assetUrl,builtinAssetGroups} from './catalog.mjs';
import {newLayer,validateLayers} from './layers.mjs';
import {kittyLayers,defaultPhoto,validatePhotos} from './photos.mjs';

test('shared catalog contains nine real images, grouped consistently, without template-only choices',()=>{
  assert.equal(Object.keys(SHARED_ASSETS).length,9);
  assert.equal(new Set(Object.values(SHARED_ASSETS).map(a=>a.name)).size,9);
  assert.deepEqual(ASSET_CATEGORIES,['贴纸','花饰','邮戳','边框']);
  assert.deepEqual(builtinAssetGroups().map(g=>[g.name,g.assets.length]),[['贴纸',4],['花饰',3],['邮戳',1],['边框',1]]);
  for(const asset of Object.values(SHARED_ASSETS)){
    assert.match(asset.id,/^shared-/);assert.match(asset.path,/^shared\/[\w-]+\.webp$/);assert.ok(asset.theme);
    const bytes=readFileSync(new URL('./materials/'+asset.path,import.meta.url));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes.length>1000);
    assert.equal(ASSETS[asset.id],asset);assert.match(assetUrl(asset.id),/\/materials\/shared\//);
    const layer=newLayer('asset',{asset:asset.id,name:asset.name});assert.deepEqual(validateLayers([layer]),[layer]);
  }
});

test('all twelve kitty resource identities remain resolvable and active template data is unchanged',()=>{
  const expected=[['kitty-ai-cat','01-AI翅膀小猫.webp'],['kitty-ai-window','02-AI窗景.webp'],['kitty-user-window','03-用户窗桌猫与星纹丝带.webp'],['kitty-input-cat','04-输入框深蓝小猫.webp'],['kitty-input-books','05-输入框书本花朵.webp'],['kitty-header-cat','06-页头小猫剪影.webp'],['kitty-header-garden','07-页头混合魔法花园.webp'],['kitty-paper','08-水彩纸带素材.webp'],['kitty-ai-paper','09-AI头像右侧浅蓝纸.webp'],['kitty-user-tape','10-用户头像右侧松胶带.webp'],['kitty-user-sprig','11-用户头像右侧花枝.webp'],['kitty-user-cream','12-用户桌边淡黄竖胶带.webp']];
  for(const [id,file]of expected){assert.equal(ASSETS[id].path,'图片/'+file);assert.ok(existsSync(new URL('./materials/'+ASSETS[id].path,import.meta.url)));assert.equal(SHARED_ASSETS[id],undefined);}
  const layers=kittyLayers(),before=structuredClone(layers);assert.deepEqual(validateLayers(layers),before);assert.deepEqual(layers,before);
  const photos={ai:defaultPhoto({asset:'kitty-header-garden'}),user:defaultPhoto({asset:'kitty-user-window'})};assert.deepEqual(validatePhotos(photos),photos);
  assert.equal(assetUrl('unknown'),'');
});


test('replacement options preserve only the actual current template-owned resource',()=>{
  const groups=builtinAssetGroups('kitty-ai-window');
  assert.equal(groups[0].name,'当前小猫模板素材');
  assert.deepEqual(groups[0].assets,[ASSETS['kitty-ai-window']]);
  assert.equal(groups.flatMap(g=>g.assets).length,10);
  assert.equal(groups.flatMap(g=>g.assets).filter(a=>a.id.startsWith('kitty-')).length,1);
  assert.equal(builtinAssetGroups('shared-mucha-iris').flatMap(g=>g.assets).length,9);
  assert.equal(builtinAssetGroups('unknown').flatMap(g=>g.assets).length,9);
});
