export function slugify(name: string) {
    return Object.values(name)
        .map((el) =>
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-.'.includes(
                el
            )
                ? el
                : el === ' '
                ? '-'
                : ''
        )
        .join('')
        .replaceAll(/-+/g, '-');
}