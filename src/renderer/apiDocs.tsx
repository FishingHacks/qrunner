import { DefaultViewProps } from './App';
import Markdown from 'marked-react';
import CodeHighlight from './highlight';
import { useAsyncState } from './utils';
import { API } from './api';

export default function ApiDocs(props: DefaultViewProps) {
    props.config.disableBar = true;
    props.config.searchName = 'Search API Docs';

    const renderer = {
        blockquote(quote: string) {
            return (
                <blockquote
                    style={{
                        borderLeft: 'var(--color-secondary) 5px solid',
                        paddingLeft: '1em',
                        marginLeft: 0,
                    }}
                >
                    {quote}
                </blockquote>
            );
        },
        code(snippet: string, lang: string) {
            if (snippet.startsWith('///file:')) {
                const split = snippet.split('\n');
                const name = split.shift()?.substring(9);
                const newSnippet = split.join('\n');
                return (
                    <>
                        <div className='filename'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 48 48'
                                width='1rem'
                                height='1rem'
                            >
                                <path fill='#1976d2' d='M6 6h36v36H6z'></path>
                                <path
                                    fill='#fff'
                                    d='M27.49 22H14.227v3.264h4.757V40h3.769V25.264h4.737zM39.194 26.084s-1.787-1.192-3.807-1.192-2.747.96-2.747 1.986c0 2.648 7.381 2.383 7.381 7.712 0 8.209-11.254 4.568-11.254 4.568V35.22s2.152 1.622 4.733 1.622 2.483-1.688 2.483-1.92c0-2.449-7.315-2.449-7.315-7.878 0-7.381 10.658-4.469 10.658-4.469l-.132 3.509z'
                                ></path>
                            </svg>
                            {name}
                        </div>
                        <CodeHighlight code={newSnippet} lang={lang} />
                    </>
                );
            } else
                return (
                    <CodeHighlight code={snippet} lang={lang} hasFile={false} />
                );
        },
        heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6) {
            if (level === 1) return <h1>{text}</h1>;
            else if (level === 2) return <h2 id={text}>{text}</h2>;
            else if (level === 3) return <h3>{text}</h3>;
            else if (level === 4) return <h4>{text}</h4>;
            else if (level === 5) return <h5>{text}</h5>;
            else if (level === 6) return <h6>{text}</h6>;
            else return <p>{text}</p>;
        },
        codespan(snippet: string) {
            return (
                <code
                    style={{
                        color: 'var(--color-primary)',
                        padding: '2px 4px',
                        borderRadius: 3,
                        border: '1px solid var(--color-gray-inverted)',
                    }}
                >
                    {snippet}
                </code>
            );
        },
    };
    const { state: value } = useAsyncState(API.getAPIDocs);

    const entries = [
        ...(value === 'loading' ? '' : value).matchAll(/^## ([^\n])+/gm),
    ].map((el) => el[0].substring(3));

    return (
        <div className='page' style={{ width: 'calc(100% - 3rem)', marginBottom: 20 }}>
            <h3>API Documentation</h3>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 20,
                }}
            >
                {entries
                    .filter((el) =>
                        el.toLowerCase().includes(props.config.searchLowerCase)
                    )
                    .map((el) => (
                        <a
                            key={el.toLowerCase().replaceAll(' ', '-')}
                            href={'#' + el}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(el)?.scrollIntoView({
                                    block: 'start',
                                    behavior: 'smooth',
                                });
                            }}
                        >
                            {el}
                        </a>
                    ))}
            </div>
            <Markdown renderer={renderer} value={value} key={'a'} />
            <div
                className='apply-button scroll-to-top-button'
                onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    strokeWidth='3'
                    stroke='currentColor'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <path stroke='none' d='M0 0h24v24H0z' fill='none'></path>
                    <path d='M12 5l0 14'></path>
                    <path d='M18 11l-6 -6'></path>
                    <path d='M6 11l6 -6'></path>
                </svg>
                Scroll to the Top
            </div>
        </div>
    );
}
