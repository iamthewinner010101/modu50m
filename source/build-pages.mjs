import {build} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const repo=path.dirname(source);
await build({root:source});
fs.cpSync(path.join(repo,'.pages-build'),repo,{recursive:true});
console.log('GitHub Pages files updated in the repository root.');
