'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { ChatArea } from './chat-area';
import { UpgradeModal } from '@/components/billing/upgrade-modal';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - drawer on mobile, fixed on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform bg-zinc-900 transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="History sidebar"
      >
        <Sidebar onClose={() => setSidebarOpen(false)} onUpgradeClick={() => setUpgradeModalOpen(true)} />
      </aside>

      {/* Main content area */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* Mobile header with menu button */}
        <header className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 p-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="font-semibold text-lg">Car Analyzer</h1>
        </header>

        {/* Chat area */}
        <ChatArea onUpgradeClick={() => setUpgradeModalOpen(true)} />
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}
