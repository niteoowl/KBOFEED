export interface PollData {
  type: 'poll';
  options: string[];
  endsAt?: string;
  votes?: Record<string, number>;
  votedUsers?: Record<string, number>;
}

const POLL_REGEX = /\[POLL\]([\s\S]*?)\[\/POLL\]/;

export function parsePoll(content: string): { text: string; poll: PollData | null } {
  const match = content.match(POLL_REGEX);
  if (!match) return { text: content, poll: null };
  try {
    const poll = JSON.parse(match[1]) as PollData;
    const text = content.replace(POLL_REGEX, '').trim();
    return { text, poll };
  } catch {
    return { text: content.replace(POLL_REGEX, '').trim(), poll: null };
  }
}

export function buildPollTag(poll: { options: string[]; endsAt?: string }): string {
  return `\n\n[POLL]${JSON.stringify({ type: 'poll', options: poll.options, endsAt: poll.endsAt })}[/POLL]`;
}

export function extractMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_]{2,20})/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export function splitContentParts(text: string): Array<{ type: 'text' | 'hashtag' | 'mention'; value: string }> {
  const parts: Array<{ type: 'text' | 'hashtag' | 'mention'; value: string }> = [];
  const regex = /(#[^\s#]+)|@([a-zA-Z0-9_]{2,20})/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    }
    if (m[1]) parts.push({ type: 'hashtag', value: m[1] });
    else if (m[2]) parts.push({ type: 'mention', value: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: 'text', value: text }];
}

export function extractGifUrl(file: unknown): string {
  if (typeof file === 'string' && file.startsWith('http')) return file;
  if (!file || typeof file !== 'object') return '';
  const f = file as Record<string, unknown>;
  for (const size of ['md', 'sm', 'xs', 'lg']) {
    const tier = f[size];
    if (tier && typeof tier === 'object') {
      const t = tier as Record<string, string>;
      for (const fmt of ['webp', 'gif', 'mp4']) {
        if (typeof t[fmt] === 'string' && t[fmt].startsWith('http')) return t[fmt];
      }
    }
  }
  return '';
}
