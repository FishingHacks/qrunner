import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { log } from './main';

let packageManager: 'pnpm' | 'yarn' | 'npm' | null = null;

export function getPackageManager(): 'npm' | 'pnpm' | 'yarn' {
    if (packageManager) return packageManager;

    if (!spawnSync('pnpm', ['-v'], { shell: true }).error) return (packageManager = 'pnpm');
    if (!spawnSync('yarn', ['-v'], { shell: true }).error) return (packageManager = 'yarn');
    if (!spawnSync('npm', ['-v'], { shell: true }).error) return (packageManager = 'npm');
    throw new Error('No package manager installed');
}

export default function installRequiredPackages(
    dir: string,
    packages: string[]
) {
    const manager = getPackageManager();
    for (const p of packages) {
        if (!existsSync(join(dir, 'node_modules', p))) {
            log('info', 'package-manager', 'Installing %s', p);
            spawnSync(manager, [manager === 'yarn' ? 'add' : 'install', p], {
                cwd: dir,
                shell: true,
            });
            log('info', 'package-manager', 'Installed %s', p);
        }
    }
}
