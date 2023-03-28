import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';
import { join } from 'path';
import { log } from './main';

let packageManager: 'pnpm' | 'yarn' | 'npm' | null = null;

export function getPackageManager(): 'npm' | 'pnpm' | 'yarn' {
  if (packageManager) return packageManager;

  if (!spawnSync('pnpm', ['-v'], { shell: platform() === 'win32' }).error)
    return (packageManager = 'pnpm');
  if (!spawnSync('yarn', ['-v'], { shell: platform() === 'win32' }).error)
    return (packageManager = 'yarn');
  if (!spawnSync('npm', ['-v'], { shell: platform() === 'win32' }).error)
    return (packageManager = 'npm');
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
        shell: platform() === 'win32',
      });
      log('info', 'package-manager', 'Installed %s', p);
    }
  }
}
