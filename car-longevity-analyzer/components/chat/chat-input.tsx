'use client';

import { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';

// VIN pattern: 17 alphanumeric characters, no I, O, or Q
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function ChatInput() {
  const { submitAnalysis, isLoading } = useAnalysis();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState('');
  const [mileage, setMileage] = useState('');
  const [price, setPrice] = useState('');
  const [sellerType, setSellerType] = useState('');

  // Detect if input looks like a VIN
  const trimmedInput = input.trim().replace(/\s/g, '');
  const isVin = VIN_PATTERN.test(trimmedInput);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    // Validate required fields for VIN
    if (isVin && (!mileage || !price)) {
      return;
    }

    try {
      await submitAnalysis(
        isVin ? 'vin' : 'listing',
        isVin ? trimmedInput : input.trim(),
        mileage ? parseInt(mileage, 10) : undefined,
        price ? parseInt(price, 10) : undefined,
        sellerType || undefined
      );

      // Clear form on success
      setInput('');
      setMileage('');
      setPrice('');
      setSellerType('');
    } catch {
      // Error is handled by context
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit =
    input.trim() &&
    !isLoading &&
    (!isVin || (mileage && price));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isVin ? 'VIN detected! Enter mileage and price below.' : 'Enter a VIN or paste a listing...'}
          disabled={isLoading}
          className="min-h-[52px] max-h-[200px] pr-12 resize-none"
          aria-label="Vehicle input"
        />

        {/* Submit button */}
        <Button
          type="submit"
          size="icon"
          disabled={!canSubmit}
          className="absolute right-2 bottom-2"
          aria-label="Analyze"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>

        {/* VIN detected badge */}
        {isVin && (
          <Badge
            className="absolute left-2 top-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            VIN detected
          </Badge>
        )}
      </div>

      {/* Additional fields */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[120px]">
          <Input
            type="number"
            placeholder={isVin ? 'Mileage *' : 'Mileage (optional)'}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            disabled={isLoading}
            min={0}
            max={999999}
            aria-label="Current mileage"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Input
            type="number"
            placeholder={isVin ? 'Price ($) *' : 'Price (optional)'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isLoading}
            min={0}
            max={9999999}
            aria-label="Asking price"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <select
            value={sellerType}
            onChange={(e) => setSellerType(e.target.value)}
            disabled={isLoading}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            aria-label="Seller type"
          >
            <option value="">Seller type (auto)</option>
            <option value="cpo">CPO</option>
            <option value="franchise_same">Franchise Dealer (Same)</option>
            <option value="franchise_other">Franchise Dealer (Other)</option>
            <option value="independent_lot">Independent Dealer</option>
            <option value="private">Private Seller</option>
            <option value="auction">Auction</option>
          </select>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        {isVin
          ? 'Mileage and price are required for VIN analysis.'
          : 'Enter a 17-character VIN for detailed lookup, or paste a full listing for AI analysis.'}
      </p>
    </form>
  );
}
