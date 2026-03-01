'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Search,
  FileText,
  ClipboardCheck,
  Car,
  Wrench,
  AlertTriangle,
  DollarSign,
  CreditCard,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function CollapsibleSection({ section, isExpanded, onToggle }: {
  section: GuideSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary">{section.icon}</div>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 prose prose-sm dark:prose-invert max-w-none">
          {section.content}
        </CardContent>
      )}
    </Card>
  );
}

const guideSections: GuideSection[] = [
  {
    id: 'timing',
    icon: <Calendar className="size-5" />,
    title: 'Best Times to Buy',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Seasonal Timing</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>October through March</strong> is generally the best time to buy used cars</li>
          <li>Dealers need to clear inventory before year-end and new model arrivals</li>
          <li>Demand drops during colder months, giving buyers more leverage</li>
        </ul>

        <h4 className="font-semibold">End of Period Deals</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>End of month:</strong> Salespeople push to hit monthly quotas</li>
          <li><strong>End of quarter:</strong> Even more pressure to meet targets (March, June, September, December)</li>
          <li><strong>End of year:</strong> Best deals as dealers clear inventory for tax purposes</li>
        </ul>

        <h4 className="font-semibold">Holiday Weekends</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>MLK Day weekend, Presidents Day, Memorial Day, Labor Day</li>
          <li>Dealers run promotions and are motivated to move inventory</li>
          <li>Less competition from other buyers during holidays</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'research',
    icon: <Search className="size-5" />,
    title: 'Research Phase',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Determining Needs vs Wants</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>List must-haves: passenger capacity, cargo space, fuel efficiency, safety features</li>
          <li>Separate nice-to-haves: leather seats, sunroof, premium audio</li>
          <li>Consider your typical driving: commute, road trips, city parking</li>
        </ul>

        <h4 className="font-semibold">Setting a Realistic Budget</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Purchase price is just the start - add 10-15% for total cost</li>
          <li>Factor in: sales tax, registration fees, title transfer</li>
          <li>Insurance costs can vary dramatically by vehicle</li>
          <li>Budget for immediate repairs and maintenance</li>
        </ul>

        <h4 className="font-semibold">Most Reliable Brands (Consumer Reports)</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li><strong>Lexus</strong> - Consistently tops reliability rankings</li>
          <li><strong>Toyota</strong> - Legendary long-term dependability</li>
          <li><strong>Mazda</strong> - Excellent value and reliability</li>
          <li><strong>Honda</strong> - Strong reputation for durability</li>
          <li><strong>Subaru</strong> - Good long-term reliability, especially AWD</li>
        </ol>

        <h4 className="font-semibold">Dealers vs Private Sellers</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Dealers:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Often offer warranties</li>
              <li>Financing available</li>
              <li>More legal protections</li>
              <li>Higher prices (overhead costs)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Private Sellers:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Lower prices typically</li>
              <li>Can meet the actual owner</li>
              <li>No warranty (as-is)</li>
              <li>Cash transactions only</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'history',
    icon: <FileText className="size-5" />,
    title: 'Vehicle History Reports',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Carfax vs AutoCheck</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Carfax:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Larger database of records</li>
              <li>Better international coverage</li>
              <li>More expensive (~$40/report)</li>
              <li>Industry standard</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">AutoCheck:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Owned by Experian</li>
              <li>Better auction data</li>
              <li>More affordable (~$25/report)</li>
              <li>Score system for quick assessment</li>
            </ul>
          </div>
        </div>

        <h4 className="font-semibold">What to Look For</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Accident history:</strong> Severity, airbag deployment, structural damage</li>
          <li><strong>Title issues:</strong> Salvage, rebuilt, flood, lemon law buyback</li>
          <li><strong>Odometer readings:</strong> Consistent progression, no rollbacks</li>
          <li><strong>Service history:</strong> Regular maintenance, major repairs</li>
          <li><strong>Ownership history:</strong> Number of owners, fleet/rental use</li>
        </ul>

        <h4 className="font-semibold">Free Alternatives</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>NMVTIS:</strong> National Motor Vehicle Title Information System (~$2)</li>
          <li><strong>NHTSA Recall Lookup:</strong> Free at nhtsa.gov/recalls</li>
          <li><strong>VehicleHistory.com:</strong> Free basic reports</li>
          <li><strong>iSeeCars:</strong> Free VIN check with price analysis</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'inspection',
    icon: <ClipboardCheck className="size-5" />,
    title: 'Inspection Checklist',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Exterior</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check for rust, especially wheel wells, rocker panels, and undercarriage</li>
          <li>Look for paint mismatches or overspray indicating body work</li>
          <li>Check body panel gaps - uneven gaps suggest accident damage</li>
          <li>Inspect glass for chips, cracks, or improper seals</li>
          <li>Examine tires for even wear and adequate tread depth</li>
          <li>Check all lights: headlights, taillights, turn signals, brake lights</li>
        </ul>

        <h4 className="font-semibold">Engine Bay</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Oil:</strong> Check level and color (should be amber, not black)</li>
          <li><strong>Coolant:</strong> Green/orange, not rusty or milky (head gasket issue)</li>
          <li><strong>Transmission fluid:</strong> Red/pink, not brown or burnt-smelling</li>
          <li><strong>Belts:</strong> No cracks, fraying, or excessive wear</li>
          <li><strong>Hoses:</strong> No bulges, cracks, or leaks</li>
          <li>Look for corrosion on battery terminals and surrounding areas</li>
        </ul>

        <h4 className="font-semibold">Interior</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check wear patterns match stated mileage</li>
          <li>Test all electronics: windows, locks, AC, heat, radio, screens</li>
          <li>Look for water stains on carpets/headliner (flood damage)</li>
          <li>Smell for mold, mildew, or heavy air freshener (masking odors)</li>
          <li>Check seat adjustments and seatbelt function</li>
        </ul>

        <h4 className="font-semibold">Undercarriage</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Look for frame damage, bends, or fresh undercoating (hiding rust)</li>
          <li>Check for oil leaks, fluid drips, or wet spots</li>
          <li>Inspect suspension components for wear or damage</li>
          <li>Examine exhaust system for rust holes or loose connections</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'testdrive',
    icon: <Car className="size-5" />,
    title: 'Test Drive Guide',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Cold Start Observations</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Request to start the car yourself when engine is cold</li>
          <li>Watch for exhaust smoke: blue (oil), white (coolant), black (rich fuel)</li>
          <li>Listen for rough idle, knocking, or ticking sounds</li>
          <li>Check that warning lights illuminate then turn off</li>
        </ul>

        <h4 className="font-semibold">Brakes</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pedal should feel firm, not spongy or sink to floor</li>
          <li>No pulsation through pedal (warped rotors)</li>
          <li>Car should stop straight, not pull to one side</li>
          <li>Listen for squealing, grinding, or scraping sounds</li>
        </ul>

        <h4 className="font-semibold">Steering</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Wheel should return to center after turns</li>
          <li>No excessive play or looseness</li>
          <li>No vibration at highway speeds (alignment/balance issues)</li>
          <li>Power steering should be smooth with no whining</li>
        </ul>

        <h4 className="font-semibold">Transmission</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Automatic:</strong> Smooth shifts, no hesitation or jerking</li>
          <li><strong>Manual:</strong> Clutch engages smoothly, no grinding between gears</li>
          <li>No slipping (RPMs rise without acceleration)</li>
          <li>Test all gears including reverse</li>
        </ul>

        <h4 className="font-semibold">Listen For</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Clicking when turning (CV joints)</li>
          <li>Humming that changes with speed (wheel bearings)</li>
          <li>Clunks over bumps (suspension/bushings)</li>
          <li>Wind noise (weatherstripping issues)</li>
        </ul>

        <h4 className="font-semibold">Test Both Highway and City</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Highway: Check highway merge power, stability at speed, vibrations</li>
          <li>City: Stop-and-go, parking maneuvers, visibility</li>
          <li>Test in varied conditions if possible (hills, rough roads)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'ppi',
    icon: <Wrench className="size-5" />,
    title: 'Pre-Purchase Inspection (PPI)',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Why It&apos;s Essential</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Costs $100-300, can save thousands in hidden problems</li>
          <li>Provides leverage for price negotiation</li>
          <li>Independent assessment from someone not selling the car</li>
          <li>Catches issues you might miss during your inspection</li>
        </ul>

        <h4 className="font-semibold">What Mechanics Check</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Compression test:</strong> Engine health and cylinder condition</li>
          <li><strong>Electronic diagnostics:</strong> OBD-II codes, pending issues</li>
          <li><strong>Lift inspection:</strong> Undercarriage, suspension, exhaust</li>
          <li><strong>Brake measurements:</strong> Pad and rotor thickness</li>
          <li><strong>Fluid analysis:</strong> Condition of all fluids</li>
          <li><strong>Frame inspection:</strong> Accident damage, rust, repairs</li>
        </ul>

        <h4 className="font-semibold">Finding a Good Inspector</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use independent mechanics, not the seller&apos;s recommended shop</li>
          <li>Look for ASE-certified technicians</li>
          <li>For specialty cars (European, sports), find a specialist</li>
          <li>Mobile inspection services can come to the car</li>
          <li>Ask for a written report with photos</li>
        </ul>

        <h4 className="font-semibold">Deal-Breakers to Watch For</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Frame damage or signs of major collision repair</li>
          <li>Transmission slipping or major issues</li>
          <li>Head gasket failure (milky oil, coolant loss)</li>
          <li>Severe rust on structural components</li>
          <li>Electrical problems that can&apos;t be diagnosed</li>
          <li>Signs of flood damage</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'redflags',
    icon: <AlertTriangle className="size-5" />,
    title: 'Red Flags & Scams',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Odometer Fraud</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Worn pedals, steering wheel, seats don&apos;t match low mileage</li>
          <li>Dashboard looks tampered with or misaligned</li>
          <li>Service records show higher mileage than odometer</li>
          <li>Digital odometers can be rolled back - trust history reports</li>
        </ul>

        <h4 className="font-semibold">Title Washing</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Moving salvage/flood cars between states to get clean titles</li>
          <li>Check if car has been registered in multiple states quickly</li>
          <li>Look for water lines in headlights, rust in unusual places</li>
          <li>Musty smell, sand/silt in crevices indicate flood damage</li>
        </ul>

        <h4 className="font-semibold">Curbstoners</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Unlicensed dealers posing as private sellers</li>
          <li>Red flags: multiple cars for sale, won&apos;t meet at home</li>
          <li>Title not in their name (&quot;selling for a friend&quot;)</li>
          <li>No consumer protections apply to these &quot;private&quot; sales</li>
        </ul>

        <h4 className="font-semibold">Common Dealer Tricks</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Addendum stickers:</strong> Extra markups above MSRP/advertised price</li>
          <li><strong>Mandatory add-ons:</strong> Window tinting, fabric protection, dealer prep</li>
          <li><strong>Payment packing:</strong> Quoting monthly payment, not total price</li>
          <li><strong>Yo-yo financing:</strong> Calling back saying financing fell through</li>
        </ul>

        <h4 className="font-semibold">Too-Good-To-Be-True Pricing</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>If price is way below market, there&apos;s usually a reason</li>
          <li>Scammers use attractive prices to lure victims</li>
          <li>Never wire money or pay before seeing the car in person</li>
          <li>Be wary of sellers who are &quot;out of town&quot; or need quick sale</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'negotiation',
    icon: <DollarSign className="size-5" />,
    title: 'Negotiation Strategies',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Research Comparable Prices First</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Kelley Blue Book (KBB):</strong> Consumer-focused, tends toward retail</li>
          <li><strong>Edmunds:</strong> True Market Value based on actual transactions</li>
          <li><strong>NADA Guides:</strong> Used by dealers and lenders</li>
          <li>Search similar vehicles on CarGurus, AutoTrader, Cars.com</li>
          <li>Know the market value range before making any offer</li>
        </ul>

        <h4 className="font-semibold">Private Seller Tactics</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Start lower than your max - leave room to negotiate</li>
          <li>Use inspection findings as leverage for price reduction</li>
          <li>Be respectful but firm - they want to sell too</li>
          <li>Cash offer can be compelling for quick, easy transaction</li>
          <li>Don&apos;t be afraid to walk away - other cars exist</li>
        </ul>

        <h4 className="font-semibold">Dealer Tactics</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Focus on out-the-door price, not monthly payment</li>
          <li>Negotiate the car price separately from financing and trade-in</li>
          <li>Get pre-approved financing to have leverage</li>
          <li>Be willing to walk - dealers will often call you back</li>
          <li>Visit near end of month for best deals</li>
        </ul>

        <h4 className="font-semibold">Trade-In Considerations</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Get separate quotes from CarMax, Carvana, Vroom first</li>
          <li>Knowing your car&apos;s value prevents lowball offers</li>
          <li>Sometimes selling privately nets more money</li>
          <li>Trade-in can reduce sales tax in some states</li>
        </ul>

        <h4 className="font-semibold">Walking Away Power</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your best negotiating tool is willingness to leave</li>
          <li>Don&apos;t get emotionally attached to any single car</li>
          <li>If you feel pressured, leave and think it over</li>
          <li>Good deals don&apos;t require immediate decisions</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'financing',
    icon: <CreditCard className="size-5" />,
    title: 'Financing Tips',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Get Pre-Approved Before Shopping</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check with your bank or credit union first</li>
          <li>Know your rate before the dealer tries to mark it up</li>
          <li>Pre-approval gives you negotiating power</li>
          <li>Multiple credit checks in 14-45 days count as one inquiry</li>
        </ul>

        <h4 className="font-semibold">APR Ranges by Credit Score (Typical)</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Excellent (750+):</strong> 4-7%</li>
          <li><strong>Good (700-749):</strong> 7-10%</li>
          <li><strong>Fair (650-699):</strong> 10-15%</li>
          <li><strong>Poor (below 650):</strong> 15%+ (consider waiting to improve credit)</li>
        </ul>

        <h4 className="font-semibold">Loan Term Recommendations</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>36 months:</strong> Highest payments, least interest paid</li>
          <li><strong>48 months:</strong> Good balance of payment and cost</li>
          <li><strong>60+ months:</strong> Avoid if possible - risk going underwater</li>
          <li>Car should never be financed longer than you&apos;ll own it</li>
          <li>Used cars depreciate - long loans = negative equity</li>
        </ul>

        <h4 className="font-semibold">Dealer Add-Ons to Avoid</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Extended warranties:</strong> Massively marked up - buy direct if needed</li>
          <li><strong>GAP insurance:</strong> Buy from your insurer for 50-75% less</li>
          <li><strong>Paint/fabric protection:</strong> Usually worthless</li>
          <li><strong>VIN etching:</strong> You can DIY for a few dollars</li>
          <li><strong>Nitrogen tire fill:</strong> Regular air is 78% nitrogen already</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'closing',
    icon: <CheckCircle className="size-5" />,
    title: 'Closing the Deal',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold">Required Documents</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Title:</strong> Must be in seller&apos;s name, signed over to you</li>
          <li><strong>Bill of Sale:</strong> Lists price, date, buyer/seller info, vehicle details</li>
          <li><strong>Odometer Disclosure:</strong> Required for vehicles under 20 years old</li>
          <li><strong>Release of Liability:</strong> Protects seller from future incidents</li>
          <li>Get copies of all service records and the owner&apos;s manual</li>
        </ul>

        <h4 className="font-semibold">Title Transfer Process</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check your state&apos;s DMV requirements - they vary</li>
          <li>Typically must be done within 30 days of purchase</li>
          <li>Bring valid ID, proof of insurance, payment for fees</li>
          <li>May need emissions test or safety inspection first</li>
          <li>Consider using a title service for complex situations</li>
        </ul>

        <h4 className="font-semibold">Registration and Insurance Timing</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Have insurance lined up before taking possession</li>
          <li>Some states allow temporary tags while processing registration</li>
          <li>Don&apos;t drive uninsured - even for the trip home</li>
          <li>Update insurance immediately after purchase</li>
        </ul>

        <h4 className="font-semibold">Warranty Considerations</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check if any factory warranty remains (transferable)</li>
          <li>CPO (Certified Pre-Owned) includes additional warranty</li>
          <li>Third-party warranties: research company reputation thoroughly</li>
          <li>Read exclusions carefully - many common repairs aren&apos;t covered</li>
        </ul>

        <h4 className="font-semibold">Private Sale Payment Safety</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Meet at the buyer&apos;s or seller&apos;s bank for cashier&apos;s checks</li>
          <li>Bank can verify the check is legitimate on the spot</li>
          <li>Never accept personal checks for large amounts</li>
          <li>Cash works but count carefully and consider safety</li>
        </ul>
      </div>
    ),
  },
];

export default function GuidePage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['timing']) // Start with first section expanded
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(guideSections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="size-4" />
            <span>Back to Analyzer</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            The Complete Used Car Buying Guide
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to know to find a reliable used car, avoid scams,
            and negotiate the best deal. From research to closing, we&apos;ve got you covered.
          </p>
        </header>

        {/* Controls */}
        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {guideSections.map((section) => (
            <CollapsibleSection
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Ready to Analyze a Vehicle?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Use our free tool to check reliability scores, detect red flags,
              and get fair price estimates for any used car.
            </p>
            <Button asChild size="lg">
              <Link href="/">Analyze a Vehicle</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            This guide is for informational purposes only and does not constitute professional
            automotive or financial advice. Always consult with qualified professionals
            for specific situations.
          </p>
        </footer>
      </div>
    </div>
  );
}
