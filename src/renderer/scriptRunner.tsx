import { slugify } from 'main/slugify';
import { useEffect, useRef, useState } from 'react';
import { API } from './api';
import { DefaultViewProps, loader, loaderIsRunning } from './App';
import CodeHighlight from './highlight';
import ScrollArea from './scrollarea';
import Username from './username';
import { useAsyncState } from './utils';

function runScript(name: string) {
  if (loaderIsRunning) return;
  const sLoader = loader(name);
  return API.runScript(name).then(sLoader.stop(), sLoader.stop());
}

let $reloadFiles = () => {};
let $editScript = () => {};
let $runScript = () => {};
let $scriptActions = () => {};
let $move: (down: boolean) => void = () => {};

export default function ScriptSearch(props: DefaultViewProps) {
  const { searchLowerCase, search } = props.config;
  const { state: files, setState: setFiles } = useAsyncState(API.getScripts);
  const { state: dir } = useAsyncState(API.getScriptDir);
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);

  const filteredFiles = (files === 'loading' ? [] : files).filter(
    (el) =>
      el.name.toLowerCase().includes(searchLowerCase) ||
      el.description.toLowerCase().includes(searchLowerCase) ||
      el.path.toLowerCase().includes(search)
  );
  const { state: scriptContents, setState: setScriptContents } = useAsyncState(
    API.getScript,
    filteredFiles[selected]?.path || ''
  );

  if (selected < 0) setSelected(0);
  if (selected > filteredFiles.length && filteredFiles.length > 0)
    setSelected(filteredFiles.length);

  $reloadFiles = () => {
    API.forceReloadFiles().then(setFiles);
    if (filteredFiles[selected])
      API.getScript(filteredFiles[selected].path).then(setScriptContents);
  };
  $editScript = () => {
    if (filteredFiles[selected]) {
      API.editScript(filteredFiles[selected].path);
      API.hideWindow();
    }
  };
  $move = (down) => {
    let newSelected = selected;
    let minus =
      search.length === 0
        ? 1
        : search &&
          !(typeof files !== 'object'
            ? true
            : files.find((el) => el.path === slugify(search) + '.ts'))
        ? 0
        : 1;
    if (down) {
      if (selected < filteredFiles.length - minus) newSelected = selected + 1;
      else newSelected = 0;
    } else {
      if (selected === 0) newSelected = filteredFiles.length - minus;
      else newSelected = selected - 1;
    }
    if (newSelected !== selected) {
      if (selectedRef.current) {
        const element =
          selectedRef.current.parentElement?.children[newSelected];
        if (!element) return;
        const rect = element.getBoundingClientRect();
        console.log(rect);
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
      API.getScript(filteredFiles[newSelected]?.path || '').then((c) => {
        setScriptContents(c);
        setSelected(newSelected);
      });
    }
  };
  $runScript = () => {
    props.config.setSearch('');
    if (filteredFiles[selected]) {
      runScript(filteredFiles[selected].path);
    } else if (
      search &&
      !(typeof files !== 'object'
        ? true
        : files.find((el) => el.path === slugify(search) + '.ts'))
    ) {
      API.createScript(search);
      API.hideWindow();
    }
  };
  $scriptActions = async () => {
    if (!filteredFiles[selected]) return;
    const opt = await API.arg('Select Action', [
      {
        key: 'copy-bin-path',
        name: 'Copy Binary Path',
        description:
          'You can use this to run the script from the command line or other programs that can run binary files, such as a Streamdeck',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWNsaXBib2FyZC1jb3B5IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjI1IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgIDxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSI+PC9wYXRoPgogICA8cGF0aCBkPSJNOSA1aC0yYTIgMiAwIDAgMCAtMiAydjEyYTIgMiAwIDAgMCAyIDJoM205IC05di01YTIgMiAwIDAgMCAtMiAtMmgtMiI+PC9wYXRoPgogICA8cGF0aCBkPSJNMTMgMTd2LTFhMSAxIDAgMCAxIDEgLTFoMW0zIDBoMWExIDEgMCAwIDEgMSAxdjFtMCAzdjFhMSAxIDAgMCAxIC0xIDFoLTFtLTMgMGgtMWExIDEgMCAwIDEgLTEgLTF2LTEiPjwvcGF0aD4KICAgPHBhdGggZD0iTTkgM20wIDJhMiAyIDAgMCAxIDIgLTJoMmEyIDIgMCAwIDEgMiAydjBhMiAyIDAgMCAxIC0yIDJoLTJhMiAyIDAgMCAxIC0yIC0yeiI+PC9wYXRoPgo8L3N2Zz4=',
      },
      {
        key: 'delete-file',
        name: 'Delete',
        description:
          'Delete "' +
          filteredFiles[selected].name +
          '". You won\'t be able to recover it.',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLXRyYXNoIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjI1IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgIDxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSI+PC9wYXRoPgogICA8cGF0aCBkPSJNNCA3bDE2IDAiPjwvcGF0aD4KICAgPHBhdGggZD0iTTEwIDExbDAgNiI+PC9wYXRoPgogICA8cGF0aCBkPSJNMTQgMTFsMCA2Ij48L3BhdGg+CiAgIDxwYXRoIGQ9Ik01IDdsMSAxMmEyIDIgMCAwIDAgMiAyaDhhMiAyIDAgMCAwIDIgLTJsMSAtMTIiPjwvcGF0aD4KICAgPHBhdGggZD0iTTkgN3YtM2ExIDEgMCAwIDEgMSAtMWg0YTEgMSAwIDAgMSAxIDF2MyI+PC9wYXRoPgo8L3N2Zz4=',
      },
      {
        key: 'rename',
        name: 'Rename',
        description: 'Rename "' + filteredFiles[selected].name + '"',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb24tdGFibGVyLWVkaXQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBzdHJva2Utd2lkdGg9IjEuMjUiIHN0cm9rZT0iI2ZmZiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgPHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+CiAgIDxwYXRoIGQ9Ik03IDdoLTFhMiAyIDAgMCAwIC0yIDJ2OWEyIDIgMCAwIDAgMiAyaDlhMiAyIDAgMCAwIDIgLTJ2LTEiPjwvcGF0aD4KICAgPHBhdGggZD0iTTIwLjM4NSA2LjU4NWEyLjEgMi4xIDAgMCAwIC0yLjk3IC0yLjk3bC04LjQxNSA4LjM4NXYzaDNsOC4zODUgLTguNDE1eiI+PC9wYXRoPgogICA8cGF0aCBkPSJNMTYgNWwzIDMiPjwvcGF0aD4KPC9zdmc+',
      },
      {
        key: 'publish',
        name: 'Publish to a github gist',
        description:
          'Publish "' + filteredFiles[selected].name + '" to a github gist',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZT0iI2ZmZiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBzdHJva2U9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiPjwvcGF0aD48cGF0aCBkPSJNOSAxOWMtNC4zIDEuNCAtNC4zIC0yLjUgLTYgLTNtMTIgNXYtMy41YzAgLTEgLjEgLTEuNCAtLjUgLTJjMi44IC0uMyA1LjUgLTEuNCA1LjUgLTZhNC42IDQuNiAwIDAgMCAtMS4zIC0zLjJhNC4yIDQuMiAwIDAgMCAtLjEgLTMuMnMtMS4xIC0uMyAtMy41IDEuM2ExMi4zIDEyLjMgMCAwIDAgLTYuMiAwYy0yLjQgLTEuNiAtMy41IC0xLjMgLTMuNSAtMS4zYTQuMiA0LjIgMCAwIDAgLS4xIDMuMmE0LjYgNC42IDAgMCAwIC0xLjMgMy4yYzAgNC42IDIuNyA1LjcgNS41IDZjLS42IC42IC0uNiAxLjIgLS41IDJ2My41Ij48L3BhdGg+PC9zdmc+',
      },
    ]).catch(() => {});
    if (opt === 'copy-bin-path') {
      const split = dir.split('/');
      split.pop();
      split.push(
        'bin',
        filteredFiles[selected].path.substring(
          0,
          filteredFiles[selected].path.length - 3
        )
      );
      API.copy(split.join('/'));
    } else if (opt === 'delete-file') {
      API.removeScript(filteredFiles[selected].path);
    } else if (opt === 'rename') {
      const newname = await API.arg('New Name');
      API.rename(filteredFiles[selected].path, newname);
    } else if (opt === 'publish') {
      let token = await API.getConfig('githubToken');
      if (!token) {
        API.open('https://github.com/settings/tokens/new');
        token = await API.arg(
          'Please input a legacy github token with the gist permission!'
        );
        if (!token) return API.arg('Error: No token specified!');
        API.setConfig('githubToken', token);
      }

      try {
        const json = await fetch('https://api.github.com/gists', {
          method: 'post',
          headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.github+json',
            // 'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            public: true,
            files: {
              [filteredFiles[selected].path.split('/').pop() || 'unknown.ts']: {
                content: await API.getScript(filteredFiles[selected].path),
              },
            },
            description: filteredFiles[selected].description,
          }),
        }).then((r) => {
          if (r.status === 401) throw new Error();
          return r.json();
        });

        await navigator.clipboard.writeText(
          `https://gist.github.com/${json.owner.login}/${json.id}`
        );
        new Notification('Copied gist url', {
          body: 'Copied gist url to your clipboard!',
        });
      } catch {
        API.open('https://github.com/settings/tokens/new');
        token = await API.arg(
          'Please input a legacy github token with gist permission!'
        );
        API.setConfig('githubToken', token);

        const json = await fetch('https://api.github.com/gists', {
          method: 'post',
          headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.github+json',
            // 'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            public: true,
            files: {
              [filteredFiles[selected].path.split('/').pop() || 'unknown.ts']: {
                content: await API.getScript(filteredFiles[selected].path),
              },
            },
            description: filteredFiles[selected].description,
          }),
        }).then((r) => {
          if (r.status === 401) throw new Error();
          return r.json();
        });

        await navigator.clipboard.writeText(
          `https://gist.github.com/${json.owner.login}/${json.id}`
        );
        new Notification('Copied gist url', {
          body: 'Copied gist url to your clipboard!',
        });
      }
    }
  };

  useEffect(() => {
    function onClick(e: KeyboardEvent) {
      let prevent = true;
      if (e.key === 'ArrowUp') $move(false);
      else if (e.key === 'ArrowDown') $move(true);
      else if (e.key === 'Enter') $runScript();
      else if (e.key === 'F5') $reloadFiles();
      else if (e.key === 'F2') $editScript();
      else if (e.key === 'F3') $scriptActions();
      else prevent = false;
      if (prevent) e.preventDefault();
      return !prevent;
    }
    window.addEventListener('keydown', onClick);
    return () => window.removeEventListener('keydown', onClick);
  }, []);

  useEffect(() => {
    function scriptChange() {
      API.forceReloadFiles().then(setFiles);
      if (filteredFiles[selected])
        API.getScript(filteredFiles[selected].path).then(setScriptContents);
    }
    return API.addEventListener('script-change', scriptChange);
  });

  props.config.searchName = 'Run Script';
  useEffect(() => {
    const footer = [];
    footer.push(
      <p>
        Directory:{' '}
        <a
          onClick={dir === 'loading' ? undefined : API.openScriptDirectory}
          className={dir === 'loading' ? '' : 'link'}
          href={dir}
          onDragStart={(ev) => {
            ev.preventDefault();
            API.startDrag(dir);
          }}
        >
          {dir}
        </a>
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => API.openClearDevtools()}>
        Open new Devtools
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => $reloadFiles()}>
        <kbd>F5</kbd>: reload scripts
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => $editScript()}>
        <kbd>F2</kbd>: edit the current script
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => $scriptActions()}>
        <kbd>F3</kbd>: get further actions
      </p>
    );
    props.config.setFooter(footer);
  }, [dir]);

  return (
    <>
      <div className="scripts">
        <ScrollArea>
          {files === 'loading' ? (
            <>Loading...</>
          ) : (
            <>
              {filteredFiles.length > 0 &&
                filteredFiles.map((el, i) => (
                  <div
                    ref={selected === i ? selectedRef : undefined}
                    key={el.path}
                    className={`script-entry ${selected === i && 'selected'}`}
                    onClick={() => runScript(el.path)}
                    onMouseOver={() => (selected === i ? null : setSelected(i))}
                  >
                    <div className="script-name">{el.name || el.path}</div>
                    <div className="script-description">{el.description}</div>
                  </div>
                ))}
              {search &&
                !files.find((el) => el.path === slugify(search) + '.ts') && (
                  <div
                    className={
                      'script-entry ' + (!filteredFiles[selected] && 'selected')
                    }
                    onClick={() => {
                      API.createScript(search);
                      API.hideWindow();
                    }}
                    onMouseOver={() => setSelected(filteredFiles.length)}
                  >
                    <div className="script-name">Create Script</div>
                    <div className="script-description">
                      Create a new Script titled {search}
                    </div>
                  </div>
                )}
            </>
          )}
        </ScrollArea>
      </div>
      <div className="details">
        {filteredFiles[selected] && (
          <ScrollArea>
            <p className="d-name">
              <span className="name">Name</span>:{' '}
              <span className="value">{filteredFiles[selected].name}</span>
            </p>
            <p className="d-description">
              <span className="name">Description</span>:{' '}
              <span className="value">
                {filteredFiles[selected].description}
              </span>
            </p>
            <p className="d-author">
              <span className="name">Author</span>:{' '}
              <span className="value">
                {filteredFiles[selected].githubName ? (
                  <Username
                    name={filteredFiles[selected].author}
                    link={
                      'https://github.com/' + filteredFiles[selected].githubName
                    }
                  />
                ) : filteredFiles[selected].twitterName ? (
                  <Username
                    name={filteredFiles[selected].author}
                    link={
                      'https://twitter.com/' +
                      filteredFiles[selected].twitterName
                    }
                  />
                ) : filteredFiles[selected].youtubeName ? (
                  <Username
                    name={filteredFiles[selected].author}
                    link={
                      'https://youtube.com/' +
                      filteredFiles[selected].youtubeName
                    }
                  />
                ) : (
                  filteredFiles[selected].author
                )}
              </span>
            </p>
            <div className="filename">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="1rem"
                height="1rem"
              >
                <path fill="#1976d2" d="M6 6h36v36H6z"></path>
                <path
                  fill="#fff"
                  d="M27.49 22H14.227v3.264h4.757V40h3.769V25.264h4.737zM39.194 26.084s-1.787-1.192-3.807-1.192-2.747.96-2.747 1.986c0 2.648 7.381 2.383 7.381 7.712 0 8.209-11.254 4.568-11.254 4.568V35.22s2.152 1.622 4.733 1.622 2.483-1.688 2.483-1.92c0-2.449-7.315-2.449-7.315-7.878 0-7.381 10.658-4.469 10.658-4.469l-.132 3.509z"
                ></path>
              </svg>
              <a href={'file:///~/.qrunner/scripts/' + filteredFiles[selected].path} className='link' onDragStart={(ev) => {
                ev.preventDefault();
                API.startDrag('~/.qrunner/scripts/' + filteredFiles[selected].path)
              }}>
              {filteredFiles[selected].path}
              </a>
            </div>
            <CodeHighlight code={scriptContents} />
          </ScrollArea>
        )}
      </div>
    </>
  );
}
