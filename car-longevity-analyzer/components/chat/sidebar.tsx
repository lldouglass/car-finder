'use client';

import { useState } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { groupHistoryByDate } from '@/lib/history-store';
import { HistoryItem } from './history-item';
import { UserHeader } from '@/components/auth/user-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { PlusCircle, Search, X, Car, BookOpen, FileText, DollarSign, Table } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  onUpgradeClick?: () => void;
}

export function Sidebar({ onClose, onUpgradeClick }: SidebarProps) {
  const { history, startNewAnalysis, currentId } = useAnalysis();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter history by search query
  const filteredHistory = searchQuery
    ? history.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        const vehicleName = item.vehicle
          ? `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`.toLowerCase()
          : '';
        return (
          vehicleName.includes(searchLower) ||
          item.inputSummary.toLowerCase().includes(searchLower)
        );
      })
    : history;

  // Group history by date
  const grouped = groupHistoryByDate(filteredHistory);

  const handleNewAnalysis = () => {
    startNewAnalysis();
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Car className="size-5 text-primary" />
          <span className="font-semibold">Car Analyzer</span>
        </div>
        {/* Close button - mobile only */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-zinc-400 hover:text-zinc-100"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      {/* New Analysis Button */}
      <div className="p-3">
        <Button
          onClick={handleNewAnalysis}
          className="w-full justify-start gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
          variant="ghost"
        >
          <PlusCircle className="size-4" />
          New Analysis
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2">
        {history.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-zinc-500">
            <p>No analysis history yet.</p>
            <p className="mt-1">Start by entering a VIN or pasting a listing.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-zinc-500">
            <p>No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {/* Starred items */}
            {grouped.starred.length > 0 && (
              <HistoryGroup
                title="Starred"
                items={grouped.starred}
                currentId={currentId}
                onClose={onClose}
              />
            )}

            {/* Today */}
            {grouped.today.length > 0 && (
              <HistoryGroup
                title="Today"
                items={grouped.today}
                currentId={currentId}
                onClose={onClose}
              />
            )}

            {/* Yesterday */}
            {grouped.yesterday.length > 0 && (
              <HistoryGroup
                title="Yesterday"
                items={grouped.yesterday}
                currentId={currentId}
                onClose={onClose}
              />
            )}

            {/* Older */}
            {grouped.older.length > 0 && (
              <HistoryGroup
                title="Older"
                items={grouped.older}
                currentId={currentId}
                onClose={onClose}
              />
            )}
          </>
        )}
      </div>

      {/* Footer with User Info */}
      <div className="border-t border-zinc-800 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/browse"
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <DollarSign className="size-3.5" />
            Browse by Budget
          </Link>
          <Link
            href="/explore"
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Table className="size-3.5" />
            Explore All Cars
          </Link>
          <Link
            href="/blog"
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <BookOpen className="size-3.5" />
            Blog
          </Link>
          <Link
            href="/guide"
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <FileText className="size-3.5" />
            Guide
          </Link>
        </div>
        <UserHeader onUpgradeClick={onUpgradeClick} />
        <p className="text-xs text-zinc-500 text-center">
          Data from NHTSA & AI analysis
        </p>
      </div>
    </div>
  );
}

interface HistoryGroupProps {
  title: string;
  items: ReturnType<typeof groupHistoryByDate>['starred'];
  currentId: string | null;
  onClose?: () => void;
}

function HistoryGroup({ title, items, currentId, onClose }: HistoryGroupProps) {
  return (
    <div className="mb-4">
      <h3 className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            isActive={item.id === currentId}
            onSelect={onClose}
          />
        ))}
      </div>
    </div>
  );
}
