/** Match the captured chat width without exceeding the editor's available area. */
export function previewFrameGeometry(chatWidth,viewportWidth,sidebarRight,narrow=false){
 const mobile=viewportWidth<=700,margin=mobile?8:18;
 const available=Math.max(1,viewportWidth-margin-(mobile?8:sidebarRight));
 const desired=narrow?390:Number.isFinite(chatWidth)&&chatWidth>0?chatWidth:available;
 const width=Math.min(desired,available);
 return {width,left:margin+(available-width)/2};
}
