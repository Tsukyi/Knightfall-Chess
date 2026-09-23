import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','src','vendor','favicon.svg','.nojekyll']) await cp(file,`dist/${file}`,{recursive:true});
console.log('Static site ready in dist/ — no build dependencies or external services required.');
