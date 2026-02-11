'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronDown } from 'lucide-react';

interface VehicleSearchInputProps {
  large?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1981 + 2 }, (_, i) => currentYear + 1 - i);

export function VehicleSearchInput({ large = false }: VehicleSearchInputProps) {
  const { submitAnalysis, isLoading } = useAnalysis();

  const [year, setYear] = useState<number | ''>('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Fetch makes when year changes
  useEffect(() => {
    if (!year) {
      setMakes([]);
      return;
    }

    let cancelled = false;
    setMakesLoading(true);

    fetch(`/api/vehicles/makes?year=${year}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) {
          setMakes(data.makes || []);
        }
      })
      .catch(() => {
        if (!cancelled) setMakes([]);
      })
      .finally(() => {
        if (!cancelled) setMakesLoading(false);
      });

    return () => { cancelled = true; };
  }, [year]);

  // Fetch models when make changes
  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }

    let cancelled = false;
    setModelsLoading(true);

    fetch(`/api/vehicles/models?year=${year}&make=${encodeURIComponent(make)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) {
          setModels(data.models || []);
        }
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });

    return () => { cancelled = true; };
  }, [year, make]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (makeRef.current && !makeRef.current.contains(e.target as Node)) {
        setShowMakeDropdown(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredMakes = makes.filter(m =>
    m.toLowerCase().includes(makeFilter.toLowerCase())
  );

  const filteredModels = models.filter(m =>
    m.toLowerCase().includes(modelFilter.toLowerCase())
  );

  const handleSelectMake = useCallback((selectedMake: string) => {
    setMake(selectedMake);
    setMakeFilter(selectedMake);
    setShowMakeDropdown(false);
    setModel('');
    setModelFilter('');
  }, []);

  const handleSelectModel = useCallback((selectedModel: string) => {
    setModel(selectedModel);
    setModelFilter(selectedModel);
    setShowModelDropdown(false);
  }, []);

  const canSubmit = year && make && model && !isLoading;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;

    try {
      await submitAnalysis(
        'vehicle',
        JSON.stringify({ year, make, model }),
      );
      setYear('');
      setMake('');
      setModel('');
      setMakeFilter('');
      setModelFilter('');
    } catch {
      // Error handled by context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className={`flex flex-wrap gap-3 ${large ? '' : ''}`}>
        {/* Year select */}
        <div className="relative flex-1 min-w-[100px] max-w-[130px]">
          <select
            value={year}
            onChange={(e) => {
              const val = e.target.value;
              setYear(val ? parseInt(val, 10) : '');
              setMake('');
              setMakeFilter('');
              setModel('');
              setModelFilter('');
            }}
            disabled={isLoading}
            className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 appearance-none"
            aria-label="Vehicle year"
          >
            <option value="">Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Make autocomplete */}
        <div className="relative flex-1 min-w-[140px]" ref={makeRef}>
          <Input
            type="text"
            placeholder={makesLoading ? 'Loading...' : year ? 'Make' : 'Select year first'}
            value={makeFilter}
            onChange={(e) => {
              setMakeFilter(e.target.value);
              setMake('');
              setModel('');
              setModelFilter('');
              setShowMakeDropdown(true);
            }}
            onFocus={() => {
              if (year && makes.length > 0) setShowMakeDropdown(true);
            }}
            disabled={isLoading || !year}
            aria-label="Vehicle make"
          />
          {showMakeDropdown && filteredMakes.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border border-input bg-popover shadow-md">
              {filteredMakes.slice(0, 50).map(m => (
                <button
                  key={m}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelectMake(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model autocomplete */}
        <div className="relative flex-1 min-w-[140px]" ref={modelRef}>
          <Input
            type="text"
            placeholder={modelsLoading ? 'Loading...' : make ? 'Model' : 'Select make first'}
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setModel('');
              setShowModelDropdown(true);
            }}
            onFocus={() => {
              if (make && models.length > 0) setShowModelDropdown(true);
            }}
            disabled={isLoading || !make}
            aria-label="Vehicle model"
          />
          {showModelDropdown && filteredModels.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border border-input bg-popover shadow-md">
              {filteredModels.slice(0, 50).map(m => (
                <button
                  key={m}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelectModel(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className={large ? 'h-10 px-6' : 'h-10'}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Search className="size-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Free reliability report with recalls, safety ratings, and known issues.
      </p>
    </form>
  );
}
