import { useEffect, useRef, useState } from 'react';
import { API, ArgOption } from './api';
import ApiDocs from './apiDocs';
import ScriptSearch from './scriptRunner';
import Question from './Question';
import Tabs from './Tabs';
import { useAsyncState } from './utils';
import Settings from './settings';
import Processes from './processList';
import { ColorScheme } from './constants';
import ErrorElement from './error';

// fonts
import '@fontsource/figtree';
import '@fontsource/ubuntu';
import '@fontsource/b612';
import '@fontsource/blinker';
import '@fontsource/cambo';
import '@fontsource/carrois-gothic';
import '@fontsource/epilogue';
import '@fontsource/flamenco';
import '@fontsource/gayathri';
import PackageList from './packageList';
import LoadingSvg from './loaderSvg';
import Window from './window';
import { KbdList } from './kbd';
import Drop from './drop';
import New from './new';

let i = 0;

export interface DefaultViewProps {
  config: {
    search: string;
    searchLowerCase: string;
    colors: ColorScheme | 'loading';
    setSearch(val: string | ((val: string) => string)): void;
    setFooter(val: JSX.Element[]): void;
    searchName: string;
    disableSearch: boolean;
    disableBar: boolean;
    disableTabs: boolean;
  };
}

export let error: (name: string) => (err: any) => void = () => () => {};

interface Loader {
  stop<T extends any[], K extends any>(
    cb?: (...args: T) => K,
    newName?: string
  ): (...args: T) => K;
  setName(newName: string): void;
}

export let loaderIsRunning = false;

export let loader: (name: string) => Loader = (name) => ({
  stop: (cb) => cb as any,
  setName: () => {},
});

interface LoaderData {
  open: boolean;
  name: string;
  loading: boolean;
}

let $setULoaderData = (
  value: LoaderData | ((data: LoaderData) => LoaderData)
) => {};
let $setLoaderData = (
  value: LoaderData | ((data: LoaderData) => LoaderData)
) => {};
export function resetLoader() {
  $setLoaderData({
    loading: true,
    name: '',
    open: false,
  });
}

interface UTab {
  name: string;
  key: string;
}
let $setDrop = (value: boolean) => {};
let $setUTabs = (tabs: UTab[]) => {};
let $setCode = (code: string) => {};
let $setSelectedTab = (name: string) => {};

