import { slugify } from 'main/slugify';
import { useEffect, useRef, useState } from 'react';
import { API } from './api';
import { $setCode, DefaultViewProps, loader, loaderIsRunning } from './App';
import CodeHighlight from './highlight';
import ScrollArea from './scrollarea';
import Username from './username';
import { useAsyncState } from './utils';
import * as icons from './icons';
import { KbdList } from './kbd';

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
    API.getScripts().then(setFiles);
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
      if (
        !filteredFiles[selected].path.endsWith('.module.ts') &&
        filteredFiles[selected].compilationSuccessful
      )
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
        image: icons.clipboard,
      },
      {
        key: 'delete-file',
        name: 'Delete',
        description:
          'Delete "' +
          (filteredFiles[selected].name || filteredFiles[selected].path) +
          '". You won\'t be able to recover it.',
        image: icons.trash,
      },
      {
        key: 'rename',
        name: 'Rename',
        description:
          'Rename "' +
          (filteredFiles[selected].name || filteredFiles[selected].path) +
          '"',
        image: icons.pen,
      },
      {
        key: 'publish',
        name: 'Publish to a github gist',
        description:
          'Publish "' +
          (filteredFiles[selected].name || filteredFiles[selected].path) +
          '" to a github gist',
        image: icons.github,
      },
    ]).catch(() => {});
    if (opt === 'copy-bin-path') {
      const split = dir.split(/\/\\/g);
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
      try {
        const newname = await API.arg('New Name');
        API.rename(filteredFiles[selected].path, newname);
      } catch {}
    } else if (opt === 'publish') {
      let token = await API.getConfig('githubToken');
      if (!token) {
        API.open('https://github.com/settings/tokens/new');
        try {
          token = await API.arg(
            'Please input a legacy github token with the gist permission!',
            undefined,
            '<p>Grab one from <a href="https://github.com/settings/tokens/new">here</a>'
          );
          if (!token) return API.arg('Error: No token specified!');
          API.setConfig('githubToken', token);
        } catch {}
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
              [filteredFiles[selected].path.split(/\/\\/g).pop() ||
              'unknown.ts']: {
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
        $setCode(
          `<p>Gist URL: <a href="https://gist.github.com/${json.owner.login}/${json.id}">https://gist.github.com/${json.owner.login}/${json.id}</a><br />Installation URL: <a href="https://fishinghacks.github.io/qrunner/api/add-script.html?script=${json.id}">https://fishinghacks.github.io/qrunner/api/add-script.html?script=${json.id}</a><br /><br />Markdown Code:</p>` +
            `<pre># ${filteredFiles[selected].name}\n\n\n[Add ${filteredFiles[selected].name} to qRunner](https://fishinghacks.github.io/qrunner/api/add-script.html?script=${json.id})</pre>`
        );
      } catch {
        API.open('https://github.com/settings/tokens/new');
        try {
          token = await API.arg(
            'Please input a legacy github token with gist permission!',
            undefined,
            '<p>Grab one from <a href="https://github.com/settings/tokens/new">here</a>'
          );
          API.setConfig('githubToken', token);

          const json = await fetch('https://api.github.com/gists', {
            method: 'post',
            headers: {
              Authorization: 'Bearer ' + token,
              Accept: 'application/vnd.github+json',
            },
            body: JSON.stringify({
              public: true,
              files: {
                [filteredFiles[selected].path.split(/\/\\/g).pop() ||
                'unknown.ts']: {
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
        } catch {}
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
      API.getScripts().then(setFiles);
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
        <a
          onClick={
            dir === 'loading'
              ? undefined
              : (e) => {
                  API.open(dir).then(console.log, console.log);
                  e.preventDefault();
                }
          }
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
        Open Devtools
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => $reloadFiles()}>
        <kbd>F5</kbd>: Reload Scripts
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => $editScript()}>
        <kbd>F2</kbd>: Edit Script
      </p>
    );
    footer.push(
      <p style={{ cursor: 'pointer' }} onClick={() => $scriptActions()}>
        <kbd>F3</kbd>: Further Actions
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
                    onClick={
                      el.path.endsWith('.module.ts') || !el.compilationSuccessful
                        ? undefined
                        : () => runScript(el.path)
                    }
                    onMouseOver={() => (selected === i ? null : setSelected(i))}
                  >
                    <div
                      className="script-name"
                      style={
                        !el.compilationSuccessful
                          ? {
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '.25rem',
                            }
                          : undefined
                      }
                    >
                      {!el.compilationSuccessful && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16px"
                          height="16px"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="#dc2626"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path
                            stroke="none"
                            d="M0 0h24v24H0z"
                            fill="none"
                          ></path>
                          <path d="M10.24 3.957l-8.422 14.06a1.989 1.989 0 0 0 1.7 2.983h16.845a1.989 1.989 0 0 0 1.7 -2.983l-8.423 -14.06a1.989 1.989 0 0 0 -3.4 0z"></path>
                          <path d="M12 9v4"></path>
                          <path d="M12 17h.01"></path>
                        </svg>
                      )}
                      {el.name || el.path}
                    </div>
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
      {filteredFiles[selected] && (
        <div className="details">
          <ScrollArea>
            {!filteredFiles[selected]?.path.endsWith('.module.ts') &&
              filteredFiles[selected] && (
                <>
                  {!filteredFiles[selected].compilationSuccessful && (
                    <p className="d-error">Compilation failed</p>
                  )}
                  {filteredFiles[selected].name && (
                    <p className="d-name">
                      <span className="name">Name</span>:{' '}
                      <span className="value">
                        {filteredFiles[selected].name}
                      </span>
                    </p>
                  )}
                  {filteredFiles[selected].description && (
                    <p className="d-description">
                      <span className="name">Description</span>:{' '}
                      <span className="value">
                        {filteredFiles[selected].description}
                      </span>
                    </p>
                  )}
                  {filteredFiles[selected].author && (
                    <p className="d-author">
                      <span className="name">Author</span>:{' '}
                      <span className="value">
                        {filteredFiles[selected].githubName ? (
                          <Username
                            name={filteredFiles[selected].author}
                            link={
                              'https://github.com/' +
                              filteredFiles[selected].githubName
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
                  )}
                  {filteredFiles[selected].uses.filter((el) => !!el).length >
                    0 && (
                    <p className="d-uses">
                      <span className="name">Uses</span>:{' '}
                      <span className="value">
                        {filteredFiles[selected].uses
                          .filter((el) => !!el)
                          .join(', ')}
                      </span>
                    </p>
                  )}
                  {filteredFiles[selected].shortcut && (
                    <p className="d-shortcut">
                      <span className="name">Shortcut</span>:{' '}
                      <span className="value">
                        <KbdList
                          keys={
                            filteredFiles[selected].shortcut
                              ?.split('+')
                              .filter((el) => el.length > 0) || []
                          }
                        />
                      </span>
                    </p>
                  )}
                  {filteredFiles[selected].schedule &&
                    filteredFiles[selected].nextRun && (
                      <>
                        <p className="d-schedule">
                          <span className="name">Schedule</span>:{' '}
                          <span className="value">
                            {filteredFiles[selected].schedule}
                          </span>
                        </p>
                        <p className="d-nextrun">
                          <span className="name">Next Run</span>:{' '}
                          <span className="value">
                            {filteredFiles[selected].nextRun}
                          </span>
                        </p>
                      </>
                    )}
                </>
              )}
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
              <a
                href={
                  'file:///~/.qrunner/scripts/' + filteredFiles[selected].path
                }
                className="link"
                onDragStart={(ev) => {
                  ev.preventDefault();
                  API.startDrag(
                    '~/.qrunner/scripts/' + filteredFiles[selected].path
                  );
                }}
              >
                {filteredFiles[selected].path}
              </a>
            </div>
            <CodeHighlight code={scriptContents} />
          </ScrollArea>
        </div>
      )}
    </>
  );
}
