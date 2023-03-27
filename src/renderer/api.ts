import { ColorScheme } from './constants';

type pVoid = Promise<void>;
type pStr = Promise<string>;
interface ElectronApi {
  createScript(name: string): pVoid;
  runScript(name: string): pVoid;
  getScriptDir(): pStr;
  getScript(name: string): pStr;
  getScripts(): Promise<File[]>;
  openGithub(name: string): pVoid;
  editScript(name: string): pVoid;
  getColors(): Promise<ColorScheme>;
  respond(string?: string | null): pVoid;
  arg<T extends string>(
    name: string,
    options?: (T | ArgOption<T>)[],
    hint?: string
  ): Promise<T>;
  getProcs(): Promise<Record<number, string>>;
  killProcess(pid: number): pVoid;
  hideWindow(): pVoid;
  showWindow(): pVoid;
  setColors(colors: ColorScheme): pVoid;
  getColorSchemes(): Promise<Record<string, ColorScheme>>;
  createColorScheme(name: string, scheme: ColorScheme): pVoid;
  deleteColorScheme(name: string): pVoid;
  createWidget(name: string, content: string): pStr;
  copy(str: string): pVoid;
  removeScript(path: string): pVoid;
  rename(path: string, newname: string): pVoid;
  openClearDevtools(val?: any): pVoid;
  getAPIDocs(): pStr;
  getFont(): pStr;
  setFont(font: string): pVoid;
  getPackages(): Promise<Record<string, string>>;
  removePackage(name: string): pVoid;
  setSelectedTab(name: string): pVoid;
  getTabPreview(
    key: string
  ): Promise<{ key: string; data: string | undefined }>;
  open(link: string): pVoid;
  dropFile(file: DropFile | null): pVoid;
  event(name: string, widgetId: string | undefined, ...args: any[]): pVoid;
  getConfig(name: string): pStr;
  setConfig(name: string, value: string): pVoid;
  createFromFile(path: string, contents: string): pVoid;
  installPackage(name: string): pVoid;
  startDrag(file: string): pVoid;
  importFileFromComputer(): pVoid;
  submitTextarea(value: string | null | undefined): pVoid;
  getShortcut(): pStr;
  setShortcut(newShortcut: string): pVoid;
  getScriptshortcuts(): Promise<Record<string, string>>
  addEventListener(
    event: string,
    cb: (event: any, ...args: any[]) => void
  ): () => void;
  removeEventListener(
    event: string,
    cb: (event: any, ...args: any[]) => void
  ): void;
  emitEvent(event: string, ...args: any[]): void;
}

export interface File {
  name: string;
  path: string;
  description: string;
  author: string;
  githubName?: string | undefined;
  twitterName?: string | undefined;
  youtubeName?: string | undefined;
  uses: string[];
  shortcut?: string;
  schedule?: string;
  nextRun?: number;
}

export interface ArgOption<T extends string = string> {
  name: string;
  description?: string;
  key: T;
  background?: string;
  image?: string;
}

export interface DropFile {
  path: string;
  type: string;
}

export const API = (globalThis as any).__api as ElectronApi;
