import { ChildProcess, spawn } from 'child_process';
import { access, readdir, readFile, rename, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { DropFile, File } from '../renderer/api';
import { colorSchemes } from '../renderer/constants';
import {
  colorSchemeDir,
  getMainWindow,
  SCRIPTDIR,
  envFile,
  colorSchemeFile,
  runner,
  configFile,
  log,
} from './main';
import { getInfo } from './extractScriptInfos';
import handle, { channels } from './handleApiCalls';
import { getPackageManager } from './installTypescript';
import generateScript from './scriptGenerator';
import { slugify } from './slugify';
import { constants, existsSync } from 'fs';

export async function createScript(name: string) {
  log('info', 'script helper', 'Creating script %s', name);
  const path = join(SCRIPTDIR, slugify(name.toLowerCase()) + '.ts');
  if (existsSync(path)) return;
  await writeFile(path, generateScript(name));
  spawn('code', [path]);
}
const processes: Record<number, ChildProcess> = {};
export async function runScript(name: string, ...args: string[]) {
  log('info', 'script helper', 'Running script %s with args: %s', name, args);
  const old = (await readFile(join(SCRIPTDIR, name))).toString();
  const { imports, remaining } = transform(old);

  const newName = join(SCRIPTDIR, name.substring(0, name.length - 2) + 'cts');
  await writeFile(
    newName,
    imports + '/**/(async ()=>{\n' + remaining + '\n/**/})();'
  );

  return new Promise((res) => {
    const spawned = spawn(
      runner,
      [join(SCRIPTDIR, 'globals.js'), newName, ...args],
      {
        cwd: SCRIPTDIR,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      }
    );
    log(
      'debug',
      'command line',
      '"%s" "%s" "%s" %s',
      runner,
      join(SCRIPTDIR, 'globals.js'),
      join(SCRIPTDIR, name),
      args.map((el) => JSON.stringify(el)).join(' ')
    );
    processes[spawned.pid || 0] = spawned;
    spawned.stdout?.pipe(process.stdout);
    spawned.stderr?.pipe(process.stdout);

    function remove(code?: number) {
      res(undefined);
      if (!processes[spawned.pid || 0]) return;
      log(
        'info',
        'script helper',
        '%s exited with code %s (pid: %d)',
        name,
        code || 0,
        spawned.pid
      );
      delete processes[spawned.pid || 0];
      getMainWindow()?.webContents?.send('proc-exit', spawned.pid);
      getMainWindow()?.webContents?.send('user-tabs-set', []);
      getMainWindow()?.webContents?.send('loader-update', {
        open: false,
      });
      getMainWindow()?.webContents?.send('arg-end');
    }
    spawned.on('close', remove);
    spawned.on('disconnect', remove);
    spawned.on('error', remove);
    spawned.on('exit', remove);
    spawned.on('message', (data) => {
      log(
        'debug',
        'api',
        'Message from pid: %d | file: %s | data: %s',
        spawned.pid,
        name,
        JSON.stringify(data)
      );

      if (typeof data !== 'object' || !data) return;
      if (!('pid' in data) || !('channel' in data)) return;
      if (
        typeof (data as any).pid !== 'number' ||
        typeof (data as any).channel !== 'number'
      )
        return;
      const channel = (data as any).channel;
      handle(
        channel,
        data,
        function respond(data: any) {
          return spawned.send({
            ...data,
            pid: spawned.pid,
            channel: channel,
          });
        },
        {
          envFile,
          packageDir: SCRIPTDIR,
        }
      );
    });
  });
}
export async function setSelectedTab(name: string) {
  for (const p of Object.values(processes))
    if (!p.killed && typeof p.exitCode !== 'number')
      p.send({ pid: p.pid, channel: channels.ON_TAB, name });
}
export function kill(pid: number) {
  if (!processes[pid]) return;
  if (!processes[pid].killed) processes[pid].kill();
  log(
    'info',
    'script helper',
    '%s exited with signal SIGKILL (pid: %d)',
    processes[pid].spawnargs[2].split('/').pop(),
    pid
  );
  delete processes[pid];
  getMainWindow()?.webContents?.send('proc-exit', pid);
  getMainWindow()?.webContents?.send('user-tabs-set', []);
  getMainWindow()?.webContents?.send('loader-update', {
    open: false,
  });
  getMainWindow()?.webContents?.send('arg-end');
}
const scriptCache: Record<string, string> = {};
export async function getScript(name: string) {
  if (scriptCache[name] !== undefined) return scriptCache[name];
  setTimeout(() => delete scriptCache[name], 1000);
  try {
    return (scriptCache[name] = (
      await readFile(join(SCRIPTDIR, name))
    ).toString());
  } catch {
    return (scriptCache[name] = 'Error');
  }
}
export function getProcs() {
  const newProcs: Record<number, string> = {};

  for (const pid in processes) {
    newProcs[pid] =
      processes[pid].spawnargs[2].split('/').pop() || 'no process name found';
    newProcs[pid] = newProcs[pid].substring(0, newProcs[pid].length - 3) + 'ts'; // remove the cts extension, as .cts is the "transpiled" version :3
  }

  return newProcs;
}
export async function changeColorscheme(config: any) {
  if (typeof config === 'object') config = JSON.stringify(config);

  writeFile(colorSchemeFile, config);
}
export async function getColorschemes() {
  const schemes = { ...colorSchemes };

  const entries = new Set(
    (await readdir(colorSchemeDir))
      .filter(
        (el) => el.endsWith('.json') && !schemes[el.substring(0, el.length - 5)]
      )
      .map((el) => el.substring(0, el.length - 5))
  );

  for (const entry of entries) {
    try {
      schemes[entry] = JSON.parse(
        (await readFile(join(colorSchemeDir, entry + '.json'))).toString()
      );
    } catch {}
  }

  return schemes;
}
export async function createColorscheme(name: string, config: any) {
  name = name.replaceAll('/', '').replaceAll('\\', '');
  await writeFile(join(colorSchemeDir, name + '.json'), JSON.stringify(config));
}
export async function deleteColorscheme(name: string) {
  await rm(join(colorSchemeDir, name + '.json'));
}
function getTwitterUsername(url: string): string | undefined {
  const ghUrlRegex = /^(https?:\/\/)?(twitter|tw)(\.com)?\/(@[_a-zA-Z]+)$/g;
  return ghUrlRegex.exec(url)?.[4] || undefined;
}
function getGithubUsername(url: string): string | undefined {
  const ghUrlRegex = /^(https?:\/\/)?(github|gh)(\.com)?\/([_a-zA-Z]+)$/g;
  return ghUrlRegex.exec(url)?.[4] || undefined;
}
function getYouTubeUsername(url: string): string | undefined {
  const ghUrlRegex = /^(https?:\/\/)?(youtube|yt)(\.com)?\/([@_a-zA-Z]+)$/g;
  return ghUrlRegex.exec(url)?.[4] || undefined;
}
let cachedFiles: File[] = [];
export async function listScripts(force?: boolean) {
  const files = (await readdir(SCRIPTDIR)).filter(
    (el) =>
      !el.endsWith('.d.ts') && el.endsWith('.ts') && !el.endsWith('.module.ts')
  );
  if (cachedFiles.length === files.length && !force) return cachedFiles;
  const newFiles: File[] = [];
  for (const f of files) {
    const contents = (await readFile(join(SCRIPTDIR, f))).toString();
    const { author, description, name, url, uses } = getInfo(contents);
    newFiles.push({
      path: f,
      name,
      author,
      description,
      githubName: getGithubUsername(url || ''),
      twitterName: getTwitterUsername(url || ''),
      youtubeName: getYouTubeUsername(url || ''),
      uses: uses.split(','),
    });
  }
  return (cachedFiles = newFiles);
}

export function getScriptName(pid: number) {
  const proc = processes[pid];
  if (!proc) return '';
  return proc.spawnargs[2].split('/').pop() || 'unknown script';
}

export async function removeScript(path: string) {
  await rm(join(SCRIPTDIR, path));
}

export async function renameScript(old: string, newname: string) {
  const newpath = slugify(newname.toLowerCase()) + '.ts';
  await rename(join(SCRIPTDIR, old), join(SCRIPTDIR, newpath));
}

export async function getInstalledPackages(): Promise<string[]> {
  try {
    const packages = JSON.parse(
      (await readFile(join(SCRIPTDIR, 'package.json'))).toString()
    );
    if (!packages.dependencies) return [];
    else return packages.dependencies;
  } catch {
    return [];
  }
}

export function uninstallPackage(name: string) {
  log('info', 'package-manager', 'Uninstalling %s', name);
  const spawned = spawn(getPackageManager(), ['remove', name], {
    cwd: SCRIPTDIR,
  });

  let returned = false;
  return new Promise((res, rej) => {
    if (returned) return;
    returned = true;
    let result = '';
    function done(code?: number) {
      if ((code || 0) !== 0)
        return rej(
          new Error('Could not remove package ' + name + ':\n' + result)
        );
      log('info', 'package-manager', 'Uninstalled %s', name);
      return res({
        code: code || 0,
        output: result,
      });
    }
    spawned.on('error', rej);
    spawned.on('disconnect', () => rej(new Error('Process disconnected')));
    spawned.on('close', done);
    spawned.on('exit', done);
    spawned.stdout.pipe(process.stdout);
    spawned.stdout.on('data', (data) => (result += data.toString()));
    spawned.stderr.pipe(process.stderr);
    spawned.stderr.on('data', (data) => (result += data.toString()));
  });
}

export function getArgPreview(key: string) {
  for (const p of Object.values(processes))
    if (!p.killed && typeof p.exitCode !== 'number')
      p.send({ pid: p.pid, channel: channels.GET_PREVIEW, key });
}

export async function dropFile(file: DropFile) {
  if (typeof file === 'object' && file)
    (file as any).base64 = (await readFile(file.path)).toString('base64');

  for (const p of Object.values(processes))
    if (!p.killed && typeof p.exitCode !== 'number')
      p.send({
        pid: p.pid,
        channel: channels.DROP,
        file,
      });
}

export async function event(
  name: string,
  widgetId: string | undefined,
  args: any[]
) {
  for (const p of Object.values(processes))
    if (!p.killed && typeof p.exitCode !== 'number')
      p.send({
        pid: p.pid,
        channel: channels.ON_EVENT,
        event: name,
        args,
        widgetId,
      });
}

export async function getConfig(key: string) {
  try {
    const value = JSON.parse((await readFile(configFile)).toString());
    if (!value) throw 0;
    if (typeof value[key] !== 'string') return '';
    return value[key];
  } catch {
    return '';
  }
}

export async function setConfig(key: string, value: string) {
  try {
    const json = JSON.parse((await readFile(configFile)).toString());
    if (!json) throw 0;
    json[key] = value;
    await writeFile(configFile, JSON.stringify(json));
  } catch {
    await writeFile(configFile, JSON.stringify({ [key]: value }));
  }
}

export async function createFromFile(path: string, file: string) {
  log('info', 'scripth helper', 'Creating script %s', path);
  if (existsSync(path)) return;
  await writeFile(join(SCRIPTDIR, path), file);
  spawn('code', [join(SCRIPTDIR, path)]);
}

export async function installPackage(name: string) {
  log('info', 'package-manager', 'Installing %s', name);
  const spawned = spawn(
    getPackageManager(),
    [getPackageManager() === 'yarn' ? 'add' : 'install', name],
    {
      cwd: SCRIPTDIR,
    }
  );

  let returned = false;
  return new Promise((res, rej) => {
    if (returned) return;
    returned = true;
    let result = '';
    function done(code?: number) {
      if ((code || 0) !== 0)
        return rej(
          new Error('Could not install package ' + name + ':\n' + result)
        );
      log('info', 'package-manager', 'Installed %s', name);
      return res({
        code: code || 0,
        output: result,
      });
    }
    spawned.on('error', rej);
    spawned.on('disconnect', () => rej(new Error('Process disconnected')));
    spawned.on('close', done);
    spawned.on('exit', done);
    spawned.stdout.pipe(process.stdout);
    spawned.stdout.on('data', (data) => (result += data.toString()));
    spawned.stderr.pipe(process.stderr);
    spawned.stderr.on('data', (data) => (result += data.toString()));
  });
}

export async function editScript(path: string) {
  access(join(SCRIPTDIR, path), constants.R_OK);
  spawn((await getConfig('editor')) || 'code', [join(SCRIPTDIR, path)]).on('error', () => {});
}

function transform(file: string) {
  const lastImport = file.lastIndexOf('import');
  let imports = file.substring(0, lastImport);
  const lastNl = file.substring(lastImport).indexOf('\n');
  if (lastNl === -1) return { imports: file, remaining: '' };
  imports += file.substring(lastImport, lastImport + lastNl + 1);
  return {
    imports,
    remaining: file.substring(lastImport + lastNl + 1),
  };
}
