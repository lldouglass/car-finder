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
  if (score >= 8) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200";
  if (score >= 5) return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200";
  return "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200";
}

function safetyStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
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

  // Compare state
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const carId = (car: ExploreCar) =>
    `${car.make}-${car.model}-${car.year}`;

  const toggleCompare = useCallback(
    (car: ExploreCar) => {
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
    },
    []
  );

  const modelsForMake = useMemo(
    () => (filterMake ? getModelsForMake(filterMake) : []),
    [filterMake]
  );

  const filtered = useMemo(() => {
    let cars = [...exploreCars];

    if (filterMake) cars = cars.filter((c) => c.make === filterMake);
    if (filterModel) cars = cars.filter((c) => c.model === filterModel);
    if (filterYearMin)
      cars = cars.filter((c) => c.year >= Number(filterYearMin));
    if (filterYearMax)
      cars = cars.filter((c) => c.year <= Number(filterYearMax));
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      cars = cars.filter(
        (c) =>
          c.make.toLowerCase().includes(lower) ||
          c.model.toLowerCase().includes(lower) ||
          String(c.year).includes(lower)
      );
    }

    // Sort
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="size-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Analyzer
      </Link>

      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Every Car. Every Year. Real NHTSA Complaint Data.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Search, filter, sort, and compare {exploreCars.length}+ vehicles with
          real reliability data.
        </p>
      </section>

      {/* Filter bar */}
      <section className="mb-6" aria-label="Filters">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search make, model, year..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(0);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Make */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Make
                </label>
                <select
                  value={filterMake}
                  onChange={(e) => {
                    setFilterMake(e.target.value);
                    setFilterModel("");
                    setPage(0);
                  }}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Makes</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Model
                </label>
                <select
                  value={filterModel}
                  onChange={(e) => {
                    setFilterModel(e.target.value);
                    setPage(0);
                  }}
                  disabled={!filterMake}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">All Models</option>
                  {modelsForMake.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Year Range
                </label>
                <div className="flex items-center gap-1">
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
                    className="text-center"
                  />
                  <span className="text-muted-foreground text-xs">–</span>
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
                    className="text-center"
                  />
                </div>
              </div>

              {/* Clear filters */}
              <div className="flex items-end">
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="size-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Compare bar */}
      {compareIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border bg-primary/5 border-primary/20 p-3">
          <GitCompareArrows className="size-5 text-primary" />
          <span className="text-sm font-medium">
            {compareIds.size} car{compareIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex-1" />
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
      )}

      {/* Compare view */}
      {showCompare && comparedCars.length >= 2 && (
        <section className="mb-8" aria-label="Car comparison">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitCompareArrows className="size-5" />
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
            <CardContent>
              <div className={`grid gap-4 ${comparedCars.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                {comparedCars.map((car) => (
                  <CompareCard key={carId(car)} car={car} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Results count + info */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} found
          {compareIds.size > 0 && (
            <span className="ml-2">
              · Select up to 3 to compare
            </span>
          )}
        </p>
        {!compareIds.size && (
          <p className="text-xs text-muted-foreground hidden sm:block">
            Click checkboxes to compare cars side-by-side
          </p>
        )}
      </div>

      {/* Data table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left w-10">
                <span className="sr-only">Compare</span>
              </th>
              <ThSortable
                field="vehicle"
                label="Vehicle"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
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
                className="w-28"
              />
              <ThSortable
                field="nhtsaComplaints"
                label="NHTSA Complaints"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="w-36"
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
                className="w-24 hidden lg:table-cell"
              />
              <th className="p-3 text-left w-20">
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
                  className={`border-b transition-colors hover:bg-muted/30 ${
                    isChecked ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isChecked && compareIds.size >= 3}
                      onChange={() => toggleCompare(car)}
                      className="rounded"
                      aria-label={`Compare ${car.year} ${car.make} ${car.model}`}
                    />
                  </td>
                  <td className="p-3 font-medium whitespace-nowrap">
                    {car.make} {car.model}
                  </td>
                  <td className="p-3">{car.year}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${scoreColor(
                        car.reliabilityScore
                      )}`}
                    >
                      <Shield className="size-3.5" />
                      {car.reliabilityScore}/10
                    </span>
                  </td>
                  <td className="p-3">
                    {car.nhtsaComplaints.toLocaleString()}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {car.topIssueCategory === "None" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="size-3" />
                        {car.topIssueCategory}
                      </span>
                    )}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <span className="text-amber-500 text-xs tracking-wider">
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

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4">
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

      {/* Bottom CTA */}
      <section className="text-center py-10 mt-8 border-t">
        <h2 className="text-xl font-semibold mb-2">
          Know your budget? Browse by price.
        </h2>
        <p className="text-muted-foreground mb-4">
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

/* Sortable table header */
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
    <th className={`p-3 text-left ${className}`}>
      <button
        className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
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
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

/* Compare card */
function CompareCard({ car }: { car: ExploreCar }) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-lg">
          {car.year} {car.make} {car.model}
        </h3>
        <Badge variant="secondary" className="text-xs capitalize mt-1">
          {car.type}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Reliability</span>
          <span className={`font-bold ${scoreColor(car.reliabilityScore)}`}>
            {car.reliabilityScore}/10
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            NHTSA Complaints
          </span>
          <span className="font-medium">
            {car.nhtsaComplaints.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Top Issue</span>
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
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Safety Rating</span>
          <span className="text-amber-500 text-sm">
            {safetyStars(car.safetyRating)}
          </span>
        </div>
      </div>
      <div className={`rounded-md px-3 py-2 text-center text-sm font-medium ${scoreBgClass(car.reliabilityScore)}`}>
        {car.reliabilityScore >= 8
          ? "✓ Recommended"
          : car.reliabilityScore >= 5
          ? "⚠ Proceed with caution"
          : "✗ Not recommended"}
      </div>
    </div>
  );
}
