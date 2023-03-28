function generateRegex(name: string) {
  return new RegExp('\\s*\\*\\s*@' + name + ' *([^\\n]*)\\n', 'g');
}

export interface ScriptInfo {
  name: string;
  description: string;
  author: string;
  url: string;
  uses: string;
  shortcut: string;
  schedule: string;
  hide: boolean;
}

export function getInfo(content: string): ScriptInfo {
  const regexName = generateRegex('name');
  const regexDescription = generateRegex('description');
  const regexUses = generateRegex('uses');
  const regexAuthor = generateRegex('author');
  const regexShortcut = generateRegex('shortcut');
  const regexSchedule = generateRegex('schedule');
  const regexHide = /\s*\*\s*@hide/;
  const authorRegex = /\s*([^< ]+)\s*<([^<]+)>/g;
  const commentRegex = /\/\*\*([\s\S]*?)\*\//g;

  let name = '';
  let description = '';
  let author = '';
  let url = '';
  let uses = '';
  let shortcut = '';
  let schedule = '';
  let hide = false;

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
    if (!uses) {
      const matched = regexUses.exec(c);
      if (matched !== null) uses = matched[1];
    }
    if (!shortcut) {
      const matched = regexShortcut.exec(c);
      if (matched !== null) shortcut = matched[1];
    }
    if (!schedule) {
      const matched = regexSchedule.exec(c);
      if (matched !== null) schedule = matched[1];
    }
    if (!hide) {
      const matched = regexHide.exec(c);
      if (matched !== null) hide = true;
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
    uses,
    shortcut,
    schedule,
    hide,
  };
}
