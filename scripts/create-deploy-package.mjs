import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const deployDir = path.join(rootDir, 'deploy_package');

// Clean existing
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      if (file === 'node_modules' || file === '.turbo' || file === '.git' || file === 'cache') continue;
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('1. Copying root configuration files...');
const rootFiles = [
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'turbo.json',
  'index.js', 'api-resolve-hook.js',
  '.env', '.env.local', '.env.production',
];
for (const file of rootFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(deployDir, file));
    console.log(`   ✓ ${file}`);
  }
}

console.log('2. Copying packages/ (source for workspace packages)...');
copyRecursive(path.join(rootDir, 'packages'), path.join(deployDir, 'packages'));

console.log('3. Copying apps/api/ (compiled dist + package.json)...');
fs.mkdirSync(path.join(deployDir, 'apps', 'api'), { recursive: true });
copyRecursive(path.join(rootDir, 'apps', 'api', 'dist'), path.join(deployDir, 'apps', 'api', 'dist'));
copyRecursive(path.join(rootDir, 'apps', 'api', 'src'), path.join(deployDir, 'apps', 'api', 'src'));
fs.copyFileSync(path.join(rootDir, 'apps', 'api', 'package.json'), path.join(deployDir, 'apps', 'api', 'package.json'));
if (fs.existsSync(path.join(rootDir, 'apps', 'api', '.env'))) {
  fs.copyFileSync(path.join(rootDir, 'apps', 'api', '.env'), path.join(deployDir, 'apps', 'api', '.env'));
}

console.log('4. Copying apps/web/ (.next build + public + config)...');
fs.mkdirSync(path.join(deployDir, 'apps', 'web'), { recursive: true });
copyRecursive(path.join(rootDir, 'apps', 'web', '.next'), path.join(deployDir, 'apps', 'web', '.next'));
if (fs.existsSync(path.join(rootDir, 'apps', 'web', 'public'))) {
  copyRecursive(path.join(rootDir, 'apps', 'web', 'public'), path.join(deployDir, 'apps', 'web', 'public'));
}
fs.copyFileSync(path.join(rootDir, 'apps', 'web', 'package.json'), path.join(deployDir, 'apps', 'web', 'package.json'));
if (fs.existsSync(path.join(rootDir, 'apps', 'web', 'next.config.mjs'))) {
  fs.copyFileSync(path.join(rootDir, 'apps', 'web', 'next.config.mjs'), path.join(deployDir, 'apps', 'web', 'next.config.mjs'));
}

console.log('5. Copying apps/worker/ (source + dist + package.json)...');
fs.mkdirSync(path.join(deployDir, 'apps', 'worker'), { recursive: true });
copyRecursive(path.join(rootDir, 'apps', 'worker', 'dist'), path.join(deployDir, 'apps', 'worker', 'dist'));
copyRecursive(path.join(rootDir, 'apps', 'worker', 'src'), path.join(deployDir, 'apps', 'worker', 'src'));
fs.copyFileSync(path.join(rootDir, 'apps', 'worker', 'package.json'), path.join(deployDir, 'apps', 'worker', 'package.json'));
if (fs.existsSync(path.join(rootDir, 'apps', 'worker', 'tsconfig.json'))) {
  fs.copyFileSync(path.join(rootDir, 'apps', 'worker', 'tsconfig.json'), path.join(deployDir, 'apps', 'worker', 'tsconfig.json'));
}
if (fs.existsSync(path.join(rootDir, 'apps', 'worker', '.env'))) {
  fs.copyFileSync(path.join(rootDir, 'apps', 'worker', '.env'), path.join(deployDir, 'apps', 'worker', '.env'));
}

// Create README for deployment
const readme = `# JAAGO HUB v2.0 — Production Deployment Package

## Quick Start (on server)

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Start all services
NODE_ENV=production node index.js
\`\`\`

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web     | 3000 (or $PORT) | Next.js Frontend |
| API     | 3001 (or $API_PORT) | NestJS Backend |
| Worker  | N/A  | BullMQ Background Jobs |

## Environment Variables

Set these in your .env files or CPanel environment settings:
- PORT (Web port, default: 3000)
- API_PORT (API port, default: 3001)
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL
- ENCRYPTION_KEK

## Files

- \`index.js\` — Main startup file (point CPanel here)
- \`api-resolve-hook.js\` — Module resolver for NestJS API
- \`apps/web/.next/\` — Compiled Next.js frontend
- \`apps/api/dist/\` — Compiled NestJS API
- \`apps/worker/src/\` — Worker TypeScript source (runs via tsx)
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), readme, 'utf8');

console.log('');
console.log('✅ Deploy package assembled at:', deployDir);
