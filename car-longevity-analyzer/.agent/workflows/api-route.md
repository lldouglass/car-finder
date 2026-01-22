---
description: Workflow for creating a new API route
---

# /api-route - Create New API Route

Goal: Scaffold a new Next.js API route following project conventions.

Steps:
1. Ask for route path and HTTP methods if not provided
2. Create route.ts file in appropriate app/api/ subdirectory
3. Define Zod schema for request validation
4. Implement handler with try/catch error handling
5. Return consistent response format
6. Add JSDoc comment with example request/response
7. Test the endpoint using the browser subagent or curl
