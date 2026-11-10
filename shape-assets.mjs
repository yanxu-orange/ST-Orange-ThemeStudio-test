/** Recolorable vector layers. All SVG content is generated from validated values. */
export const SHAPES = Object.freeze(['rectangle','star','heart']);
export const SHAPE_NAMES = Object.freeze({rectangle:'矩形',star:'星形',heart:'爱心'});
export const SHAPE_DEFAULTS = Object.freeze({
  shape:'rectangle',height:90,heightUnit:'px',cornerRadius:12,
  fillMode:'solid',color:'#e5b3b1',color2:'#e9ca81',gradientAngle:90,
});
export const SHAPE_KEYS = Object.freeze(Object.keys(SHAPE_DEFAULTS));
const hex = value => typeof value==='string' && /^#[0-9a-f]{6}$/i.test(value);
const range = (value,min,max) => Number.isFinite(value) && value>=min && value<=max;
const decimal = value => String(Number(value.toFixed(6)));

/** Missing shape settings are invalid, rather than silently migrating old artwork. */
export function validateShapeSettings(layer){
  if(!layer||typeof layer!=='object'||Array.isArray(layer)||layer.kind!=='shape'||!SHAPES.includes(layer.shape))throw Error('形状类型无效');
  if(!['solid','gradient'].includes(layer.fillMode)||!['px','percent'].includes(layer.heightUnit))throw Error('形状填色或高度单位无效');
  if(!range(layer.height,1,500)||!range(layer.cornerRadius,0,250)||!range(layer.gradientAngle,0,360))throw Error('形状参数超出范围');
  if(!hex(layer.color)||!hex(layer.color2))throw Error('形状颜色无效');
  return Object.fromEntries(SHAPE_KEYS.map(key=>[key,layer[key]]));
}

/** Same dimension declarations in all preview and live artwork destinations. */
export function layerSizeStyle(layer){
  return {
    width:layer.width+(layer.widthUnit==='percent'?'%':'px'),
    height:layer.kind==='shape'?layer.height+(layer.heightUnit==='percent'?'%':'px'):layer.heightPercent?layer.heightPercent+'%':'auto',
    objectFit:layer.kind==='shape'?'fill':'contain',
  };
}

/** CSS angle convention: 0 points upward, 90 rightward, 180 downward. */
export function gradientVector(angle,width=100,height=100){
  if(!range(angle,0,360)||!range(width,1,500)||!range(height,1,500))throw Error('渐变方向或尺寸无效');
  const radians=angle*Math.PI/180,dx=Math.sin(radians),dy=-Math.cos(radians);
  // Project all corners onto the gradient direction, matching CSS linear-gradient.
  const span=Math.abs(width*dx)+Math.abs(height*dy);
  return {x1:Number(decimal((width-dx*span)/2)),y1:Number(decimal((height-dy*span)/2)),x2:Number(decimal((width+dx*span)/2)),y2:Number(decimal((height+dy*span)/2))};
}

export function shapeSvg(layer){
  const shape=validateShapeSettings(layer);
  if(!range(layer.width,1,500))throw Error('形状宽度无效');
  const width=layer.width,height=shape.height;
  let defs='',fill=shape.color;
  if(shape.fillMode==='gradient'){
    const vector=gradientVector(shape.gradientAngle,width,height);
    defs=`<defs><linearGradient id="fill" gradientUnits="userSpaceOnUse" x1="${vector.x1}" y1="${vector.y1}" x2="${vector.x2}" y2="${vector.y2}"><stop offset="0" stop-color="${shape.color}"/><stop offset="1" stop-color="${shape.color2}"/></linearGradient></defs>`;
    fill='url(#fill)';
  }
  let path;
  if(shape.shape==='rectangle'){
    const radius=Math.min(shape.cornerRadius,width/2,height/2);
    path=`<rect width="${width}" height="${height}" rx="${decimal(radius)}" fill="${fill}"/>`;
  }else{
    const outline=shape.shape==='star'?'M50 0 61.8034 34.5492 100 38.1966 72.3607 61.8034 80.9017 100 50 78.6475 19.0983 100 27.6393 61.8034 0 38.1966 38.1966 34.5492Z':'M50 100C43 92 0 64 0 30C0 0 35-10 50 17C65-10 100 0 100 30C100 64 57 92 50 100Z';
    // Transform the path coordinates rather than the gradient coordinate system.
    path=`<path d="${outline}" transform="scale(${decimal(width/100)} ${decimal(height/100)})" fill="${fill}"/>`;
    if(shape.fillMode==='gradient'){
      // The path transform also transforms its paint; compensate to retain the angle.
      defs=defs.replace('gradientUnits="userSpaceOnUse"',`gradientUnits="userSpaceOnUse" gradientTransform="scale(${decimal(100/width)} ${decimal(100/height)})"`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${defs}${path}</svg>`;
}

export function shapeDataUrl(layer){
  return layer?.kind==='shape'?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(shapeSvg(layer)):'';
}
