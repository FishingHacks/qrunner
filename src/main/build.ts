import * as esbuild from 'esbuild';
import { access, constants, readFile } from 'fs/promises';
import { join } from 'path';
import { displayError, log, SCRIPTDIR } from './main';

let building: Record<string, (() => void)[]> = {};
export const compilationSuccessStatus: Record<string, boolean> = {};

export function isBuilding(file: string) {
  return building[file] !== undefined;
}
export function whenBuildEnds(file: string): Promise<void> {
  return new Promise((res) => {
    if (!isBuilding(file)) res(undefined);
    else building[file].push(res);
  });
}

export async function build(file: string, cancelTransform?: boolean) {
  if (isBuilding(file)) return;
  cancelTransform ||= false;
  building[file] = [];
  try {
    log('info', 'build', 'Initiating the build for %s!', file);
    access(join(SCRIPTDIR, file), constants.R_OK);
    const content = await readFile(join(SCRIPTDIR, file)).then((buf) =>
      buf.toString()
    );

    let newContent = '';
    if (cancelTransform) newContent = content;
    else {
      const lastImport = content.lastIndexOf('import');
      let imports = content.substring(0, lastImport);
      const lastNl = content.substring(lastImport).indexOf('\n');
      if (lastNl === -1) return { imports: content, remaining: '' };
      imports += content.substring(lastImport, lastImport + lastNl + 1);
      newContent =
        imports +
        '/**/(async ()=>{\n' +
        content.substring(lastImport + lastNl) +
        '\n/**/})();';
    }

    log('info', 'build', 'Building %s using esbuild!', file);

    const { errors } = await esbuild.build({
      stdin: {
        contents: newContent,
        resolveDir: SCRIPTDIR,
        sourcefile: file,
        loader: 'ts',
      },
      format: 'cjs',
      outfile: join(SCRIPTDIR, file.substring(0, file.length - 2) + 'js'),
      tsconfig: join(SCRIPTDIR, 'tsconfig.json'),
    });

    compilationSuccessStatus[file] = errors.length < 1;
    if (errors.length < 1) log('info', 'build', 'Finished building %s!', file);
    else {
      log(
        'error',
        'build',
        'Failed to build %s:\n%s',
        file,
        errors.map((el) => el.text).join('\n' + '-'.repeat(20) + '\n')
      );
      displayError(
        'Error while compiling ' + file,
        errors.map((el) => el.text).join('\n' + '-'.repeat(20) + '\n')
      );
    }
  } catch (e: any) {
    compilationSuccessStatus[file] = false;
    log('error', 'build', 'Failed to build %s:\n%s', file, e);
    displayError(
      'Error while compiling ' + file,
      e?.stack || e?.message || e?.name || e?.toString() || '' + e
    );
  }
  building[file].forEach((el) => el());
  delete building[file];
}
