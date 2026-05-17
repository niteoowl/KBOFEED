'use client';

import type { PollData } from '@/lib/content';

interface PollBlockProps {
  poll: PollData;
  onVote?: (optionIndex: number) => void;
  hasVoted?: boolean;
}

export default function PollBlock({ poll, onVote, hasVoted }: PollBlockProps) {
  const totalVotes = poll.votes
    ? Object.values(poll.votes).reduce((a, b) => a + b, 0)
    : 0;
  const expired = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;

  return (
    <div className="poll-block" style={{ marginTop: 12, border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
      {poll.options.map((opt, i) => {
        const votes = poll.votes?.[String(i)] ?? 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return (
          <button
            key={i}
            type="button"
            disabled={expired || hasVoted}
            onClick={(e) => {
              e.stopPropagation();
              onVote?.(i);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderBottom: i < poll.options.length - 1 ? '1px solid var(--border-color)' : 'none',
              background: '#f7f9fa',
              textAlign: 'left',
              cursor: expired ? 'default' : 'pointer',
              position: 'relative',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {totalVotes > 0 && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: 'rgba(29, 155, 240, 0.15)',
                }}
              />
            )}
            <span style={{ position: 'relative' }}>{opt}</span>
            {totalVotes > 0 && (
              <span style={{ position: 'relative', float: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                {pct}%
              </span>
            )}
          </button>
        );
      })}
      {poll.endsAt && (
        <div style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
          {expired ? '투표 종료' : `${new Date(poll.endsAt).toLocaleString('ko-KR')}까지`}
        </div>
      )}
    </div>
  );
}
