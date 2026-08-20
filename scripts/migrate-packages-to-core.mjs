import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagesDir = path.join(rootDir, 'packages');
const targetCoreDir = path.join(rootDir, 'apps', 'api', 'src', 'core');

if (!fs.existsSync(targetCoreDir)) {
  fs.mkdirSync(targetCoreDir, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

for (const pkgName of fs.readdirSync(packagesDir)) {
  if (pkgName === 'config' || pkgName === 'testing') continue;
  const pkgSrcDir = path.join(packagesDir, pkgName, 'src');
  if (fs.existsSync(pkgSrcDir)) {
    const destDir = path.join(targetCoreDir, pkgName);
    copyRecursive(pkgSrcDir, destDir);
    console.log(`Copied ${pkgName}/src -> apps/api/src/core/${pkgName}`);
  }
}

console.log('Core modules successfully migrated into apps/api/src/core/');
