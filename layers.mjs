import {uniqueId} from './unique-id.mjs';
export const LAYER_LIMIT = 20;
import {ASSETS} from './catalog.mjs';
import {SHAPE_DEFAULTS,SHAPE_NAMES,validateShapeSettings} from './shape-assets.mjs';
import {validImage} from './image-sources.mjs';
export {validImage} from './image-sources.mjs';
export const KINDS = ['flower', 'star', 'tape', 'leaf', 'custom', 'asset', 'shape'];
export const clone = value => structuredClone(value);

export function newLayer(kind = 'flower', overrides = {}) {
  return { id: uniqueId(), name: kind==='shape'?(SHAPE_NAMES[overrides.shape||SHAPE_DEFAULTS.shape]||'形状'):({flower:'花朵',star:'星星',tape:'纸胶带',leaf:'叶枝',custom:'我的图片',asset:'内置素材'})[kind], kind,
    image:'', width:90, x:8, y:8, opacity:.8, rotation:0, z:2, visible:true,
    anchor:'header', side:'right', scope:'both', asset:'', widthUnit:'px', offsetUnit:'px', vertical:'top', heightPercent:0, ...(kind==='shape'?{...SHAPE_DEFAULTS,opacity:1}:{}), ...overrides };
}

export function migrateLayers(raw) {
  if (Array.isArray(raw.layers)) return validateLayers(raw.layers);
  if (raw.decoration === 'none') return [];
  return validateLayers([newLayer(raw.decoration || 'flower', {
    image:raw.image || '', width:raw.decorationWidth ?? 90, x:raw.decorationX ?? 8,
    y:raw.decorationY ?? 8, opacity:raw.decorationOpacity ?? .8,
  })]);
}

export function validateLayers(raw) {
  if (!Array.isArray(raw) || raw.length > LAYER_LIMIT) throw Error(`最多放置 ${LAYER_LIMIT} 层装饰`);
  const ids = new Set();
  return raw.map(layer => {
    if (!layer || typeof layer!=='object' || Array.isArray(layer) || !KINDS.includes(layer.kind)) throw Error('装饰类型无效');
    if (typeof layer.id !== 'string' || !/^[\w-]{1,80}$/.test(layer.id) || ids.has(layer.id)) throw Error('装饰标识无效或重复');
    ids.add(layer.id);
    const out = newLayer(layer.kind, {id:layer.id});
    if(Object.keys(layer).some(key=>!Object.hasOwn(out,key)))throw Error('装饰包含未知参数');
    if (typeof layer.name !== 'string' || layer.name.length > 80) throw Error('装饰名称过长');
    out.name = layer.name;
    for (const [key, min, max] of [['width',1,500],['x',-300,600],['y',-300,600],['opacity',0,1],['rotation',-180,180],['z',0,20]]) {
      if (!Number.isFinite(layer[key]) || layer[key] < min || layer[key] > max) throw Error('装饰参数超出范围：'+key);
      out[key] = layer[key];
    }
    for (const [key, options] of [['anchor',['header','message','avatar','reasoning-entry','reasoning-body','footer','input']],['side',['left','right']],['scope',['both','ai','user']]]) {
      if (!options.includes(layer[key])) throw Error('装饰选项无效：'+key);
      out[key] = layer[key];
    }
    if(out.anchor==='input'&&out.scope!=='both')throw Error('输入区图片不分AI/用户');
    if (typeof layer.visible !== 'boolean') throw Error('装饰显示状态无效');
    out.visible = layer.visible;
    const height=layer.heightPercent??0;if(!Number.isFinite(height)||height<0||height>100)throw Error('素材区域高度无效');out.heightPercent=height;
    for (const [key, options, fallback] of [['widthUnit',['px','percent'],'px'],['offsetUnit',['px','percent'],'px'],['vertical',['top','bottom'],'top']]) {
      const value=layer[key]??fallback;if(!options.includes(value))throw Error('素材单位或锚点无效');out[key]=value;
    }
    if(layer.asset&&!Object.hasOwn(ASSETS,layer.asset))throw Error('内置素材不存在');
    out.asset=layer.asset||'';
    if(layer.kind==='asset'&&!out.asset)throw Error('未指定内置素材');
    if (layer.image && !validImage(layer.image)) throw Error('装饰图片格式不支持');
    out.image = layer.image || '';
    if(layer.kind==='shape'){
      if(out.image||out.asset||out.heightPercent!==0)throw Error('形状不能包含图片或图片区域高度');
      Object.assign(out,validateShapeSettings(layer));
    }
    return out;
  });
}

// Source rectangle for a cover crop. Positions are percentages of remaining space.
export function cropRect(width, height, ratio, zoom = 1, panX = 50, panY = 50) {
  if (![width,height,ratio,zoom,panX,panY].every(Number.isFinite) || width<=0 || height<=0 || ratio<=0 || zoom<1 || zoom>4 || panX<0 || panX>100 || panY<0 || panY>100) throw Error('裁剪参数无效');
  const w = Math.min(width, height * ratio) / zoom;
  const h = w / ratio;
  return {x:(width-w)*panX/100, y:(height-h)*panY/100, width:w, height:h};
}
