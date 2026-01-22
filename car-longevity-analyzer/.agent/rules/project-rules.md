# Project Rules - Car Longevity Analyzer

## Tech Stack (Always Use)
- Next.js 14 with App Router (not Pages Router)
- TypeScript strict mode
- Tailwind CSS for styling
- shadcn/ui for components
- Prisma ORM for database
- Zod for validation

## Code Style
- Use functional components with hooks
- Prefer async/await over .then()
- Use descriptive variable names
- Add JSDoc comments to all exported functions
- Keep files under 200 lines; split if larger

## API Routes
- Place all API routes in app/api/
- Use route.ts naming convention
- Return consistent JSON structure: { success: boolean, data?: any, error?: string }
- Always validate input with Zod schemas

## Components
- One component per file
- Place in components/ directory
- Use PascalCase for component names
- Extract reusable UI to components/ui/

## Error Handling
- Wrap API calls in try/catch
- Return user-friendly error messages
- Log errors to console in development

## Environment Variables
- Never hardcode API keys
- Use NEXT_PUBLIC_ prefix only for client-side vars
- Document all env vars in .env.example

## Testing
- Test all API routes with the browser subagent
- Verify UI renders correctly before marking complete
