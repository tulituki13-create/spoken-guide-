function splitTopicsByRules(str: string): string[] {
  let result: string[] = [];
  let current = '';
  let inParen = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') inParen++;
    if (char === ')') inParen = Math.max(0, inParen - 1);

    if (inParen === 0 && (char === ',' || char === ';')) {
      if (current.trim()) result.push(current.trim());
      current = '';
      continue;
    }

    if (inParen === 0 && str.substring(i, i + 5).toLowerCase() === ' and ') {
      if (current.trim()) result.push(current.trim());
      current = '';
      i += 4;
      continue;
    }

    current += char;
  }
  if (current.trim()) result.push(current.trim());

  return result.map(s => s.replace(/\.$/, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

console.log(splitTopicsByRules("Basic nouns, Subject pronouns (I, You), Verb 'to be' (am, is, are)"));
