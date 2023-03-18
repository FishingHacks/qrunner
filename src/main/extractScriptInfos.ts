
export function getInfo(content: string) {
    const regexName = /\s*\*\s*@name\s*([^\n]+)\n/g;
    const regexDescription = /\s*\*\s*@description\s*([^\n]+)\n/g;
    const regexAuthor = /\s*\*\s*@author\s*([^\n]+)/g;
    const authorRegex = /\s*([^< ]+)\s*<([^<]+)>/g;
    const commentRegex = /\/\*\*([\s\S]*?)\*\//g;

    let name = '';
    let description = '';
    let author = '';
    let url = '';

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
    };
}