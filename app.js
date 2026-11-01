import {names,landmarkIds,makeSvg} from './geometry.js';
const $=id=>document.getElementById(id),canvas=$('source'),ctx=canvas.getContext('2d');
let photo=null,points=[],manual=false,drag=-1,model=null,busy=false,generation=0;
const status=s=>$('status').textContent=s;
function update(){
 $('headValue').value=$('head').value+'%';$('thickValue').value=$('thick').value+'%';
 const svg=photo?makeSvg(points,canvas.width,canvas.height,{head:+$('head').value,thick:+$('thick').value,color:$('color').value}):'';
 $('preview').innerHTML=svg;$('resultEmpty').style.display=svg?'none':'flex';$('png').disabled=$('svg').disabled=!svg;$('undo').disabled=!manual||!points.length;
 draw();
}
function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);if(!photo)return;ctx.drawImage(photo,0,0,canvas.width,canvas.height);
 if(!$('joints').checked)return;
 const radius=Math.max(canvas.width,canvas.height)*.009;
 points.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,radius,0,Math.PI*2);ctx.fillStyle=i===drag?'#ffca68':'#147d61';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=radius*.25;ctx.stroke();ctx.font=`bold ${radius*1.7}px sans-serif`;ctx.lineWidth=radius*.4;ctx.strokeStyle='#183c34';ctx.strokeText(String(i+1),p.x*canvas.width+radius*1.5,p.y*canvas.height+radius*.5);ctx.fillStyle='white';ctx.fillText(String(i+1),p.x*canvas.width+radius*1.5,p.y*canvas.height+radius*.5);});
}
function next(){status(points.length===names.length?'标注完成！可拖动圆点修正，或调整样式并导出。':`请点击：${names[points.length]}（${points.length+1} / ${names.length}）。可拖动已有圆点修正。`);}
$('file').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){status('请选择 JPG、PNG 或 WebP 图片。');return;}
 if(file.size>30*1024*1024){status('图片超过 30 MB，请先缩小图片。');return;}
 const token=++generation,url=URL.createObjectURL(file),img=new Image();
 try{img.src=url;await img.decode();if(token!==generation)return;const scale=Math.min(1,1600/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);photo=img;points=[];manual=false;$('sourceEmpty').style.display='none';$('dimensions').textContent=`${canvas.width} × ${canvas.height}`;$('detect').disabled=busy;$('manual').disabled=false;status('照片已加载。点击自动识别，或选择手动标注。');update();}catch{status('无法读取照片，请尝试其他 JPG、PNG 或 WebP 文件。');}finally{URL.revokeObjectURL(url);e.target.value='';}
};
$('manual').onclick=()=>{if(points.length&&!confirm('重新手动标注会清除当前关节，继续吗？'))return;generation++;points=[];manual=true;$('joints').checked=true;next();update();};
$('undo').onclick=()=>{points.pop();next();update();};
$('detect').onclick=async()=>{
 if(!photo||busy)return;const token=++generation;busy=true;$('detect').disabled=true;status('正在加载姿态模型，首次需联网下载。照片不会上传……');
 try{
 if(!model){const {FilesetResolver,PoseLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/+esm');const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');model=await PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'IMAGE',numPoses:1});}
 if(token!==generation)return;status('正在识别姿态……');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(token!==generation)return;
 const result=model.detect(photo),lm=result.landmarks?.[0];
 if(!lm)throw new Error('未识别到人体，请换一张完整全身照片，或使用手动标注。');
 if(landmarkIds.some(i=>(lm[i].visibility??1)<.35))throw new Error('部分关节被遮挡或置信度过低，请使用手动标注，或换一张更清晰的全身照片。');
 points=landmarkIds.map(i=>({x:Math.max(0,Math.min(1,lm[i].x)),y:Math.max(0,Math.min(1,lm[i].y))}));
 // Face landmarks provide a better head center than the nose alone.
 points[0]={x:(lm[7].x+lm[8].x)/2,y:(lm[7].y+lm[8].y)/2};points.push({x:(points[1].x+points[2].x)/2,y:(points[1].y+points[2].y)/2});manual=false;$('joints').checked=true;status('识别完成。请检查结果，并拖动关节修正；识别结果并非精确轮廓。');update();
 }catch(error){if(token===generation)status(error.message.startsWith('未识别')||error.message.startsWith('部分关节')?error.message:'自动识别暂不可用：模型下载或初始化失败。请检查网络，或点击“手动标注关节”继续。');console.warn('姿态识别失败',error);}finally{busy=false;$('detect').disabled=!photo;}
};
function pos(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
canvas.onpointerdown=e=>{if(!photo)return;const p=pos(e),r=canvas.getBoundingClientRect();let nearest=-1,min=22;points.forEach((q,i)=>{const d=Math.hypot((q.x-p.x)*r.width,(q.y-p.y)*r.height);if(d<min){min=d;nearest=i;}});if(nearest>=0&&$('joints').checked){drag=nearest;canvas.setPointerCapture(e.pointerId);status(`正在调整：${names[drag]}`);draw();}else if(manual&&points.length<names.length){points.push(p);next();update();}};
canvas.onpointermove=e=>{if(drag<0)return;points[drag]=pos(e);update();};
const end=()=>{if(drag<0)return;drag=-1;if(manual)next();else status('关节已修正。可继续调整或导出。');draw();};canvas.onpointerup=end;canvas.onpointercancel=end;
for(const id of ['head','thick','color','joints'])$(id).oninput=update;
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('svg').onclick=()=>download(new Blob([$ ('preview').innerHTML],{type:'image/svg+xml;charset=utf-8'}),'形迹-pictogram.svg');
$('png').onclick=async()=>{const url=URL.createObjectURL(new Blob([$('preview').innerHTML],{type:'image/svg+xml'})),img=new Image();try{img.src=url;await img.decode();const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;out.getContext('2d').drawImage(img,0,0);out.toBlob(blob=>{if(blob)download(blob,'形迹-pictogram.png');else status('PNG 导出失败，请尝试 SVG。');},'image/png');}catch{status('PNG 导出失败，请尝试 SVG。');}finally{URL.revokeObjectURL(url);}};
update();
