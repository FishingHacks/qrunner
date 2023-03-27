## open

```typescript
///file: typedef.d.ts
function open(path: string): Promise<void>;
```

> Open opens a file or url based on the desktops default behavior.
>
> Strongly recommended if you are working with files
>
> **Supports**: Linux Windows MacOS

---

## notify

```typescript
///file: typedef.d.ts
function notify(title: string, body?: string): void;
```

> Notify send a notification to the user. If no body is present, notify uses only the title, or uses the title as the body, based on the notification system requirement.
>
> **Support**: Linux

---

## clipboard.copy

```typescript
///file: typedef.d.ts
function copy(value: string): Promise<void>;
```

> Copies text to the user's clipboard
>
> **Supports**: Linux Windows MacOs

---

## clipboard.paste

```typescript
///file: typedef.d.ts
function paste(): Promise<void>;
```

> Simulates Ctrl+V and pastes the top value of the clipboard
>
> **Supports**:

---

## fs.copy

```typescript
///file: typedef.d.ts
function copy(from: string, to: string): Promise<void>;
```

> Copy a file
>
> **Supports**: Linux Windows MacOS

---

## fs.move

```typescript
///file: typedef.d.ts
function move(from: string, to: string): Promise<void>;
```

> Move a file
>
> **Supports**: Linux Windows MacOS

---

## fs.link

```typescript
///file: typedef.d.ts
function link(from: string, to: string): Promise<void>;
```

> Create a symbolic link
>
> **Supports**: Linux Windows MacOS

---

## fs.listDir

```typescript
///file: typedef.d.ts
function listDir(dir: string): Promise<string[]>;
```

> List the contents of a specified Directory
>
> **Supports**: Linux Windows MacOS

---

## fs.removeFile

```typescript
///file: typedef.d.ts
function removeFile(path: string): Promise<void>;
```

> Remove a File
>
> **Supports**: Linux Windows MacOS

---

## fs.removeDir

```typescript
///file: typedef.d.ts
function removeDir(path: string): Promise<void>;
```

> Remove a Folder
>
> **Supports**: Linux Windows MacOS

---

## fs.delete

```typescript
///file: typedef.d.ts
function delete(path: string): Promise<void>;
```

> Remove a File or Folder
>
> **Supports**: Linux Windows MacOS

---

## fs.createDir

```typescript
///file: typedef.d.ts
function createDir(path: string): Promise<void>;
```

> Create a Folder
>
> **Supports**: Linux Windows MacOS

---

## fs.isFile

```typescript
///file: typedef.d.ts
function isFile(path: string): Promise<boolean>;
```

> **Supports**: Linux Windows MacOS

---

## fs.isDir

```typescript
///file: typedef.d.ts
function isDir(path: string): Promise<boolean>;
```

> Check if a path points to an Directory
>
> **Supports**: Linux Windows MacOS

---

## fs.ensureDir

```typescript
///file: typedef.d.ts
function ensureDir(path: string): Promise<void>;
```

> Ensure the existence of an directory synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.ensureFile

```typescript
///file: typedef.d.ts
function ensureFile(path: string, contents: string): Promise<void>;
```

> Ensure the existence of an file synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.tree

```typescript
///file: typedef.d.ts
function tree(path: string): Promise<string[]>;
```

> Create a tree of a folder synchronously. Files are specified in absolute paths
>
> **Supports**: Linux Windows MacOS

---

## fs.findFiles

```typescript
///file: typedef.d.ts
interface FileFinderOptions {
  extensions?: string[];
  extension?: string;
  filenames?: string[];
  filename?: string;
  validate?(
    filename: string,
    extension: string,
    fileWithExtension: string,
    absolutePath: string
  ): boolean;
}
function findFiles(path: string, options: FileFinderOptions): Promise<string[]>;
```

> Find a file in a directory synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.getCwd

```typescript
///file: typedef.d.ts
function getCwd(): string;
```

> Get the current working directory
>
> **Supports**: Linux Windows MacOS

---

## fs.copySync

```typescript
///file: typedef.d.ts
function copySync(from: string, to: string): void;
```

> Copy a file synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.moveSync

```typescript
///file: typedef.d.ts
function moveSync(from: string, to: string): void;
```

> Move a file synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.linkSync

```typescript
///file: typedef.d.ts
function linkSync(from: string, to: string): void;
```

> Create a Symbolic Link synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.listDirSync

```typescript
///file: typedef.d.ts
function listDirSync(dir: string): string[];
```

> List a Directory synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.removeFileSync

```typescript
///file: typedef.d.ts
function removeFileSync(path: string): void;
```

> Delete a File synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.removeDirSync

```typescript
///file: typedef.d.ts
function removeDirSync(path: string): void;
```

> Remove a Folder synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.deleteSync

