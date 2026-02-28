"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  Shield,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  exploreCars,
  getUniqueMakes,
  getModelsForMake,
  type ExploreCar,
} from "@/lib/explore-data";

type SortField =
  | "vehicle"
  | "year"
  | "reliabilityScore"
  | "nhtsaComplaints"
  | "topIssueCategory"
  | "safetyRating";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBgClass(score: number): string {
  if (score >= 8)
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200";
  if (score >= 5)
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200";
  return "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200";
}

function safetyStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function recommendationLabel(score: number): string {
  if (score >= 8) return "Recommended";
  if (score >= 5) return "Mixed signals";
  return "Higher risk";
}

export function ExploreClient() {
  const makes = useMemo(() => getUniqueMakes(), []);

  const [filterMake, setFilterMake] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterYearMin, setFilterYearMin] = useState("");
  const [filterYearMax, setFilterYearMax] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("reliabilityScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const carId = (car: ExploreCar) => `${car.make}-${car.model}-${car.year}`;

  const toggleCompare = useCallback((car: ExploreCar) => {
    const id = carId(car);
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const modelsForMake = useMemo(
    () => (filterMake ? getModelsForMake(filterMake) : []),
    [filterMake]
  );

  const filtered = useMemo(() => {
    let cars = [...exploreCars];

    if (filterMake) cars = cars.filter((c) => c.make === filterMake);
    if (filterModel) cars = cars.filter((c) => c.model === filterModel);
    if (filterYearMin) cars = cars.filter((c) => c.year >= Number(filterYearMin));
    if (filterYearMax) cars = cars.filter((c) => c.year <= Number(filterYearMax));
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      cars = cars.filter(
        (c) =>
          c.make.toLowerCase().includes(lower) ||
          c.model.toLowerCase().includes(lower) ||
          String(c.year).includes(lower)
      );
    }

    cars.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "vehicle":
          cmp = `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
          break;
        case "year":
          cmp = a.year - b.year;
          break;
        case "reliabilityScore":
          cmp = a.reliabilityScore - b.reliabilityScore;
          break;
        case "nhtsaComplaints":
          cmp = a.nhtsaComplaints - b.nhtsaComplaints;
          break;
        case "topIssueCategory":
          cmp = a.topIssueCategory.localeCompare(b.topIssueCategory);
          break;
        case "safetyRating":
          cmp = a.safetyRating - b.safetyRating;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return cars;
  }, [filterMake, filterModel, filterYearMin, filterYearMax, searchTerm, sortField, sortDir]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "vehicle" || field === "topIssueCategory" ? "asc" : "desc");
    }
    setPage(0);
  };

  const comparedCars = useMemo(
    () => exploreCars.filter((c) => compareIds.has(carId(c))),
    [compareIds]
  );

  const clearFilters = () => {
    setFilterMake("");
    setFilterModel("");
    setFilterYearMin("");
    setFilterYearMax("");
    setSearchTerm("");
    setPage(0);
  };

  const hasFilters =
    filterMake || filterModel || filterYearMin || filterYearMax || searchTerm;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Analyzer
      </Link>

      <section className="mb-8 rounded-2xl border bg-card/70 p-5 shadow-sm md:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            Live screener layout
          </Badge>
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            NHTSA complaint intelligence
          </Badge>
          <span className="text-muted-foreground">Sortable by reliability, complaints, safety, and issue type</span>
        </div>
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
            Explore the full dataset
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Every Car. Every Year. Professional Reliability Screener.
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Search, filter, sort, and compare {exploreCars.length}+ vehicles using
            complaint frequency, reliability scoring, and safety context.
          </p>
        </div>
      </section>

      <section className="sticky top-2 z-30 mb-6" aria-label="Filters">
        <Card className="border shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <CardContent className="p-3 md:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Make, model, or year"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(0);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Make
                </label>
                <select
                  value={filterMake}
                  onChange={(e) => {
                    setFilterMake(e.target.value);
                    setFilterModel("");
                    setPage(0);
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Makes</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Model
                </label>
                <select
                  value={filterModel}
                  onChange={(e) => {
                    setFilterModel(e.target.value);
                    setPage(0);
                  }}
                  disabled={!filterMake}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">All Models</option>
                  {modelsForMake.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Year range
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={2000}
                    max={2025}
                    value={filterYearMin}
                    onChange={(e) => {
                      setFilterYearMin(e.target.value);
                      setPage(0);
                    }}
                    className="h-10 text-center"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min={2000}
                    max={2025}
                    value={filterYearMax}
                    onChange={(e) => {
                      setFilterYearMax(e.target.value);
                      setPage(0);
                    }}
                    className="h-10 text-center"
                  />
                </div>
              </div>

              <div className="md:col-span-1 md:justify-self-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className={`w-full md:w-auto ${hasFilters ? "" : "invisible"}`}
                >
                  <X className="mr-1 size-4" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {showCompare && comparedCars.length >= 2 && (
        <section className="mb-8" aria-label="Car comparison">
          <Card className="overflow-hidden border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-primary/5">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GitCompareArrows className="size-5 text-primary" />
                  Side-by-Side Comparison
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompare(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-5">
              <div
                className={`grid gap-4 ${
                  comparedCars.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
                }`}
              >
                {comparedCars.map((car) => (
                  <CompareCard key={carId(car)} car={car} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} found
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Select up to 3 vehicles for side-by-side compare
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 top-0 z-30 w-10 bg-muted/95 p-3 text-left backdrop-blur">
                  <span className="sr-only">Compare</span>
                </th>
                <ThSortable
                  field="vehicle"
                  label="Vehicle"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="sticky left-10 z-20"
                />
                <ThSortable
                  field="year"
                  label="Year"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-20"
                />
                <ThSortable
                  field="reliabilityScore"
                  label="Reliability"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-32"
                />
                <ThSortable
                  field="nhtsaComplaints"
                  label="NHTSA Complaints"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-36 text-right"
                />
                <ThSortable
                  field="topIssueCategory"
                  label="Top Issue"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="hidden md:table-cell"
                />
                <ThSortable
                  field="safetyRating"
                  label="Safety"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="hidden w-24 lg:table-cell"
                />
                <th className="sticky top-0 z-20 w-24 bg-muted/95 p-3 text-left backdrop-blur">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((car) => {
                const id = carId(car);
                const isChecked = compareIds.has(id);
                const searchQuery = `${car.year} ${car.make} ${car.model}`;

                return (
                  <tr
                    key={id}
                    className={`border-b transition-colors hover:bg-muted/40 ${
                      isChecked ? "bg-primary/[0.08] hover:bg-primary/[0.12]" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit p-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!isChecked && compareIds.size >= 3}
                        onChange={() => toggleCompare(car)}
                        className="size-4 rounded border-input accent-primary"
                        aria-label={`Compare ${car.year} ${car.make} ${car.model}`}
                      />
                    </td>
                    <td className="sticky left-10 z-10 bg-inherit p-3">
                      <div className="font-semibold whitespace-nowrap">
                        {car.make} {car.model}
                      </div>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {car.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{car.year}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${scoreColor(
                          car.reliabilityScore
                        )}`}
                      >
                        <Shield className="size-3.5" />
                        {car.reliabilityScore}/10
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {car.nhtsaComplaints.toLocaleString()}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {car.topIssueCategory === "None" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="size-3" />
                          {car.topIssueCategory}
                        </span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-xs tracking-wider text-amber-500">
                        {safetyStars(car.safetyRating)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/?q=${encodeURIComponent(searchQuery)}`}
                        className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                      >
                        Analyze →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {compareIds.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4">
          <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-background/95 p-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <GitCompareArrows className="size-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">
                {compareIds.size} car{compareIds.size !== 1 ? "s" : ""} selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {comparedCars.map((car) => (
                <Badge key={carId(car)} variant="secondary" className="rounded-full">
                  {car.year} {car.make} {car.model}
                </Badge>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareIds(new Set());
                  setShowCompare(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                disabled={compareIds.size < 2}
                onClick={() => setShowCompare(true)}
              >
                Compare
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-10 border-t py-10 text-center">
        <h2 className="mb-2 text-xl font-semibold">Know your budget? Browse by price.</h2>
        <p className="mb-4 text-muted-foreground">
          See the most reliable cars ranked at every budget tier.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/browse">Browse by Budget</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Analyze a Specific Car</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ThSortable({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className = "",
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const active = sortField === field;
  return (
    <th
      className={`sticky top-0 z-20 bg-muted/95 p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur ${className}`}
    >
      <button
        className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-foreground"
        onClick={() => onSort(field)}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-50" />
        )}
      </button>
    </th>
  );
}

function CompareCard({ car }: { car: ExploreCar }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight">
            {car.year} {car.make} {car.model}
          </h3>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">
            {car.type}
          </Badge>
        </div>
        <div className={`rounded-md px-2.5 py-1 text-xs font-semibold ${scoreBgClass(car.reliabilityScore)}`}>
          {recommendationLabel(car.reliabilityScore)}
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reliability</span>
          <span className={`font-bold ${scoreColor(car.reliabilityScore)}`}>
            {car.reliabilityScore}/10
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">NHTSA Complaints</span>
          <span className="font-medium tabular-nums">
            {car.nhtsaComplaints.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Top Issue</span>
          <span
            className={
              car.topIssueCategory === "None"
                ? "text-muted-foreground"
                : "text-amber-700 dark:text-amber-400"
            }
          >
            {car.topIssueCategory === "None" ? "None" : car.topIssueCategory}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Safety Rating</span>
          <span className="text-sm text-amber-500">{safetyStars(car.safetyRating)}</span>
        </div>
      </div>

      {car.reliabilityScore <= 4 && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
          Higher complaint risk in this year/model combination.
        </div>
      )}

      {car.reliabilityScore >= 8 && (
        <div className="mt-3 flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          <Star className="size-3" />
          Top reliability tier based on complaint and score profile.
        </div>
      )}
    </div>
  );
}
