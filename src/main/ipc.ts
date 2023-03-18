import { ChildProcess, spawn } from 'child_process';
import { readdir, readFile, rename, rm, writeFile } from 'fs/promises';
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
} from './main';
import { getInfo } from './extractScriptInfos';
import handle, { channels } from './handleApiCalls';
import { getPackageManager } from './installTypescript';
import generateScript from './scriptGenerator';
import { slugify } from './slugify';

export async function createScript(name: string) {
    const path = join(SCRIPTDIR, slugify(name.toLowerCase()) + '.ts');
    await writeFile(path, generateScript(name));
    spawn('code', [path]);
}
const processes: Record<number, ChildProcess> = {};
export async function runScript(name: string) {
    const old = (await readFile(join(SCRIPTDIR, name))).toString();
    const { imports, remaining } = transform(old);

    const newName = join(SCRIPTDIR, name.substring(0, name.length - 2) + 'cts');
    await writeFile(newName, imports + '(async ()=>{' + remaining + '})();');

    return new Promise((res) => {
        const spawned = spawn(
            runner,
            [join(SCRIPTDIR, 'globals.js'), newName],
            {
                cwd: SCRIPTDIR,
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            }
        );
        console.log(
            `${runner} "${join(SCRIPTDIR, 'globals.js')}" "${join(
                SCRIPTDIR,
                name
            )}"`
        );
        processes[spawned.pid || 0] = spawned;
        spawned.stdout?.pipe(process.stdout);
        spawned.stderr?.pipe(process.stdout);

        function remove(code?: number) {
            res(undefined);
            if (!processes[spawned.pid || 0]) return;
            console.log(
                name,
                'exited with code',
                code || 0,
                '(pid:',
                spawned.pid + ')'
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
            console.log(
                'Message from pid:',
                spawned.pid,
                '| file:',
                name,
                ':',
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
    console.log(
        processes[pid].spawnargs[2].split('/').pop(),
        'exited with signal SIGKILL (pid:',
        pid + ')'
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
        newProcs[pid] = processes[pid].spawnargs[2].split('/').pop() || 'no process name found';
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
                (el) =>
                    el.endsWith('.json') &&
                    !schemes[el.substring(0, el.length - 5)]
            )
            .map((el) => el.substring(0, el.length - 5))
    );

    for (const entry of entries) {
        try {
            schemes[entry] = JSON.parse(
                (
                    await readFile(join(colorSchemeDir, entry + '.json'))
                ).toString()
            );
        } catch {}
    }

    return schemes;
}
export async function createColorscheme(name: string, config: any) {
    name = name.replaceAll('/', '').replaceAll('\\', '');
    await writeFile(
        join(colorSchemeDir, name + '.json'),
        JSON.stringify(config)
    );
}
export async function deleteColorscheme(name: string) {
    await rm(join(colorSchemeDir, name + '.json'));
}
function getGithubUsername(url: string): string | undefined {
    const ghUrlRegex = /^(https?:\/\/)?(github|gh)(\.com)?\/([a-zA-Z]+)$/g;
    return ghUrlRegex.exec(url)?.[4] || undefined;
}
let cachedFiles: File[] = [];
export async function listScripts(force?: boolean) {
    const files = (await readdir(SCRIPTDIR)).filter(
        (el) =>
            !el.endsWith('.d.ts') &&
            el.endsWith('.ts') &&
            !el.endsWith('.module.ts')
    );
    if (cachedFiles.length === files.length && !force) return cachedFiles;
    const newFiles: File[] = [];
    for (const f of files) {
        const contents = (await readFile(join(SCRIPTDIR, f))).toString();
        const { author, description, name, url } = getInfo(contents);
        newFiles.push({
            path: f,
            name,
            author,
            description,
            githubName: getGithubUsername(url || ''),
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
    console.log('Uninstalling', name);
    const spawned = spawn(getPackageManager(), ['remove', name], {
        cwd: SCRIPTDIR,
    });

    return new Promise((res, rej) => {
        let result = '';
        function done(code?: number) {
            if ((code || 0) !== 0)
                return rej(
                    new Error(
                        'Could not remove package ' + name + ':\n' + result
                    )
                );
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
    const base64 = (await readFile(file.path)).toString('base64');
    
    for (const p of Object.values(processes))
        if (!p.killed && typeof p.exitCode !== 'number')
            p.send({
                pid: p.pid,
                channel: channels.DROP,
                file: { ...file, base64 },
            });
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
