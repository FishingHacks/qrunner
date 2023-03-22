export default `declare function open(path: string): Promise<void>;
declare function notify(title: string, body?: string): void;
interface ClipboardUtils {
    copy(value: string): Promise<void>;
    paste(): Promise<void>;
}
declare const clipboard: ClipboardUtils;
interface FileSystem {
    copy(from: string, to: string): Promise<void>;
    move(from: string, to: string): Promise<void>;
    link(from: string, to: string): Promise<void>;
    listDir(dir: string): Promise<string[]>;
    removeFile(path: string): Promise<void>;
    createDir(path: string): Promise<void>;
    isFile(path: string): Promise<boolean>;
    isDir(path: string): Promise<boolean>;
    getCwd(): string;
    copySync(from: string, to: string): void;
    moveSync(from: string, to: string): void;
    linkSync(from: string, to: string): void;
    listDirSync(dir: string): string[];
    removeFileSync(path: string): void;
    createDirSync(path: string): void;
    isFileSync(path: string): boolean;
    isDirSync(path: string): boolean;
}
declare const fs: FileSystem;
interface Process {
    stdout: Buffer;
    stderr: Buffer;
    statusCode: number;
    errored: boolean;
}
declare function $(command: string): Promise<Process>;
declare function npm(package: string): Promise<any>;
declare function getPackageManager(): 'npm' | 'pnpm' | 'yarn';
declare function env(key: string): Promise<string>;
type TimeConfig = Partial<
    Record<'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days', number>
>;
declare function sleep(time: TimeConfig): Promise<void>;
declare function sleepSync(time: TimeConfig): void;
declare function timeToMs(time: TimeConfig): number;
declare function getEnvFile(): string;
declare function getHomePath(): string;
declare function logToFile(
    level: 'warn' | 'error' | 'info',
    message: string,
    ...args: any[]
): Promise<void>;
declare function logToFileSync(
    level: 'warn' | 'error' | 'info',
    message: string,
    ...args: any[]
): void;
declare function clearAllIntervals(): void;
declare function clearAllTimeouts(): void;
declare function isWin(): boolean;
declare function isMac(): boolean;
declare function isLinux(): boolean;
declare enum Channel {
    OPEN = 0,
    COPY = 1,
    PASTE = 2,
    GET_ENV = 3,
    WRITE = 4,
    ARG = 5,
    HIDE = 6,
    SHOW = 7,
    ERROR = 8,
    SHOW_WIDGET = 9,
    OPEN_DEVTOOLS = 10,
    UPDATE_WIDGET = 11,
    UPDATE_ERROR_LOADER = 12,
    SET_TAB_DATA = 13,
    ON_TAB = 14,
    SET_DIV_DATA = 15,
    SWITCH_TAB = 16,
    GET_PREVIEW = 17,
    SET_PREVIEW = 18,
    DROP = 19,
    ON_EVENT = 20,
    CLOSE_WIDGET = 21,
}
declare function send(channel: Channel, data: any): Promise<void>;
declare function sendWithResponse(channel: Channel, data: any): Promise<any>;
declare function cd(path: string): void;
declare function getLogDir(): string;
declare function getLogFile(): string;
declare function getPackageDir(): string;
declare function writeToSelection(text: string): Promise<void>;
declare interface ArgOption {
    name: string;
    description?: string;
    key: string;
    background?: string;
    image?: string;
}
declare function arg(
    name: string,
    options?: (string | ArgOption)[],
    autocomplete?: (
        key: string
    ) => Promise<string | undefined> | string | undefined,
    hint?: string,
): Promise<string>;
declare function hide(): Promise<void>;
declare function show(): Promise<void>;
declare function spawn(name: string, args: string[], options?: any): void;
declare function md(markdown: string): string;
declare function highlight(code: string, language?: string): string;
declare function getHljsStyle(style: string): string;
declare function widget(code: string): Promise<string>;
declare function dev(value?: any): Promise<void>;
declare function updateWidget(id: string, content: string): Promise<void>;
declare function get(url: URL | string): Promise<any>;
declare function db<T extends any[] | Record<PropertyKey, any>>(
    name: string,
    defaultValue: T
): Promise<{ write: () => Promise<void>; value: T }>;
declare function loader(name: string): {
    updateName(name: string): void;
    stop(name?: string): void;
};
interface Tab {
    name: string;
    key: string;
}
declare function setTabs(tabs: (string | Tab)[]): void;
declare function removeTabs(): void;
declare function onTab(name: string, cb: () => any): void;
declare function setTab(name: string): void;
declare function div(code: string): void;
declare function resetDiv(): void;
declare interface DropFile {
    path: string;
    type: string;
    base64: string;
}
declare function drop(): Promise<DropFile>;
declare function edit(path: string): void;
declare function onEvent<T extends keyof WindowEventMap>(
    name: T,
    cb: (
        widgetId: string | undefined,
        args: [WindowEventMap[T], ...any[]]
    ) => void
): () => void;
declare function closeWidget(widgetId: string): void;
declare function startDrag(file: string): void;
declare function textarea(name: string): Promise<string>;
declare function tmp(
    content: string,
    name?: string,
    extension?: string
): string;
declare namespace API {
    function open(path: string): Promise<void>;
    function notify(title: string, body?: string): void;
    const clipboard: ClipboardUtils;
    const fs: FileSystem;
    function $(command: string): Promise<Process>;
    function npm(package: string): Promise<any>;
    function getPackageManager(): 'npm' | 'pnpm' | 'yarn';
    function env(key: string): Promise<string>;
    type TimeConfig = Partial<
        Record<
            'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days',
            number
        >
    >;
    function sleep(time: TimeConfig): Promise<void>;
    function sleepSync(time: TimeConfig): void;
    function timeToMs(time: TimeConfig): number;
    function getEnvFile(): string;
    function getHomePath(): string;
    function logToFile(
        level: 'warn' | 'error' | 'info',
        message: string,
        ...args: any[]
    ): Promise<void>;
    function logToFileSync(
        level: 'warn' | 'error' | 'info',
        message: string,
        ...args: any[]
    ): void;
    function clearAllIntervals(): void;
    function clearAllTimeouts(): void;
    function isWin(): boolean;
    function isMac(): boolean;
    function isLinux(): boolean;
    function md(markdown: string): string;
    function send(channel: Channel, data: any): Promise<void>;
    function sendWithResponse(channel: Channel, data: any): Promise<any>;
    function cd(path: string): void;
    function getLogDir(): string;
    function getLogFile(): string;
    function getPackageDir(): string;
    function writeToSelection(text: string): Promise<void>;
    interface ArgOption {
        name: string;
        description?: string;
        key: string;
        background?: string;
        image?: string;
    }
    function arg(
        name: string,
        options?: (string | ArgOption)[],
        autocomplete?: (
            key: string
        ) => Promise<string | undefined> | string | undefined,
        hint?: string,
    ): Promise<string>;
    function hide(): Promise<void>;
    function show(): Promise<void>;
    function spawn(name: string, args: string[], options?: any): void;
    function highlight(code: string, language?: string): string;
    function getHljsStyle(style: string): string;
    function widget(code: string): Promise<string>;
    function dev(value?: any): Promise<void>;
    function updateWidget(id: string, content: string): Promise<void>;
    function get(url: URL | string): Promise<any>;
    function db<T extends any[] | Record<PropertyKey, any>>(
        name: string,
        defaultValue: T
    ): Promise<{ write: () => Promise<void>; value: T }>;
    function loader(name: string): {
        updateName(name: string): void;
        stop(name?: string): void;
    };
    function setTabs(tabs: (string | Tab)[]): void;
    function removeTabs(): void;
    function onTab(name: string, cb: () => any): () => void;
    function setTab(name: string): void;
    function div(code: string): void;
    function resetDiv(): void;
    function drop(): Promise<DropFile>;
    function edit(path: string): void;
    function onEvent<T extends keyof WindowEventMap>(
        name: T,
        cb: (
            widgetId: string | undefined,
            args: [WindowEventMap[T], ...any[]]
        ) => void
    ): () => void;
    function closeWidget(widgetId: string): void;
    function startDrag(file: string): void;
    function textarea(name: string): Promise<string>;
    function tmp(content: string, name?: string, extension?: string): string;
}`;
