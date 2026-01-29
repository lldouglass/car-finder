'use client';

import { useState } from 'react';
import { useAnalysis, type ChatHistory } from '@/lib/analysis-context';
import { getHistoryDisplayName, formatRelativeTime } from '@/lib/history-store';
import { Button } from '@/components/ui/button';
import { Star, Trash2, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

interface HistoryItemProps {
  item: ChatHistory;
  isActive: boolean;
  onSelect?: () => void;
}

export function HistoryItem({ item, isActive, onSelect }: HistoryItemProps) {
  const { loadAnalysis, toggleStar, deleteAnalysis } = useAnalysis();
  const [showActions, setShowActions] = useState(false);

  const handleClick = () => {
    loadAnalysis(item.id);
    onSelect?.();
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnalysis(item.id);
  };

  const displayName = getHistoryDisplayName(item);
  const relativeTime = formatRelativeTime(item.timestamp);

  return (
    <div
      className={`
        group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors
        ${isActive ? 'bg-zinc-700' : 'hover:bg-zinc-800'}
      `}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      role="button"
      tabIndex={0}
      aria-label={`Load analysis for ${displayName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Verdict badge */}
      <VerdictBadge verdict={item.verdict} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-zinc-100">
          {displayName}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{relativeTime}</span>
          {item.starred && (
            <Star className="size-3 fill-yellow-500 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Action buttons - show on hover */}
      {(showActions || item.starred) && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 ${
              item.starred
                ? 'text-yellow-500 hover:text-yellow-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={handleStar}
            aria-label={item.starred ? 'Unstar' : 'Star'}
          >
            <Star className={`size-4 ${item.starred ? 'fill-current' : ''}`} />
          </Button>
          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-zinc-500 hover:text-red-400"
              onClick={handleDelete}
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: ChatHistory['verdict'] }) {
  if (!verdict) {
    return (
      <div className="flex-shrink-0 size-6 rounded-full bg-zinc-700 flex items-center justify-center">
        <HelpCircle className="size-3.5 text-zinc-400" />
      </div>
    );
  }

  const config = {
    BUY: {
      bg: 'bg-green-500/20',
      icon: <CheckCircle className="size-3.5 text-green-500" />,
    },
    MAYBE: {
      bg: 'bg-yellow-500/20',
      icon: <HelpCircle className="size-3.5 text-yellow-500" />,
    },
    PASS: {
      bg: 'bg-red-500/20',
      icon: <XCircle className="size-3.5 text-red-500" />,
    },
  };

  const c = config[verdict];

  return (
    <div
      className={`flex-shrink-0 size-6 rounded-full ${c.bg} flex items-center justify-center`}
    >
      {c.icon}
    </div>
  );
}