```typescript
///file: typedef.d.ts
function deleteSync(path: string): void;
```

> Remove a File or Folder synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.createDirSync

```typescript
///file: typedef.d.ts
function createDirSync(path: string): void;
```

> Create a Directory synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.isFileSync

```typescript
///file: typedef.d.ts
function isFileSync(path: string): boolean;
```

> Check if a path points to a file synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.isDirSync

```typescript
///file: typedef.d.ts
function isDirSync(path: string): boolean;
```

> Check if a path points to a folder synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.ensureDirSync

```typescript
///file: typedef.d.ts
function ensureDirSync(path: string): void;
```

> Ensure the existence of an directory synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.ensureFileSync

```typescript
///file: typedef.d.ts
function ensureFileSync(path: string, contents: string): void;
```

> Ensure the existence of an file synchronously
>
> **Supports**: Linux Windows MacOS

---

## fs.treeSync

```typescript
///file: typedef.d.ts
function treeSync(path: string): string[];
```

> Create a tree of a folder synchronously. Files are specified in absolute paths
>
> **Supports**: Linux Windows MacOS

---

## fs.findFilesSync

```typescript
///file: typedef.d.ts
interface FileFinderOptions {
  extensions?: string[];
  extension?: string;
  filenames?: string[];
  filename?: string;
  validate?(
    filename: string,
    extension: string,
    fileWithExtension: string,
    absolutePath: string
  ): boolean;
}
function findFilesSync(path: string, options: FileFinderOptions): string[];
```

> Find a file in a directory synchronously
>
> **Supports**: Linux Windows MacOS

---

## $

```typescript
///file: typedef.d.ts
interface Process {
  stdout: Buffer;
  stderr: Buffer;
  statusCode: number;
  errored: boolean;
}
function $(command: string): Promise<Process>;
```

> Run a command like you do in a shell
>
> **Warn**
>
> You will have to escape all arguments, as this practically just runs the `command` in a shell
>
> **Supports** Linux Windows MacOS

---

## npm

```typescript
///file: typedef.d.ts
function npm(package: string): Promise<any>;
```

> Import a NPM Module, and download it first, if needed
>
> **Tip**: For typing, use

```typescript
const module: typeof import('<module-name>') = await npm('<module-name>');

// Example:
const { highlight }: typeof import('highlight.js') = npm('highlight.js');
```

> **Supports**: Linux Windows MacOS

---

## getPackageManager

```typescript
///file: typedef.d.ts
function getPackageManager(): 'npm' | 'pnpm' | 'yarn';
```

> Get the currently installed package manager. It will prefer pnpm over yarn over npm. If none is installed, it will throw an Error. This should never happen, as an installed package manager is a requirement for the scripts to run
>
> **Supports**: Linux MacOS Windows

---

## env

```typescript
///file: typedef.d.ts
function env(key: string): Promise<string>;
```

> Retrieve an environment variable. If not present, it will ask the user to input the value. The environment is in `$HOME/.ts-runner/env.json`
>
> **Supports**: Linux Windows MacOS

---

## timeToMs

```typescript
///file: typedef.d.ts
interface TimeConfig {
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
}
function timeToMs(time: TimeConfig): number;
```

> Convert the specified time into milliseconds
>
> **Supports** Linux Windows MacOS

---

## sleep

```typescript
///file: typedef.d.ts
function sleep(time: TimeConfig): Promise<void>;
```

> Return a promise that resolves in the specified time
>
> **Supports**: Linux Windows MacOS

---

## sleepSync

```typescript
///file: typedef.d.ts
function sleepSync(time: TimeConfig): void;
```

> Halts execution for the specified amount of time. Not recommended
>
> **Supports**: Linux Windows MacOS

---

## getEnvFile

```typescript
///file: typedef.d.ts
function getEnvFile(): string;
```

> Get's the location of the file that holds all environment variables. File is of type `application/json`.
>
> **Supports** Linux Windows MacOS

---

## getHomePath

```typescript
///file: typedef.d.ts
function getHomePath(): string;
```

> Returns the user's home folder path
>
> **Supports** Linux Windows MacOS

---

## logToFile

```typescript
///file: typedef.d.ts
function logToFile(
  level: 'warn' | 'error' | 'info',
  message: string,
  ...args: any[]
): Promise<void>;
```

> Logs a message with the level to the logfile. Works like console.log / util.format
>
> **Supports**: Linux Windows MacOS

---

## logToFileSync

```typescript
///file: typedef.d.ts
function logToFileSync(
  level: 'warn' | 'error' | 'info',
  message: string,
  ...args: any[]
): void;
```

> Logs a message with the level to the logfile synchronously. Works like console.log / util.format
>
> **Supports**: Linux Windows MacOS

---

## clearAllIntervals

