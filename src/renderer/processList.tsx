import { useEffect, useRef, useState } from 'react';
import { API } from './api';
import { DefaultViewProps, loader, resetLoader } from './App';
import { Kbd } from './kbd';
import ScrollArea from './scrollarea';
import { useAsyncState } from './utils';

let $killCurrentProcess: () => void = () => {};
let $reloadProcs: () => void = () => {};
let $move: (down: boolean) => void = () => {};

export default function Processes(props: DefaultViewProps) {
  props.config.disableBar = false;
  props.config.disableSearch = false;
  props.config.disableTabs = false;
  props.config.searchName = 'Search Script';

  const [selected, setSelected] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const { state: options, reload: reloadProcs } = useAsyncState(API.getProcs);
  const filteredOptions = Object.entries(options === 'loading' ? [] : options)
    .filter(
      ([pid, name]) =>
        pid.toLowerCase().includes(props.config.searchLowerCase) ||
        name.toLowerCase().includes(props.config.searchLowerCase)
    )
    .map(([pid, name]) => ({ pid: Number(pid), name }));

  $reloadProcs = reloadProcs;
  $killCurrentProcess = () => {
    if (!filteredOptions[selected]) return;
    props.config.setSearch('');
    API.killProcess(filteredOptions[selected].pid).then(() => $reloadProcs());
  };
  $move = (down) => {
    let newSelected = selected;
    if (down) {
      if (selected < filteredOptions.length - 1) newSelected = selected + 1;
      else newSelected = 0;
    } else {
      if (selected === 0) newSelected = filteredOptions.length - 1;
      else newSelected = selected - 1;
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
      <p style={{ cursor: 'pointer' }} onClick={() => $killCurrentProcess()}>
        <Kbd>K</Kbd>: kill the selected script
      </p>,
      <p style={{ cursor: 'pointer' }} onClick={() => $reloadProcs()}>
        <Kbd>f5</Kbd>: reload the running scripts
      </p>,
      <p style={{ cursor: 'pointer' }} onClick={() => resetLoader()}>
        <Kbd>f7</Kbd>: Move the currently running script to the background
      </p>,
    ]);
    function onKeyDown(e: KeyboardEvent) {
      let prevent = true;
      if (e.key === 'k') $killCurrentProcess();
      else if (e.key === 'ArrowUp') $move(false);
      else if (e.key === 'ArrowDown') $move(true);
      else if (e.key === 'F5') $reloadProcs();
      else if (e.key === 'F7') resetLoader();
      else prevent = false;
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
        <h3 style={{ margin: '0px 1rem' }}>Running Scripts</h3>
        {filteredOptions.map((el, i) => (
          <div
            ref={selected === i ? selectedRef : undefined}
            key={el.pid}
            className={`option ${selected === i && 'selected'}`}
            onMouseOver={() => (selected === i ? null : setSelected(i))}
            onClick={() => {
              API.killProcess(el.pid).then(() => $reloadProcs());
            }}
          >
            <div className="opt-name">{el.name}</div>
            <div className={'opt-description opt-highlight'}>
              Process ID: {el.pid}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
