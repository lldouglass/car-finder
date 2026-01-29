'use client';

import { useState } from 'react';
import type { AnalysisResponse, RedFlag, MaintenanceProjectionApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { SafetyRatingsDisplay, NoSafetyRatings } from '@/components/safety-ratings-display';
import { KnownIssuesDisplay } from '@/components/known-issues-display';
import { LifespanFactorsDisplay } from '@/components/lifespan-factors-display';
import {
  Gauge,
  DollarSign,
  Shield,
  AlertTriangle,
  Wrench,
  Activity,
  MessageCircle,
  Clipboard,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  TrendingDown,
} from 'lucide-react';

interface AnalysisCardProps {
  result: AnalysisResponse;
}

export function AnalysisCard({ result }: AnalysisCardProps) {
  const {
    longevity,
    pricing,
    redFlags,
    recalls,
    recommendation,
    safetyRating,
    knownIssues,
    lifespanAnalysis,
    maintenanceCost,
    negotiationStrategy,
    maintenanceCosts,
    inspectionChecklist,
    warrantyValue,
    priceThresholds,
  } = result;

  const hasLongevityData = longevity && longevity.estimatedRemainingMiles !== undefined;
  const hasPricingData = pricing && pricing.askingPrice !== undefined;
  const hasRedFlags = redFlags && redFlags.length > 0;
  const hasRecalls = recalls && recalls.length > 0;
  const hasQuestions = recommendation?.questionsForSeller && recommendation.questionsForSeller.length > 0;
  const hasKnownIssues = knownIssues && knownIssues.length > 0;
  const hasLifespanAnalysis = lifespanAnalysis && lifespanAnalysis.appliedFactors;
  const hasMaintenanceData = maintenanceCost && maintenanceCost.projections && maintenanceCost.projections.length > 0;
  const hasNegotiationStrategy = negotiationStrategy && negotiationStrategy.points.length > 0;
  const hasMaintenanceCosts = maintenanceCosts !== null && maintenanceCosts !== undefined;
  const hasInspectionChecklist = inspectionChecklist !== null && inspectionChecklist !== undefined;
  const hasWarrantyValue = warrantyValue && warrantyValue.coverageQuality !== 'none';
  const hasPriceThresholds = priceThresholds !== null && priceThresholds !== undefined;

  return (
    <div className="space-y-4">
      {/* Longevity Analysis */}
      <CollapsibleSection
        title="Longevity Analysis"
        icon={<Gauge className="size-5" />}
        defaultOpen
      >
        {hasLongevityData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatItem
                label="Remaining Miles"
                value={`${longevity.estimatedRemainingMiles.toLocaleString()} mi`}
                highlight
              />
              <StatItem
                label="Remaining Years"
                value={`${longevity.remainingYears} years`}
              />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-muted-foreground">Life Used</span>
                <span className="font-medium">{longevity.percentUsed}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, longevity.percentUsed)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Longevity data not available.</p>
        )}
      </CollapsibleSection>

      {/* Price Analysis */}
      <CollapsibleSection
        title="Price Analysis"
        icon={<DollarSign className="size-5" />}
        defaultOpen
      >
        {hasPricingData ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Asking Price</span>
              <span className="font-semibold text-lg">${pricing.askingPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fair Price Range</span>
              <span className="font-medium">
                ${pricing.fairPriceLow.toLocaleString()} - ${pricing.fairPriceHigh.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Deal Quality</span>
              <DealQualityBadge quality={pricing.dealQuality} />
            </div>
            {pricing.analysis && (
              <p className="text-sm text-muted-foreground pt-2">{pricing.analysis}</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Price data not available.</p>
        )}
      </CollapsibleSection>

      {/* Safety Ratings */}
      <CollapsibleSection
        title="Safety Ratings"
        icon={<Shield className="size-5 text-blue-500" />}
      >
        {safetyRating ? (
          <SafetyRatingsDisplay safetyRating={safetyRating} />
        ) : (
          <NoSafetyRatings />
        )}
      </CollapsibleSection>

      {/* Known Issues */}
      {hasKnownIssues && (
        <CollapsibleSection
          title={`Known Issues (${knownIssues.length})`}
          icon={<Wrench className="size-5 text-orange-500" />}
        >
          <KnownIssuesDisplay issues={knownIssues} />
        </CollapsibleSection>
      )}

      {/* Lifespan Factors */}
      {hasLifespanAnalysis && (
        <CollapsibleSection
          title="Lifespan Factors"
          icon={<Activity className="size-5 text-purple-500" />}
        >
          <LifespanFactorsDisplay lifespanAnalysis={lifespanAnalysis} />
        </CollapsibleSection>
      )}

      {/* Price Impact */}
      {hasPriceThresholds && priceThresholds.priceImpact && (
        <CollapsibleSection
          title="Price Impact"
          icon={<TrendingDown className="size-5 text-blue-500" />}
        >
          <p className="text-muted-foreground">{priceThresholds.priceImpact}</p>
          {priceThresholds.buyThreshold && priceThresholds.currentVerdict !== 'BUY' && (
            <p className="text-sm mt-2 font-medium text-green-600 dark:text-green-400">
              BUY threshold: ${priceThresholds.buyThreshold.toLocaleString()}
            </p>
          )}
        </CollapsibleSection>
      )}

      {/* Negotiation Strategy */}
      {hasNegotiationStrategy && negotiationStrategy && (
        <CollapsibleSection
          title="Negotiation Strategy"
          icon={<DollarSign className="size-5 text-green-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Suggested Offer</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${negotiationStrategy.suggestedOffer.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Walk Away Above</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  ${negotiationStrategy.walkAwayPrice.toLocaleString()}
                </p>
              </div>
            </div>
            {negotiationStrategy.openingStatement && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-medium mb-1">Opening Statement</p>
                <p className="text-sm italic">"{negotiationStrategy.openingStatement}"</p>
              </div>
            )}
            <div>
              <p className="font-medium text-sm mb-2">Talking Points:</p>
              <ul className="space-y-2">
                {negotiationStrategy.points.slice(0, 4).map((point, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <Badge
                      className={
                        point.leverage === 'strong'
                          ? 'bg-green-500'
                          : point.leverage === 'moderate'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }
                    >
                      {point.leverage}
                    </Badge>
                    <span>{point.point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Maintenance Costs */}
      {hasMaintenanceCosts && maintenanceCosts && (
        <CollapsibleSection
          title="Maintenance Costs"
          icon={<Wrench className="size-5 text-blue-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Est. Annual Cost</p>
                <p className="text-lg font-bold">
                  ${maintenanceCosts.estimatedAnnualCost.low.toLocaleString()} - $
                  {maintenanceCosts.estimatedAnnualCost.high.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">5-Year Projection</p>
                <p className="text-lg font-bold">
                  ${maintenanceCosts.fiveYearProjection.low.toLocaleString()} - $
                  {maintenanceCosts.fiveYearProjection.high.toLocaleString()}
                </p>
              </div>
            </div>
            {maintenanceCosts.upcomingMaintenance.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Upcoming Maintenance:</p>
                <ul className="text-sm space-y-2">
                  {maintenanceCosts.upcomingMaintenance.map((item, i) => (
                    <li key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            item.urgency === 'due_now'
                              ? 'text-red-500 font-medium'
                              : item.urgency === 'upcoming'
                              ? 'text-yellow-500'
                              : ''
                          }
                        >
                          {item.item}
                        </span>
                        {item.urgency === 'due_now' && (
                          <Badge variant="destructive">Due Now</Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        ${item.estimatedCost.low}-${item.estimatedCost.high}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Maintenance Projections */}
      {hasMaintenanceData && (
        <CollapsibleSection
          title={`Maintenance Projections${
            maintenanceCost.pastDueCount + maintenanceCost.dueNowCount > 0
              ? ` (${maintenanceCost.pastDueCount + maintenanceCost.dueNowCount} items need attention)`
              : ''
          }`}
          icon={<Wrench className="size-5 text-blue-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{maintenanceCost.maintenanceHealthScore}/10</div>
                <div className="text-xs text-muted-foreground">Health Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {maintenanceCost.pastDueCount + maintenanceCost.dueNowCount}
                </div>
                <div className="text-xs text-muted-foreground">Items Due</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  ${maintenanceCost.immediateRepairCostLow.toLocaleString()}-$
                  {maintenanceCost.immediateRepairCostHigh.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Immediate Costs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  ${maintenanceCost.upcomingCostLow.toLocaleString()}-$
                  {maintenanceCost.upcomingCostHigh.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Upcoming Costs</div>
              </div>
            </div>
            <div className="space-y-2">
              {maintenanceCost.projections.slice(0, 5).map((projection, index) => (
                <MaintenanceItem key={index} projection={projection} />
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Warranty Value */}
      {hasWarrantyValue && warrantyValue && (
        <CollapsibleSection
          title="Warranty Value"
          icon={<BadgeCheck className="size-5 text-purple-500" />}
        >
          <div className="space-y-3">
            {warrantyValue.estimatedValue.high > 0 && (
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Estimated Warranty Value</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${warrantyValue.estimatedValue.low.toLocaleString()} - $
                  {warrantyValue.estimatedValue.high.toLocaleString()}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{warrantyValue.valueExplanation}</p>
            <p className="text-sm">{warrantyValue.recommendation}</p>
          </div>
        </CollapsibleSection>
      )}

      {/* Inspection Checklist */}
      {hasInspectionChecklist && inspectionChecklist && inspectionChecklist.vehicleSpecificItems.length > 0 && (
        <CollapsibleSection
          title={`Inspection Checklist (${inspectionChecklist.vehicleSpecificItems.length})`}
          icon={<Clipboard className="size-5 text-teal-500" />}
        >
          <div className="space-y-2">
            {inspectionChecklist.vehicleSpecificItems.map((item, i) => (
              <div key={i} className="p-2 bg-red-50 dark:bg-red-950/30 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={
                      item.priority === 'critical'
                        ? 'bg-red-500'
                        : item.priority === 'important'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }
                  >
                    {item.priority}
                  </Badge>
                  <span className="font-medium text-sm">{item.item}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.whatToLookFor}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Red Flags */}
      <CollapsibleSection
        title={`Red Flags${hasRedFlags ? ` (${redFlags.length})` : ''}`}
        icon={<AlertTriangle className="size-5 text-yellow-500" />}
        defaultOpen={hasRedFlags}
      >
        {hasRedFlags ? (
          <div className="space-y-3">
            {redFlags.map((flag, index) => (
              <RedFlagItem key={index} flag={flag} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <Info className="size-4" />
            No red flags detected
          </p>
        )}
      </CollapsibleSection>

      {/* Recalls */}
      <CollapsibleSection
        title={`Recalls${hasRecalls ? ` (${recalls.length})` : ''}`}
        icon={<AlertCircle className="size-5 text-red-500" />}
      >
        {hasRecalls ? (
          <div className="space-y-3">
            {recalls.map((recall, index) => (
              <div
                key={index}
                className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-r"
              >
                <p className="font-medium text-sm">{recall.component}</p>
                <p className="text-sm text-muted-foreground mt-1">{recall.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">Reported: {recall.date}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <Info className="size-4" />
            No open recalls found
          </p>
        )}
      </CollapsibleSection>

      {/* Questions for Seller */}
      {hasQuestions && (
        <CollapsibleSection
          title="Questions for Seller"
          icon={<MessageCircle className="size-5" />}
        >
          <ol className="space-y-2">
            {recommendation.questionsForSeller.map((question, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-medium">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </CollapsibleSection>
      )}
    </div>
  );
}

// Collapsible section component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Helper components
function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? 'text-green-600 dark:text-green-400' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function DealQualityBadge({ quality }: { quality: string }) {
  const colors: Record<string, string> = {
    GREAT: 'bg-green-500 text-white',
    GOOD: 'bg-green-400 text-white',
    FAIR: 'bg-yellow-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    OVERPRICED: 'bg-red-500 text-white',
  };

  return <Badge className={colors[quality] || 'bg-gray-500 text-white'}>{quality}</Badge>;
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-950/30',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
  };

  const severity = flag.severity?.toLowerCase() || 'medium';

  return (
    <div className={`border-l-4 p-3 rounded-r ${severityColors[severity] || severityColors.medium}`}>
      <div className="flex items-center gap-2">
        <AlertCircle
          className={`size-4 ${
            severity === 'critical'
              ? 'text-red-500'
              : severity === 'high'
              ? 'text-orange-500'
              : severity === 'medium'
              ? 'text-yellow-500'
              : 'text-blue-500'
          }`}
        />
        <span className="font-medium text-sm">{flag.message}</span>
      </div>
      {flag.advice && <p className="text-xs text-muted-foreground mt-1 ml-6">{flag.advice}</p>}
    </div>
  );
}

function MaintenanceItem({ projection }: { projection: MaintenanceProjectionApi }) {
  const { item, urgency, milesUntilDue, adjustedCostLow, adjustedCostHigh } = projection;

  return (
    <div
      className={`border rounded-lg p-3 ${
        urgency === 'past_due'
          ? 'border-red-200 bg-red-50 dark:bg-red-950/30'
          : urgency === 'due_now'
          ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{item.name}</span>
            <Badge
              className={
                urgency === 'past_due'
                  ? 'bg-red-500'
                  : urgency === 'due_now'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }
            >
              {urgency === 'past_due' ? 'Past Due' : urgency === 'due_now' ? 'Due Now' : 'Upcoming'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {milesUntilDue <= 0 ? (
              <span className="text-red-600">{Math.abs(milesUntilDue).toLocaleString()} miles overdue</span>
            ) : (
              <span>Due in {milesUntilDue.toLocaleString()} miles</span>
            )}
            <span className="mx-2">•</span>
            <span>
              ${adjustedCostLow.toLocaleString()} - ${adjustedCostHigh.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