```typescript
///file: typedef.d.ts
function clearAllIntervals(): void;
```

> Clears all Intervals
>
> **Supports**: Linux Windows MacOS

---

## clearAllTimeouts

```typescript
///file: typedef.d.ts
function clearAllTimeouts(): void;
```

> Clears all Timeouts
>
> **Supports**: Linux Windows MacOS

---

## isWin

```typescript
///file: typedef.d.ts
function isWin(): boolean;
```

> Returns if you are on Windows
>
> **Supports**: Everything

---

## isMac

```typescript
///file: typedef.d.ts
function isMac(): boolean;
```

> Returns if you are on MacOS
>
> **Supports**: Everything

---

## isLinux

```typescript
///file: typedef.d.ts
function isLinux(): boolean;
```

> Returns if you are on Linux
>
> **Supports**: Everything

---

## md

```typescript
///file: typedef.d.ts
function md(text: string): string;
```

> Converts Markdown to HTML
>
> **Supports**: Linux Windows MacOS

---

## send

```typescript
///file: typedef.d.ts
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
```

> Send a message to a channel using IPC.
>
> **Note**: This is mainly used for APIs, not recommended, as you can usually do everything in a destinct function (for example, the `OPEN` channel is used under the hood by `open(...)`)
>
> **Supports**: Everything

---

## sendWithResponse

```typescript
///file: typedef.d.ts
function sendWithResponse(channel: Channel, data: any): Promise<any>;
```

> Sends a message to a channel usinc IPC and waits for a response.
>
> **Note**: This is mainly used for APIs, not recommended, as you can usually do everything in a destinct function (for example, the `SHOW_WIDGET` channel is used under the hood by `widget(...)`)
>
> **Supports**: Everything

---

## cd

```typescript
///file: typedef.d.ts
function cd(path: string): void;
```

> Changes the current Directory. Only Accepts absolute paths.
>
> **Supports**: Linux Windows MacOS

---

## getLogDir

```typescript
///file: typedef.d.ts
function getLogDir(): string;
```

> Returns the logging directory
>
> **Supports**: Linux Windows MacOS

---

## getLogFile

```typescript
///file: typedef.d.ts
function getLogFile(): string;
```

> Returns the logging file
>
> **Supports**: Linux Windows MacOS

---

## getPackageDir

```typescript
///file: typedef.d.ts
function getPackageDir(): string;
```

> returns the package direcotry
>
> **Supports**: Linux Windows MacOS

---

## writeToSelection

```typescript
///file: typedef.d.ts
function writeToSelection(text: string): Promise<void>;
```

> Write text at the current cursor position
>
> **Supports**:

---

## arg

```typescript
///file: typedef.d.ts
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
  ) => Promise<string | undefined> | string | undefined
): Promise<string>;
```

> Gets an argument. If none is present, it asks the user to specify one, using the name and options. When autocomplete is present, it will grab the html from there and display it on the side.
>
> **Supports**: Linux Windows MacOS

---

## hide

```typescript
///file: typedef.d.ts
function hide(): Promise<void>;
```

> Hides the GUI
>
> **Supports**: Linux Windows MacOS

---

## show

```typescript
///file: typedef.d.ts
function show(): Promise<void>;
```

> Shows the GUI
>
> **Supports**: Linux Windows MacOS

---

## spawn

```typescript
///file: typedef.d.ts
function spawn(name: string, args: string[], options?: any): void;
```

> Spawns the program with the name `name` and args `args`
>
> Please use this instead of child_process.spawn, as it helps with better cleanup of memory after the script ends
>
> **Supports**: Linux Windows MacOS

---

## highlight

```typescript
///file: typedef.d.ts
function highlight(code: string, language?: string): string;
```

> Highlights a piece of code. Default language is `typescript`
>
> **Supports**: Linux Windows MacOS

---

## getHljsStyle

```typescript
///file: typedef.d.ts
function getHljsStyle(style: string): string;
```

> Get's a Highlight.js style. Include it in a `<style>` tag.
>
> **Supports** Linux MacOS Windows

---

## widget

```typescript
///file: typedef.d.ts
function widget(code: string): Promise<string>;
```

> Launches a new widget with `code` as it's html. It returns the `widgetID` so you can later change it.
>
> **Supports**: Linux MacOS Windows

---

## dev

```typescript
///file: typedef.d.ts
function dev(value?: any): Promise<void>;
```

> Launches an empty devtools window. If `value` is provided, it will get logged and `window.obj` and `window.value` will get set to it.
>
> **Supports**: Linux Windows MacOS

---

## updateWidget

```typescript
///file: typedef.d.ts
function updateWidget(id: string, content: string): Promise<void>;
```

> Update a widget. `id` should be the widgetID and `content` the new HTML.
>
> **Supports**: Linux Windows MacOS

