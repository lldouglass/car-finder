'use client';

import { Search, FileText } from 'lucide-react';

interface UserMessageProps {
  inputType: 'vin' | 'listing';
  inputSummary: string;
}

export function UserMessage({ inputType, inputSummary }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
        <div className="flex items-center gap-2 text-sm opacity-80 mb-1">
          {inputType === 'vin' ? (
            <>
              <Search className="size-3.5" />
              <span>VIN Lookup</span>
            </>
          ) : (
            <>
              <FileText className="size-3.5" />
              <span>Listing Analysis</span>
            </>
          )}
        </div>
        <p className={`${inputType === 'vin' ? 'font-mono' : ''} break-all`}>
          {inputSummary}
        </p>
      </div>
    </div>
  );
}
