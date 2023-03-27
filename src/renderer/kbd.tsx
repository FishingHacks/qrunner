import { KeySymbols } from './constants';

export function Kbd(props: { children: string }) {
    const key = props.children.toLowerCase();

    if (key === 'cmd/ctrl' || key === 'ctrl/cmd') {
        if (navigator.userAgent.includes('Mac'))
            return <kbd>{KeySymbols.command}</kbd>;
        else return <kbd>{KeySymbols.control}</kbd>;
    }
    if (key === 'alt' || key === 'alt/opt' || key === 'opt/alt' || key === 'alt/option' || key === 'option/alt') {
        if (navigator.userAgent.includes('Mac'))
            return <kbd>{KeySymbols.option}</kbd>;
        else return <kbd>{KeySymbols.alt}</kbd>;
    }

    return (
        <kbd>
            {KeySymbols[key as keyof typeof KeySymbols] !== undefined
                ? KeySymbols[key as keyof typeof KeySymbols]
                : key[0].toUpperCase() + key.substring(1)}
        </kbd>
    );
}

export function KbdList({
    keys,
    splitter = ' + '
}: {
    keys: string[];
    splitter?: string;
}) {
    if (keys.length < 1) return <></>;

    const elements: JSX.Element[] = [<Kbd key={0} children={keys[0]} />];
    for (let i = 1; i < keys.length; i++) {
        elements.push(<span key={i * 2}>{splitter}</span>);
        elements.push(<Kbd key={i * 2 + 1} children={keys[i]} />);
    }

    return <>{elements}</>;
}