'use client';

import { useRouter } from 'next/navigation';
import { splitContentParts } from '@/lib/content';

export default function FormattedContent({ text }: { text: string }) {
  const router = useRouter();
  return (
    <>
      {splitContentParts(text).map((part, i) => {
        if (part.type === 'hashtag') {
          return (
            <span
              key={i}
              style={{ color: 'var(--primary-color)', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/search?q=${encodeURIComponent(part.value)}`);
              }}
            >
              {part.value.startsWith('#') ? part.value : `#${part.value}`}
            </span>
          );
        }
        if (part.type === 'mention') {
          return (
            <span
              key={i}
              style={{ color: 'var(--primary-color)', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/@${part.value}`);
              }}
            >
              @{part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}
