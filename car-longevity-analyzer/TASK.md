# BUILD TASK: /browse and /explore pages

Build two new pages for this Next.js App Router car site. The site uses Tailwind CSS, shadcn/ui components (in components/ui/), and lucide-react icons. The current site is chat-based - users type a car to analyze it. We need discovery/browsing pages.

IMPORTANT: Look at existing components in components/ui/ and the existing app/ pages to match the style. Check layout.tsx and globals.css for theme/styling.

## PAGE 1: /browse - Budget-Tier Browse

Create app/browse/page.tsx (server component for SEO) with a client component for interactivity.

UX:
- Hero section: "Find the Most Reliable Car for Your Budget"
- Budget selector: clickable cards for Under 5K, 10K, 15K, 25K, 35K
- Default shows 15K selected
- When budget selected, show ranked car cards:
  - Each card: rank number, car name + year range, reliability score (X/10), avg price range, top issue (if any), trim warning (if any)
  - Green/yellow/red color coding based on score
  - Link to analyze (goes to / with prefilled search)
- Filter pills: All | Sedan | SUV | Truck
- Sort options: Reliability | Price (Low to High) | Fewest Complaints

Special section at bottom: "Hidden Gems - Reliable Versions of Unreliable Cars"
- Ford Focus 2012-2016 (Manual transmission only)
- 2017 Honda CR-V LX (2.4L engine, not the 1.5T)
- Pontiac Vibe (Toyota Matrix underneath)

Data: Create a lib/browse-data.ts file with a curated JSON dataset of ~50 cars organized by budget tier. Each entry has:
make, model, yearRange, budgetTier (5000/10000/15000/25000/35000), type (sedan/suv/truck), reliabilityScore (1-10), avgPrice (number), nhtsaComplaints (number), topIssue (string or null), trimWarning (string or null), hiddenGem (boolean), hiddenGemNote (string or null)

Pre-populate with real data:
- Under 5K tier: older Corollas (2008-2012), Civics (2008-2012), Mazda3 (2010-2013), Pontiac Vibe (2005-2010)
- Under 10K tier: 2012-2015 Camry, 2013-2016 Civic, 2014-2016 CX-5, 2014-2016 Forester
- Under 15K tier: 2015-2018 Camry, 2016-2018 Civic, 2015-2017 Mazda3, 2014-2016 RAV4, 2015-2017 Forester, 2015-2016 CR-V. Cars to avoid: Nissan Altima 2013-2016 (score 3/10, CVT issues), Jeep Compass 2014-2017 (score 3/10, electrical), Ford Focus 2012-2016 auto (score 2/10, PowerShift)
- Under 25K tier: 2019-2021 Camry, 2017-2019 Lexus ES 350, 2019-2021 CX-5, 2020-2021 Civic, 2018-2019 Outback. Avoid: Hyundai Tucson pre-2019 (engine recall)
- Under 35K tier: 2022-2024 Camry, 2021-2023 CX-5, 2022-2023 Civic, 2020-2022 Lexus ES

Make it SEO-friendly: proper metadata export, h1/h2 tags, structured content.

## PAGE 2: /explore - Data Explorer

Create app/explore/page.tsx (server component for SEO with client interactivity via a client component).

UX:
- Hero: "Every Car. Every Year. Real NHTSA Complaint Data."
- Filter bar: Make dropdown, Model dropdown (populates based on make), Year range slider or dropdown
- Sortable data table showing all cars
- Columns: Vehicle (Make Model), Year, Reliability Score, NHTSA Complaints, Top Issue Category, Safety Rating
- Click any row -> links to homepage chat with that car prefilled
- Compare feature: checkboxes to select 2-3 cars, Compare button shows side-by-side card view

Data: Create lib/explore-data.ts with a broader dataset. Can reuse browse-data entries plus add more. Include ~100-150 popular make/model/year combos with scores and complaint counts. Cover all major brands: Toyota, Honda, Mazda, Subaru, Ford, Chevy, Nissan, Hyundai, Kia, Jeep, VW, BMW, etc.

## NAVIGATION

Update the site navigation to add:
- "Browse by Budget" link to /browse
- "Explore All Cars" link to /explore
Look at the existing layout.tsx and any nav/header components to find where nav is rendered.

## STYLING
- Match existing site style (check globals.css and tailwind config)
- Use existing shadcn components: Card, Button, Badge from components/ui/
- If Table component doesn't exist in components/ui/, create a simple one or use a plain HTML table with Tailwind
- Mobile responsive
- Clean, modern look

## RULES
- Do NOT modify existing pages or components
- These are purely additive new routes
- Use TypeScript throughout
- Make sure pages build without errors (run: npx next build or npx tsc --noEmit to verify)

When completely finished, run this command to notify:
openclaw system event --text "Done: Built /browse and /explore pages for car site" --mode now