const App = () => {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target || e.srcElement) as HTMLElement;
      if (el.tagName === 'A' && (el as HTMLAnchorElement).href) {
        const url = new URL((el as HTMLAnchorElement).href);
        if (url.origin === location.origin) return;
        e.preventDefault();
        API.open(url.href);
      }
    }
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  });
  const { state: colors, reload: reloadColors } = useAsyncState(API.getColors);
  const [footer, setFooter] = useState<JSX.Element[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const searchLowerCase = search.toLowerCase();
  const [tab, setTab] = useState<
    'search' | 'api-docs' | 'settings' | 'proc-list' | 'package-list' | 'new'
  >('search');
  const [argMode, setArgMode] = useState(false);
  const [errMode, setErrMode] = useState(false);
  const [code, setCode] = useState('');
  const [dropMode, setDropMode] = useState(false);
  const [argOpt, setArgOpt] = useState<{
    name: string;
    options?: (string | ArgOption)[];
  }>({ name: '' });
  const [errProps, setErrProps] = useState<{ name: string; error: string }>({
    error: '',
    name: '',
  });
  const [loaderData, setLoaderData] = useState<LoaderData>({
    open: false,
    name: '',
    loading: true,
  });
  const [uTabData, setUTabData] = useState<{
    enabled: boolean;
    names: UTab[];
    selected: string;
  }>({ enabled: false, names: [], selected: '' });
  const [uLoader, setULoader] = useState<LoaderData>({
    loading: true,
    name: '',
    open: false,
  });
  const titleRef = useRef<HTMLDivElement>(null);
  loaderIsRunning = loaderData.open;
  $setULoaderData = setULoader;
  $setCode = setCode;
  $setDrop = setDropMode;
  $setSelectedTab = (name) =>
    uTabData.enabled
      ? setUTabData((data) => ({ ...data, selected: name }))
      : null;

  $setUTabs = (tabs) =>
    tabs.length > 0
      ? setUTabData({ enabled: true, selected: tabs[0].key, names: tabs })
      : setUTabData({ enabled: false, selected: '', names: [] });

  loader = function loader(name) {
    setLoaderData({ open: true, name, loading: true });
    return {
      stop(cb, newName) {
        return (...args) => {
          if (newName)
            $setLoaderData((data) => ({
              ...data,
              loading: false,
              name: newName,
            }));
          else $setLoaderData((data) => ({ ...data, loading: false }));
          setTimeout(
            () =>
              $setLoaderData((data) => ({
                ...data,
                open: false,
              })),
            1000
          );
          return cb?.(...args) as any;
        };
      },
      setName(name) {
        $setLoaderData((data) => ({ ...data, name }));
      },
    };
  };
  $setLoaderData = setLoaderData;

  error = (name: string) => (err: any) => {
    if (err.stack) setErrProps({ name, error: err.stack.toString() });
    if (err.message) setErrProps({ name, error: err.message.toString() });
    if (err.name) setErrProps({ name, error: err.name.toString() });
    if (err.stack) setErrProps({ name, error: err.toString() });
    setErrMode(true);
  };

  const props: DefaultViewProps = {
    config: {
      colors,
      setFooter,
      search,
      searchLowerCase,
      setSearch,
      searchName: '',
      disableSearch: false,
      disableBar: false,
      disableTabs: false,
    },
  };

  const tabs: { name: string; id: typeof tab }[] = [
    {
      name: 'Scripts',
      id: 'search',
    },
    {
      name: 'API',
      id: 'api-docs',
    },
    {
      name: 'Settings',
      id: 'settings',
    },
    {
      name: 'New',
      id: 'new',
    },
    {
      name: 'Running Scripts',
      id: 'proc-list',
    },
    {
      name: 'Installed NPM Packages',
      id: 'package-list',
    },
  ] as { name: string; id: typeof tab }[];

  useEffect(() => {
    function keydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && e.ctrlKey) {
        setUTabData({ enabled: false, names: [], selected: '' });
        setULoader({ loading: true, name: '', open: false });
        setErrMode(false);
        setArgMode(false);
        setCode('');
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape' && !hasScriptFunctionality) {
        API.hideWindow();
        e.preventDefault();
        return;
      }
      if (e.key === '#' && e.ctrlKey) {
        inputRef.current?.focus();
        return e.preventDefault();
      }

      if (e.key === 'k' && e.ctrlKey) {
        API.getProcs().then((procs) =>
          Object.keys(procs).map((pid) => API.killProcess(Number(pid)))
        );
        return e.preventDefault();
      }

      if (props.config.disableTabs) return;
      if (
        e.target instanceof HTMLElement &&
        (e.target.nodeName === 'TEXTAREA' || e.target.nodeName === 'INPUT') &&
        (!e.target.classList.contains('script-search') || e.shiftKey)
      )
        return;
    }
    window.addEventListener('keydown', keydown);

    return () => window.removeEventListener('keydown', keydown);
  });

  useEffect(() => {
    API.getFont().then((font) => (document.body.dataset.font = font));
    function onChangeFont(ev: any, font: string) {
      document.body.dataset.font = font;
    }
    API.addEventListener('font-change', onChangeFont);
    return () => API.removeEventListener('font-change', onChangeFont);
  }, []);

  useEffect(() => {
    const a = [
      API.addEventListener('color-change', reloadColors),
      API.addEventListener(
        'arg-open',
        (ev, name: string, options?: (string | ArgOption)[]) => {
          setArgMode(true);
          setArgOpt({
            name,
            options,
          });
        }
      ),
      API.addEventListener('arg-end', () => setArgMode(false)),
      API.addEventListener('display-error', (ev, name: string, err: string) =>
        error(name)(err)
      ),
      API.addEventListener('err-end', () => setErrMode(false)),
      API.addEventListener('loader-update', (ev, props: Partial<LoaderData>) =>
        $setULoaderData((data) => ({ ...data, ...props }))
      ),
      API.addEventListener('user-tabs-set', (ev, tabs: (string | UTab)[]) =>
        $setUTabs(
          tabs.map((el) =>
            typeof el === 'object' ? el : { name: el, key: el }
          )
        )
      ),
      API.addEventListener('set-user-window-code', (ev, code: string) => {
        $setCode(typeof code === 'string' ? code : '');
      }),
      API.addEventListener('switch-tab', (ev, name: string) =>
        $setSelectedTab(name)
      ),
      API.addEventListener('drop', () => $setDrop(true)),
      API.addEventListener('drop-end', () => $setDrop(false)),
    ];
    return () => a.forEach((el) => el());
  }, []);
  useEffect(() => {
    if (uTabData.names.length < 1 || !uTabData.enabled) return;
    console.log('Set selected tab to ' + uTabData.selected);
    API.setSelectedTab(uTabData.selected);
  }, [uTabData.selected]);

  useEffect(() => {
    if (colors !== 'loading') {
      document.children[0].setAttribute(
        'style',

        Object.entries(colors)
          .map(([k, v]) => `--color-${k}: ${v};`)
          .join('\n')
      );
    }
  }, [colors]);

  useEffect(() => {
    if (inputRef.current)
      inputRef.current.placeholder = props.config.searchName;
    if (inputRef.current)
      inputRef.current.disabled = props.config.disableSearch;
    if (footerRef.current)
      footerRef.current.style.display =
        props.config.disableBar || footer.length < 1 ? 'none' : 'flex';
    if (tabRef.current)
      tabRef.current.style.display = props.config.disableTabs ? 'none' : 'flex';
    if (inputRef.current)
      inputRef.current.style.display =
        props.config.disableTabs &&
        props.config.disableSearch &&
        (!uTabData.enabled || uTabData.names.length < 1)
          ? 'none'
          : 'inline-block';
    if (inputRef.current)
      inputRef.current.style.borderBottom =
        props.config.disableTabs &&
        (!uTabData.enabled || uTabData.names.length < 1)
          ? '1px var(--color-primary) solid'
          : 'none';
    if (titleRef.current)
      if (props.config.disableTabs)
        titleRef.current.classList.remove('withtabs');
      else titleRef.current.classList.add('withtabs');

    let pxMinus = 0;
    let remMinus = 0;
    if (
      !props.config.disableSearch ||
      !props.config.disableTabs ||
      (uTabData.enabled && uTabData.names.length > 0)
    ) {
      remMinus += 2;
      pxMinus += 17;
    }
    if (
      !props.config.disableTabs ||
      (uTabData.enabled && uTabData.names.length > 0)
    ) {
      remMinus++;
      pxMinus += 7;
    }
    if (!props.config.disableBar) pxMinus += 22;
    let calculation = '';
    if (pxMinus === 0 && remMinus === 0) calculation = '100vh';
    else
      calculation = `calc(100vh${remMinus ? ' - ' + remMinus + 'rem' : ''}${
        pxMinus ? ' - ' + pxMinus + 'px' : ''
      })`;

    document.body.style.setProperty('--page-height', calculation);
  });

  useEffect(() => {
    function onResize() {
      setTimeout(() => {
        const subbar = document.getElementsByClassName('subbar')[0];
        if (!subbar) return;
        for (const c of Object.values(subbar.children))
          if (c instanceof HTMLElement)
            if (
              c.offsetHeight < c.scrollHeight ||
              c.offsetWidth < c.scrollWidth
            )
              c.style.display = 'none';
            else c.style.display = 'initial';
      }, 50);
    }
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const hasScriptFunctionality =
    argMode ||
    errMode ||
    code.length > 0 ||
    (uTabData.enabled && uTabData.names.length > 0) ||
    dropMode;

  useEffect(() => {
    if (!(hasScriptFunctionality || uLoader.open) && i > 0) API.hideWindow();
    else if (i > 0) API.showWindow();
    i++;
  }, [(hasScriptFunctionality || uLoader.open) && loaderIsRunning]);
  useEffect(() => {
    setSearch('');
  }, [hasScriptFunctionality]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [tab, argMode, uTabData.selected]);

  return (
    <div>
      <input
        type="text"
        className="script-search tabs-ignore titlebar"
        ref={inputRef}
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClick={() => inputRef.current?.focus()}
      />
      <div className="pagetitle" ref={titleRef}>
        <p>
          {!hasScriptFunctionality
            ? tabs.find((el) => el.id === tab)?.name
            : loaderData.name}
        </p>
      </div>
      {uTabData.enabled ? (
        <Tabs
          setFocus={(newTab) => {
            setUTabData((data) => ({ ...data, selected: newTab }));
            setSearch('');
          }}
          focused={uTabData.selected}
          tabs={uTabData.names.map((el) => ({
            name: el.name,
            id: el.key,
          }))}
        />
      ) : (
        <Tabs
          ref={tabRef}
          setFocus={(newTab) => {
            setTab(newTab as any);
            setSearch('');
          }}
          focused={tab}
          tabs={tabs}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {tab === 'search' && !hasScriptFunctionality && (
          <ScriptSearch {...props} />
        )}
        {tab === 'api-docs' && !hasScriptFunctionality && (
          <ApiDocs {...props} />
        )}
        {tab === 'settings' && !hasScriptFunctionality && (
          <Settings {...props} />
        )}
        {tab === 'proc-list' && !hasScriptFunctionality && (
          <Processes {...props} />
        )}
        {tab === 'package-list' && !hasScriptFunctionality && (
          <PackageList {...props} />
        )}
        {tab === 'new' && !hasScriptFunctionality && <New {...props} />}
        {errMode && <ErrorElement {...props} {...errProps} />}
        {argMode && !errMode && <Question {...props} {...argOpt} />}
        {dropMode && <Drop {...props} />}
        {(code.length > 0 || (uTabData.enabled && uTabData.names.length > 0)) &&
          !argMode &&
          !errMode && <Window {...props} code={code} />}
      </div>
      <div className="subbar" ref={footerRef}>
        <div>
          <KbdList keys={['cmd/ctrl', 'k']} />: stop all scripts
        </div>
        {footer.map((el, i) => (
          <div key={'footer-' + i}>{el}</div>
        ))}
      </div>
      <div className="loader-container">
        <div
          className={
            'flex loader uLoader' +
            (uLoader.loading ? ' loading' : '') +
            (!uLoader.open ? ' hidden' : '')
          }
        >
          {uLoader.loading && <LoadingSvg />}
          {uLoader.name}
        </div>
        <div
          className={
            'flex loader' +
            (loaderData.loading ? ' loading' : '') +
            (!loaderData.open ? ' hidden' : '')
          }
        >
          {loaderData.loading && <LoadingSvg />}
          {loaderData.name}
        </div>
      </div>
    </div>
  );
};

export default App;