---

## get

```typescript
///file: typedef.d.ts
function get(url: URL | string): Promise<any>;
```

> Make a `get` request to `url`. If a non-2xx code is returned an error will be thrown
>
> Assumes API is going to return either nothing or JSON
>
> **Supports**: Linux Windows MacOS

---

## db

```typescript
///file: typedef.d.ts
function db<T extends any[] | Record<PropertyKey, any>>(
  name: string,
  defaultValue: T
): Promise<{ write: () => Promise<void>; value: T }>;
```

> Create a database entry. Database entries are only available to this script. The `name` argument determines the table, the `defaultValue` argument determines the default value, if none is set.
>
> The database is stored in `~/.qrunner/<scriptname>.db.json`. The tables are properties of the global object.
>
> **Supports**: Linux Windows MacOS

---

## loader

```typescript
///file: typedef.d.ts
function loader(name: string): {
  updateName(name: string): void;
  stop(name?: string): void;
};
```

> Create a loader. This will display a loader in the user-menu. Close it by calling `stop(...)`, and change the name by calling `updateName(...)` on the returned Object.
>
> Supplying a name to stop will change the name too and stop the loader.
>
> **Supports**: Linux Windows MacOS

---

## setTabs

```typescript
///file: typedef.d.ts
interface Tab {
  name: string;
  key: string;
}
function setTabs(tabs: (string | Tab)[]): void;
```

> Sets the tabs the user can choose from. Sets the selected tab to the first one.
>
> **Supports**: Linux Windows MaCOS

---

## removeTabs

```typescript
///file: typedef.d.ts
function removeTabs(): void;
```

> Removes all tabs
>
> **Supports**: Linux Windows MacOS

---

## onTab

```typescript
///file: typedef.d.ts
function onTab(name: string, cb: () => any): () => void;
```

> Sets the callback that is called when a user selects a tab. Multiple onTab handlers may be registered. Returns a function, which when called, removes the registration.
>
> **Supports**: Linux Windows MacOS

---

## div

```typescript
///file: typedef.d.ts
function div(code: string): void;
```

> Set the html of a custom window
>
> **Supports**: Linux Windows MacOS

---

## resetDiv

```typescript
///file: typedef.d.ts
function resetDiv(): void;
```

> Close that window
>
> **Supports**: Linux Windows MacOS

---

## setTab

```typescript
///file: typedef.d.ts
function setTab(name: string): void;
```

> Sets the currently selected tab
>
> **Supports**: Linux Windows MacOS

---

## drop

```typescript
///file: typedef.d.ts
declare interface DropFile {
  path: string;
  type: string;
  base64: string;
}
function drop(): Promise<DropFile>;
```

> Opens a filepicker
>
> **Supports**: Linux Windows MacOS

---

## edit

```typescript
///file: typedef.d.ts
function edit(path: string): void;
```

> Open a file in the user-configured code editor
>
> **Supports**: Linux Windows MacOS

---

## onEvent

```typescript
///file: typedef.d.ts
function onEvent<T extends keyof WindowEventMap>(
  name: T,
  cb: (
    widgetId: string | undefined,
    args: [WindowEventMap[T], ...any[]]
  ) => void
): () => void;
```

> Listen to and event
>
> When the event occurred in the div(...) window, widgetId will be undefined
>
> **Supports**: Linux Windows MacOS

---

## closeWidget

```typescript
///file: typedef.d.ts
function closeWidget(widgetId: string): void;
```

> Closes a widget
>
> **Supports**: Linux Windows MacOS

---

## startDrag

```typescript
///file: typedef.d.ts
function startDrag(file: string): void;
```

> Start dragging the file supplied with the `file` argument
>
> **Supports**: Linux Windows MacOS

---

## textarea

```typescript
///file: typedef.d.ts
function textarea(name: string): Promise<string>;
```

> Get input from a textarea (multi-line input field)
>
> **Supports**: Linux Windows MacOS

---

## tmp

```typescript
///file: typedef.d.ts
function tmp(content: string, name?: string, extension?: string): string;
```

> Create a temporary file
>
> **Supports**: Linux Windows MacOS

---

## API Namespace

> All above-mentioned functions are available in the API namespace. This means, you can call `widget(...)` and `API.widget(...)` and it will do the exact same.

---

## Script Module

> If a script ends with .module.ts, it's considered a module and won't show up in the executable scripts. It can be used by other scripts. An example for this could be a file explorer:

```typescript
///file: my-awesome-script.ts
/**
 * @name My Awesome Script
 * @description My Awesome Description
 * @author You <https://github.com/You>
 */
import './globals';
import { fileExplorer } from './fileExplorer.module';

(async function () {
  // ...

  const file = await fileExplorer(getHomePath());

  // ...
})();
```
