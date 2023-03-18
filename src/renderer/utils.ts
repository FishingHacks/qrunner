import { useEffect, useState } from 'react';

type LoadingState<T> = T | 'loading';
type StateSetter<T> = (value: T | ((value: T) => T)) => void;

let remaining = 0;
let cbs: (() => any)[] = [];

function handleResolved() {
    remaining--;
    if (remaining <= 0) {
        for (const c of cbs) c();
        remaining = 0;
        cbs = [];
    }
}

export function useAsyncState<T, K extends any[]>(
    getter: (...args: K) => Promise<T> | T,
    ...args: K
): {
    state: LoadingState<T>;
    setState: StateSetter<LoadingState<T>>;
    reload: () => void;
} {
    const [state, setState] = useState<LoadingState<T>>('loading');

    useEffect(() => {
        remaining++;
        const value = getter(...args);
        if (typeof value === 'object' && value && value instanceof Promise)
            value.then((v) => {
                cbs.push(() => setState(v));
                handleResolved();
            });
        else {
            cbs.push(() => setState(value as T));
            handleResolved();
        }
    }, args);

    return {
        state,
        setState,
        reload() {
            const value = getter(...args);
            if (typeof value === 'object' && value && value instanceof Promise)
                value.then(setState);
            else setState(value as T);
        },
    };
}

export function srgbaToHex(r: number, g: number, b: number, a: number) {
    let color = '#';
    function add(s: string) {
        color += s.substring(s.length - 2, s.length);
    }
    add('00' + r.toString(16));
    add('00' + g.toString(16));
    add('00' + b.toString(16));
    if (a !== 0) add('00' + (255 - a).toString(16));

    return color;
}
