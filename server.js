import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const allowed=new Set(['index.html','app.js','geometry.js','style.css']);
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';if(!allowed.has(name)){res.writeHead(404);res.end('Not found');return;}const body=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)],'X-Content-Type-Options':'nosniff'});res.end(body);}catch{res.writeHead(500);res.end('服务器读取失败');}}).listen(port,'0.0.0.0',()=>console.log(`照片转 Pictogram 已启动，端口 ${port}。本机浏览器打开 http://localhost:${port}`));
