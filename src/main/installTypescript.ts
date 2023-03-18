import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

let packageManager: 'pnpm' | 'yarn' | 'npm' | null = null;

export function getPackageManager(): 'npm' | 'pnpm' | 'yarn' {
    if (packageManager) return packageManager;

    if (!spawnSync('pnpm', ['-v']).error) return (packageManager = 'pnpm');
    if (!spawnSync('yarn', ['-v']).error) return (packageManager = 'yarn');
    if (!spawnSync('npm', ['-v']).error) return (packageManager = 'npm');
    throw new Error('No package manager installed');
}

export default function installRequiredPackages(
    dir: string,
    packages: string[]
) {
    const manager = getPackageManager();
    for (const p of packages) {
        if (!existsSync(join(dir, 'node_modules', p))) {
            console.log('Installing', p, '...');
            spawnSync(manager, [manager === 'yarn' ? 'add' : 'install', p], {
                cwd: dir,
            });
            console.log(p, 'is now installed!');
        }
    }
}
