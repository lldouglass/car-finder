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
  Truck,
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
  if (score >= 8) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800";
  if (score >= 5) return "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800";
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
    <div className="mx-auto max-w-6xl px-4 py-8">
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
          Find the Most Reliable Car for Your Budget
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Curated picks ranked by real NHTSA complaint data and reliability
          scores. No guessing — just data.
        </p>
      </section>

      {/* Budget tier selector */}
      <section className="mb-8" aria-label="Select your budget">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Your Budget
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {budgetTiers.map((tier) => {
            const isActive = selectedTier === tier.value;
            return (
              <button
                key={tier.value}
                onClick={() => setSelectedTier(tier.value)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign
                    className={`size-4 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-semibold text-sm">{tier.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tier.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter pills + sort */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by vehicle type">
          <Filter className="size-4 text-muted-foreground" />
          {(
            [
              { value: "all", label: "All", icon: null },
              { value: "sedan", label: "Sedan", icon: Car },
              { value: "suv", label: "SUV", icon: Car },
              { value: "truck", label: "Truck", icon: Truck },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setVehicleType(value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                vehicleType === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="reliability">Reliability</option>
            <option value="price">Price (Low → High)</option>
            <option value="complaints">Fewest Complaints</option>
          </select>
        </div>
      </section>

      {/* Car cards */}
      <section aria-label="Car results">
        {filteredCars.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Car className="size-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No cars match that filter</p>
            <p className="text-sm">Try selecting a different vehicle type</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCars.map((car, index) => (
              <CarCard key={`${car.make}-${car.model}-${car.yearRange}`} car={car} rank={index + 1} />
            ))}
          </div>
        )}
      </section>

      {/* Hidden Gems section */}
      <section className="mt-16 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="size-5 text-amber-500" />
          <h2 className="text-2xl font-bold">
            Hidden Gems — Reliable Versions of Unreliable Cars
          </h2>
        </div>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          Some cars have terrible reputations — but only specific trims or
          transmissions are the problem. These are the versions that are actually
          reliable.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {hiddenGems.map((gem) => (
            <Card key={`${gem.make}-${gem.model}-${gem.yearRange}`} className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {gem.make} {gem.model}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                  >
                    <Star className="size-3 mr-1" />
                    Hidden Gem
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {gem.yearRange}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{gem.note}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {gem.reliabilityScore}/10 Reliability
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA to explore */}
      <section className="text-center py-10 border-t">
        <h2 className="text-xl font-semibold mb-2">Want the full picture?</h2>
        <p className="text-muted-foreground mb-4">
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
  const searchQuery = `${car.make} ${car.model} ${car.yearRange.split("–")[0]}`;

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        isAvoid ? "border-red-200 dark:border-red-800" : ""
      }`}
    >
      {isAvoid && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-bl-md">
          Avoid
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank number */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isAvoid
                ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                : rank <= 3
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {car.make} {car.model}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {car.yearRange}
                </p>
              </div>
              <div
                className={`rounded-lg border px-2.5 py-1 text-center ${scoreBg(
                  car.reliabilityScore
                )}`}
              >
                <div
                  className={`text-lg font-bold leading-none ${scoreColor(
                    car.reliabilityScore
                  )}`}
                >
                  {car.reliabilityScore}
                </div>
                <div className="text-[10px] text-muted-foreground">/10</div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <DollarSign className="size-3.5" />
                ~{formatPrice(car.avgPrice)}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="size-3.5" />
                {car.nhtsaComplaints.toLocaleString()} complaints
              </span>
              <Badge variant="secondary" className="text-xs capitalize">
                {car.type}
              </Badge>
            </div>

            {/* Top issue */}
            {car.topIssue && (
              <div className="flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="size-3.5 mt-0.5 flex-shrink-0" />
                <span>{car.topIssue}</span>
              </div>
            )}

            {/* Trim warning */}
            {car.trimWarning && (
              <div
                className={`text-xs rounded-md px-2.5 py-1.5 mt-1 ${
                  isAvoid
                    ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                }`}
              >
                ⚠️ {car.trimWarning}
              </div>
            )}

            {/* Hidden gem badge */}
            {car.hiddenGem && (
              <Badge
                variant="outline"
                className="mt-2 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              >
                <Star className="size-3 mr-1" />
                Hidden Gem
              </Badge>
            )}

            {/* Analyze link */}
            <div className="mt-3">
              <Link
                href={`/?q=${encodeURIComponent(searchQuery)}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Analyze this car →
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
