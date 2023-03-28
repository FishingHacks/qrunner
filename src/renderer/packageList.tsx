import { useEffect, useRef, useState } from 'react';
import { API } from './api';
import { DefaultViewProps, error, loader, loaderIsRunning } from './App';
import { Kbd } from './kbd';
import ScrollArea from './scrollarea';
import { useAsyncState } from './utils';

function removePackage(name: string) {
  const pLoader = loader('Removing package ' + name);
  return API.removePackage(name).then(
    pLoader.stop(() => {}, 'Successfully unistalled ' + name),
    pLoader.stop(() => {}, 'Failed to uninstall ' + name)
  );
}

let $uninstallPackage: () => void = () => {};
let $reloadProcs: () => void = () => {};
let $move: (down: boolean) => void = () => {};

const requiredPackages = [
  '@types/node',
  'marked',
  'highlight.js',
  'esbuild',
];

export default function PackageList(props: DefaultViewProps) {
  props.config.disableBar = false;
  props.config.disableSearch = false;
  props.config.disableTabs = false;
  props.config.searchName = 'Search Script';

  const [selected, setSelected] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const { state: options, reload: reloadProcs } = useAsyncState(
    API.getPackages
  );
  const filteredOptions =
    options === 'loading'
      ? []
      : Object.entries(options)
          .filter(
            ([name]) =>
              name.toLowerCase().includes(props.config.searchLowerCase) &&
              !requiredPackages.includes(name)
          )
          .map(([name, version]) => ({
            name,
            version,
          }));

  $reloadProcs = reloadProcs;
  $uninstallPackage = () => {
    if (!filteredOptions[selected]) return;
    props.config.setSearch('');
    removePackage(filteredOptions[selected].name).then(() => $reloadProcs());
  };
  $move = (down) => {
    let newSelected = selected;
    if (down) {
      if (selected >= filteredOptions.length - 1) newSelected = 0;
      else newSelected++;
    } else {
      if (selected <= 0) newSelected = filteredOptions.length - 1;
      else newSelected--;
    }
    if (newSelected !== selected) {
      if (selectedRef.current) {
        const element =
          selectedRef.current.parentElement?.children[newSelected];
        if (!element) return;
        const rect = element.getBoundingClientRect();
        if (
          rect.top < 0 ||
          rect.left < 0 ||
          rect.bottom >
            (window.innerHeight || document.documentElement.clientHeight) ||
          rect.right >
            (window.innerWidth || document.documentElement.clientWidth)
        )
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
      }
      setSelected(newSelected);
    }
  };

  useEffect(() => {
    props.config.setFooter([
      <p style={{ cursor: 'pointer' }} onClick={() => $uninstallPackage()}>
        <Kbd>+</Kbd>: install package
      </p>,
      <p style={{ cursor: 'pointer' }} onClick={() => $uninstallPackage()}>
        <Kbd>enter</Kbd>: uninstall package
      </p>,
      <p style={{ cursor: 'pointer' }} onClick={() => $reloadProcs()}>
        <Kbd>f5</Kbd>: reload packages
      </p>,
    ]);
    async function onKeyDown(e: KeyboardEvent) {
      let prevent = true;
      if (e.key === 'Enter') $uninstallPackage();
      else if (e.key === 'ArrowUp') $move(false);
      else if (e.key === 'ArrowDown') $move(true);
      else if (e.key === 'F5') $reloadProcs();
      else if (e.key === '+') {
        try {
          if (loaderIsRunning) return;
          const name = await API.arg('Package name:');
          const { stop, setName } = loader('Installing ' + name);
          API.installPackage(name).then(
            stop(() => $reloadProcs(), 'Successfully installed ' + name),
            stop(null as any, 'Failed to install ' + name)
          );
        } catch {}
      } else prevent = false;
      if (prevent) e.preventDefault();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => {
    const onExit = () => $reloadProcs();
    API.addEventListener('proc-exit', onExit);
    return () => API.removeEventListener('proc-exit', onExit);
  }, []);

  return (
    <div
      className="options"
      style={{ height: 'calc(var(--page-height) - 1.75em)' }}
    >
      <ScrollArea>
        <h3 style={{ margin: '0px 1rem' }}>Installed Packages:</h3>
        {filteredOptions.map((el, i) => (
          <div
            ref={selected === i ? selectedRef : undefined}
            key={el.name}
            className={`option ${selected === i && 'selected'}`}
            onMouseOver={() => (selected === i ? null : setSelected(i))}
            onClick={() => {
              removePackage(el.name).then(() => $reloadProcs());
            }}
          >
            <div className="opt-name">{el.name}</div>
            <div className={'opt-description opt-highlight'}>
              Version: {el.version}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
