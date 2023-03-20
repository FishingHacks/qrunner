function generateRegex(name: string) {
    return new RegExp('\\s*\\*\\s*@' + name + ' *([^\\n]*)\\n', 'g')
}

export function getInfo(content: string) {
    const regexName = generateRegex('name');
    const regexDescription = generateRegex('description');
    const regexUses = generateRegex('uses');
    const regexAuthor = generateRegex('author');
    const authorRegex = /\s*([^< ]+)\s*<([^<]+)>/g;
    const commentRegex = /\/\*\*([\s\S]*?)\*\//g;

    let name = '';
    let description = '';
    let author = '';
    let url = '';
    let uses = '';

    const comments: string[] = [];

    for (const c of content.matchAll(commentRegex)) comments.push(c[1]);

    for (const c of comments) {
        if (!name) {
            const matched = regexName.exec(c);
            if (matched !== null) name = matched[1];
        }
        if (!description) {
            const matched = regexDescription.exec(c);
            if (matched !== null) description = matched[1];
        }
        if (!uses) {
            const matched = regexUses.exec(c);
            if (matched !== null) uses = matched[1];
        }
        if (!author && !url) {
            const matched = regexAuthor.exec(c);
            if (matched !== null) {
                const newMatched = authorRegex.exec(matched[1]);
                if (newMatched !== null) {
                    author = newMatched[1];
                    url = newMatched[2];
                } else author = matched[1];
            }
        }
    }
    
    return {
        name,
        description,
        author,
        url,
        uses
    };
}