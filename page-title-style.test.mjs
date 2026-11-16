import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createPageHeaderAdapter,normalizePageHeaders} from './page-headers.mjs';
import {pageHeaderSceneFontEntries} from './page-header-scene.mjs';
const appearance={font:'Georgia, serif',fontLink:{url:'https://example.com/serif.woff2',faceWeight:'400'},lineHeight:1.5,letterSpacing:2};
function fixture(){const {document}=parseHTML('<html><head></head><body><div id="WorldInfo"><div><h3><span data-i18n="Worlds/Lorebooks" style="color:blue">Worlds</span><button>Help</button></h3></div><h3 id="section">Section</h3></div></body></html>');return {document,adapter:createPageHeaderAdapter({document,MutationObserver:class{observe(){}disconnect(){}}})};}
test('optional native title style validates without changing legacy defaults',()=>{
 assert.equal(normalizePageHeaders().pageHeaders.worldbook.titleStyle,null);
 for(const bad of [{...appearance,font:'bad'},{...appearance,size:28},{...appearance,lineHeight:0},{...appearance,letterSpacing:20}])assert.throws(()=>normalizePageHeaders({pageHeaders:{worldbook:{titleStyle:bad}}}));
 assert.throws(()=>normalizePageHeaders({pageHeaders:{settings:{titleStyle:appearance}}}));
});
test('native title appearance uses existing editable size/color/weight and leaves page sections alone',()=>{
 const {document,adapter}=fixture();const c={pageHeaders:{worldbook:{enabled:true,layout:'standard',titleStyle:appearance,titleSize:28,titleColor:'#123456',titleWeight:500}}};
 adapter.update(c);const node=document.querySelector('[data-i18n]');assert.equal(node.style.color,'#123456');assert.equal(node.style.fontSize,'28px');assert.equal(node.style.fontFamily,'Georgia, serif');assert.equal(document.querySelector('#section').style.cssText,'');assert.equal(document.querySelector('button').style.cssText,'');
 c.pageHeaders.worldbook.titleSize=32;c.pageHeaders.worldbook.titleColor='#abcdef';adapter.update(c);assert.equal(node.style.fontSize,'32px');assert.equal(node.style.color,'#abcdef');
 assert.equal(adapter.updateFonts({'page-title-worldbook':'LoadedFont'}),true);assert.match(node.style.fontFamily,/LoadedFont/);
 adapter.update({});assert.equal(node.style.color,'blue');assert.equal(node.style.fontSize,'');adapter.stop();
});
test('hidden original title releases styles and font entries include title dependency',()=>{
 const {document,adapter}=fixture();const c={pageHeaders:{worldbook:{enabled:true,layout:'standard',titleStyle:appearance,titleSize:28,titleColor:'#123456',titleWeight:500}}};adapter.update(c);
 const normalized=normalizePageHeaders(c);assert.deepEqual(pageHeaderSceneFontEntries(normalized)['page-title-worldbook'],{fontLink:appearance.fontLink});
 c.pageHeaders.worldbook.title='Custom banner';adapter.update(c);assert.equal(document.querySelector('[data-i18n]').style.color,'blue');adapter.stop();
});
