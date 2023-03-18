import { clipboard, shell } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import {
    arg,
    createDevtools,
    createWidget,
    displayError,
    getMainWindow,
    hide,
    show,
    uiChangeCb,
    updateWidget,
} from './main';
import { getScriptName } from './ipc';

export const channels = {
    OPEN: 0,
    COPY: 1,
    PASTE: 2,
    GET_ENV: 3,
    WRITE: 4,
    ARG: 5,
    HIDE: 6,
    SHOW: 7,
    ERROR: 8,
    SHOW_WIDGET: 9,
    SHOW_DEVTOOLS: 10,
    UPDATE_WIDGET: 11,
    UPDATE_ERROR_LOADER: 12,
    SET_TAB_DATA: 13,
    ON_TAB: 14,
    SET_DIV_DATA: 15,
    SWITCH_TAB: 16,
    GET_PREVIEW: 17,
    SET_PREVIEW: 18,
    DROP: 19,
};

export default function handle(
    channel: number,
    data: any,
    respond: (data: any) => boolean,
    config: {
        packageDir: string;
        envFile: string;
    }
) {
    if (channel === channels.OPEN) {
        if (data.path) {
            const path = data.path.toString();
            if (/^[a-z]+:/.exec(path)) shell.openExternal(path);
            else shell.openPath(path);
        }
    } else if (channel === channels.PASTE) {
        clipboard.write(
            {
                text: clipboard.readText(),
            },
            'selection'
        );
    } else if (channel === channels.COPY) {
        if (data.string) {
            const string: string = data.string.toString();

            clipboard.write({
                text: string,
            });
        }
    } else if (channel === channels.GET_ENV) {
        if (data.name) {
            const name = data.name.toString();
            (async function () {
                let json = JSON.parse(
                    (await readFile(config.envFile)).toString()
                );
                if (json[name])
                    return respond({ value: json[name].toString() });
                try {
                    const val = await arg('Environment: ' + name);
                    let json = JSON.parse(
                        (await readFile(config.envFile)).toString()
                    );
                    json[name] = (val as any).toString();
                    await writeFile(config.envFile, JSON.stringify(json));
                    respond({ value: val });
                } catch {
                    respond({ value: undefined });
                }
            })();
        }
    } else if (channel === channels.WRITE) {
        if (data.string) {
            clipboard.write({ text: data.string.toString() }, 'selection');
        }
    } else if (channel === channels.ARG) {
        if (data.name) {
            (async function () {
                try {
                    respond({
                        value: await arg(data.name.toString(), data.options),
                    });
                } catch {
                    respond({ value: undefined });
                }
            })();
        }
    } else if (channel === channels.HIDE) hide();
    else if (channel === channels.SHOW) show();
    else if (channel === channels.ERROR) {
        if (!data.error) return;
        if (data.error.toString().toLowerCase().includes('user exited')) return;

        displayError(getScriptName(data.pid as number), data.error.toString());
    } else if (channel === channels.SHOW_WIDGET) {
        if (!data.code) respond({ value: undefined });
        respond({ value: createWidget('', data.code.toString()) });
    } else if (channel === channels.SHOW_DEVTOOLS) {
        createDevtools(data.value);
    } else if (channel === channels.UPDATE_WIDGET) {
        if (!data.content || !data.id) return;
        updateWidget(data.id.toString(), data.content.toString());
    } else if (channel === channels.UPDATE_ERROR_LOADER) {
        if (!data.data || typeof data.data !== 'object') return;
        show();
        getMainWindow()?.webContents?.send('loader-update', data.data);
    } else if (channel === channels.SET_TAB_DATA) {
        if (
            !data.tabs ||
            typeof data.tabs !== 'object' ||
            !(data.tabs instanceof Array)
        )
            return;
        show();
        getMainWindow()?.webContents?.send('user-tabs-set', data.tabs);
    } else if (channel === channels.SET_DIV_DATA) {
        if (typeof data.data !== 'string') return;
        show();
        getMainWindow()?.webContents?.send('set-user-window-code', data.data);
        for (const cb of uiChangeCb)
            try {
                cb();
            } catch {}
        while (uiChangeCb.length > 0) uiChangeCb.pop();
    } else if (channel === channels.SWITCH_TAB) {
        if (typeof data.tab !== 'string') return;
        getMainWindow()?.webContents?.send('switch-tab', data.tab);
    } else if (channel === channels.SET_PREVIEW) {
        if (
            (typeof data.data !== 'string' &&
                typeof data.data !== 'undefined') ||
            typeof data.key !== 'string'
        )
            return;
        getMainWindow()?.webContents?.send('set-preview', data.data, data.key);
    } else if (channel === channels.DROP) getMainWindow()?.webContents?.send('drop');
}
