import hljs from 'highlight.js';
import './light.css';
import './dark.css';

function isCssValueLight(value: string) {
    if (!value.startsWith('#')) return false;
    value = value.substring(1);
    if (value.length < 6)
        value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];

    const [r, g, b] = [
        parseInt(value.substring(0, 2), 16),
        parseInt(value.substring(2, 4), 16),
        parseInt(value.substring(4, 6), 16),
    ];

    return r > 127 && g > 127 && b > 127;
}

export default function CodeHighlight({
    code,
    lang = 'typescript',
    hasFile = true,
}: {
    code: string;
    lang?: string;
    hasFile?: boolean;
}) {
    return (
        <pre style={{ marginTop: 0, maxWidth: '100%' }}>
            <code
                className={
                    'hljs ' +
                    (isCssValueLight(
                        (document.children[0] as HTMLHtmlElement).style
                            .getPropertyValue('--color-text')
                            .trim()
                    )
                        ? 'light'
                        : 'dark')
                }
                style={{
                    borderRadius: 3,
                    borderTopLeftRadius: hasFile ? 0 : 3,
                    border: '1px solid var(--color-gray)',
                    backgroundColor: 'var(--color-background)',
                }}
                dangerouslySetInnerHTML={{
                    __html: hljs.highlight(code, {
                        language: lang,
                    }).value,
                }}
            ></code>
        </pre>
    );
}
