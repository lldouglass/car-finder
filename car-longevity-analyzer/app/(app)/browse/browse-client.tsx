"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Shield,
  AlertTriangle,
  Star,
  ArrowUpDown,
  Sparkles,
  Car,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  browseCars,
  hiddenGems,
  budgetTiers,
  type BrowseCar,
} from "@/lib/browse-data";

type BudgetTier = 5000 | 10000 | 15000 | 25000 | 35000;
type VehicleType = "all" | "sedan" | "suv" | "truck";
type SortMode = "reliability" | "price" | "complaints";

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 8)
    return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800";
  if (score >= 5)
    return "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800";
  return "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function BrowseClient() {
  const [selectedTier, setSelectedTier] = useState<BudgetTier>(15000);
  const [vehicleType, setVehicleType] = useState<VehicleType>("all");
  const [sortMode, setSortMode] = useState<SortMode>("reliability");

  const filteredCars = useMemo(() => {
    let cars = browseCars.filter((car) => car.budgetTier === selectedTier);
    if (vehicleType !== "all") {
      cars = cars.filter((car) => car.type === vehicleType);
    }
    cars = [...cars].sort((a, b) => {
      switch (sortMode) {
        case "reliability":
          return b.reliabilityScore - a.reliabilityScore;
        case "price":
          return a.avgPrice - b.avgPrice;
        case "complaints":
          return a.nhtsaComplaints - b.nhtsaComplaints;
        default:
          return 0;
      }
    });
    return cars;
  }, [selectedTier, vehicleType, sortMode]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
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
            Updated weekly
          </Badge>
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            NHTSA complaint data
          </Badge>
          <span className="text-muted-foreground">Methodology-based reliability rankings</span>
        </div>
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
            Editor&rsquo;s Picks by Budget
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Find the Most Reliable Car for Your Budget
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Curated recommendations ranked by real complaint volume, ownership risk,
            and reliability score — with clear callouts on what to buy and what to avoid.
          </p>
        </div>
      </section>

      <section className="mb-8" aria-label="Select your budget">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Choose your budget tier
          </h2>
          <span className="text-xs text-muted-foreground">
            {filteredCars.length} result{filteredCars.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="rounded-2xl border bg-muted/30 p-2 md:p-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {budgetTiers.map((tier) => {
              const isActive = selectedTier === tier.value;
              return (
                <button
                  key={tier.value}
                  onClick={() => setSelectedTier(tier.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition-all md:px-4 md:py-3.5 ${
                    isActive
                      ? "border-primary bg-background shadow-md ring-1 ring-primary/30"
                      : "border-transparent bg-background/70 hover:border-primary/30 hover:bg-background"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <DollarSign
                      className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-sm font-semibold">{tier.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{tier.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border bg-card p-3 shadow-sm md:p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by vehicle type"
          >
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="size-3.5" />
              Body style
            </span>
            {(
              [
                { value: "all", label: "All" },
                { value: "sedan", label: "Sedan" },
                { value: "suv", label: "SUV" },
                { value: "truck", label: "Truck" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setVehicleType(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  vehicleType === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="reliability">Sort: Reliability</option>
              <option value="price">Sort: Price (Low → High)</option>
              <option value="complaints">Sort: Fewest Complaints</option>
            </select>
          </div>
        </div>
      </section>

      <section aria-label="Car results">
        {filteredCars.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <Car className="mx-auto mb-3 size-12 opacity-50" />
            <p className="text-lg font-medium">No cars match that filter</p>
            <p className="text-sm">Try selecting a different vehicle type</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCars.map((car, index) => (
              <CarCard key={`${car.make}-${car.model}-${car.yearRange}`} car={car} rank={index + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-background to-amber-100/40 p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/25 dark:to-amber-900/10 md:p-7">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-900/50">
            <Sparkles className="size-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Hidden Gems: Reliable Versions of Unreliable Cars
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              Some models earn bad reputations because of one problematic trim,
              transmission, or engine. These are the specific configurations with
              materially better reliability outcomes.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {hiddenGems.map((gem) => (
            <Card
              key={`${gem.make}-${gem.model}-${gem.yearRange}`}
              className="border-amber-200/80 bg-background/90 shadow-sm dark:border-amber-900/70"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {gem.make} {gem.model}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{gem.yearRange}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                  >
                    <Star className="mr-1 size-3" />
                    Hidden Gem
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{gem.note}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {gem.reliabilityScore}/10 Reliability
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t py-10 text-center">
        <h2 className="mb-2 text-xl font-semibold">Want the full picture?</h2>
        <p className="mb-4 text-muted-foreground">
          Explore every car in our database with full NHTSA complaint data.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/explore">Explore All Cars</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Analyze a Specific Car</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function CarCard({ car, rank }: { car: BrowseCar; rank: number }) {
  const isAvoid = car.reliabilityScore <= 4;
  const isTop = rank <= 3;
  const searchQuery = `${car.make} ${car.model} ${car.yearRange.split("–")[0]}`;

  return (
    <Card
      className={`relative overflow-hidden border shadow-sm transition-all hover:shadow-md ${
        isAvoid
          ? "border-red-300/90 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
          : "border-border/80"
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1.5 ${
          isAvoid ? "bg-red-500/90" : isTop ? "bg-primary/90" : "bg-muted"
        }`}
      />
      {isAvoid && (
        <div className="absolute right-4 top-4 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Avoid
        </div>
      )}

      <CardContent className="p-0">
        <div className="grid md:grid-cols-[1.3fr_1fr_auto]">
          <div className="border-b p-5 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isAvoid
                    ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                    : isTop
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                #{rank}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-tight">
                  {car.make} {car.model}
                </h3>
                <p className="text-sm text-muted-foreground">{car.yearRange}</p>
                <Badge variant="secondary" className="mt-2 text-xs capitalize">
                  {car.type}
                </Badge>
              </div>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Typical Price</p>
                <p className="mt-0.5 font-semibold">~{formatPrice(car.avgPrice)}</p>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">NHTSA Complaints</p>
                <p className="mt-0.5 font-semibold">{car.nhtsaComplaints.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="border-b bg-muted/20 p-5 md:border-b-0 md:border-r">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Analyst note
            </p>
            {car.topIssue ? (
              <div className="mb-3 flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>{car.topIssue}</span>
              </div>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">
                No dominant complaint category in this budget segment.
              </p>
            )}

            {car.trimWarning ? (
              <div
                className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  isAvoid
                    ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                    : "bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                }`}
              >
                ⚠️ {car.trimWarning}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No major trim-specific warning surfaced in current dataset.
              </p>
            )}

            {car.hiddenGem && (
              <Badge
                variant="outline"
                className="mt-3 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              >
                <Star className="mr-1 size-3" />
                Hidden Gem
              </Badge>
            )}
          </div>

          <div className="flex min-w-[180px] flex-col justify-between gap-4 p-5 md:items-end">
            <div
              className={`w-full rounded-xl border px-4 py-3 text-center md:max-w-[130px] ${scoreBg(
                car.reliabilityScore
              )}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Reliability
              </p>
              <p className={`text-3xl font-bold leading-none ${scoreColor(car.reliabilityScore)}`}>
                {car.reliabilityScore}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">out of 10</p>
            </div>

            <Button asChild className="w-full md:w-auto">
              <Link href={`/?q=${encodeURIComponent(searchQuery)}`}>Analyze this car</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
