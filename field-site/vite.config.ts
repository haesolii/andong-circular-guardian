import {defineConfig} from '../app/node_modules/vite/dist/node/index.js';
import react from '../app/node_modules/@vitejs/plugin-react/dist/index.js';
import tailwindcss from '../app/node_modules/@tailwindcss/postcss/dist/index.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(({command})=>({
 plugins:[react()],css:{postcss:{plugins:[tailwindcss()]}},
 resolve:{alias:{'@':resolve(root,'../app'),react:resolve(root,'../app/node_modules/react'),'react-dom':resolve(root,'../app/node_modules/react-dom')}},
 define:{'process.env.NEXT_PUBLIC_API_ORIGIN':JSON.stringify(command==='serve'?'http://localhost:3000':'https://andong-circular-guardian.roy919491.chatgpt.site'),'process.env.NEXT_PUBLIC_KAKAO_MAP_KEY':JSON.stringify('')},
 server:{fs:{allow:[resolve(root,'..')]}}
}));

