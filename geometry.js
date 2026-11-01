export const names=['头部中心','左肩','右肩','左肘','右肘','左腕','右腕','左髋','右髋','左膝','右膝','左踝','右踝','颈部中心'];
export const landmarkIds=[0,11,12,13,14,15,16,23,24,25,26,27,28];
export function makeSvg(points,width,height,{head=100,thick=100,color='#147d61'}={}){
 if(points.length!==14||points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return '';
 const p=points.map(p=>({x:p.x*width,y:p.y*height}));
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const scale=Math.max(Math.min(width,height)*.025,dist(p[1],p[2])*.25,dist(p[13],{x:(p[7].x+p[8].x)/2,y:(p[7].y+p[8].y)/2})*.14);
 const stroke=scale*thick/100;
 const safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'#147d61';
 const line=(ids,w=stroke)=>`<polyline points="${ids.map(i=>`${p[i].x},${p[i].y}`).join(' ')}" fill="none" stroke="${safeColor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><circle cx="${p[0].x}" cy="${p[0].y}" r="${scale*.95*head/100}" fill="${safeColor}"/><polygon points="${[1,2,8,7].map(i=>`${p[i].x},${p[i].y}`).join(' ')}" fill="${safeColor}" stroke="${safeColor}" stroke-width="${stroke*.4}" stroke-linejoin="round"/>${line([1,3,5])}${line([2,4,6])}${line([7,9,11],stroke*1.2)}${line([8,10,12],stroke*1.2)}${line([13,1])}${line([13,2])}</svg>`;
}
