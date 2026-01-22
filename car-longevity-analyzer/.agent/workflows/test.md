---
description: Workflow for running tests
---

# /test - Run Tests and Verify

Goal: Run the development server and verify the application works correctly.

Steps:
1. Check if node_modules exists, if not run `npm install`
2. Run `npm run dev` to start the development server
3. Use the browser subagent to navigate to http://localhost:3000
4. Test the main user flows:
   - Home page loads correctly
   - VIN input form is visible
   - Listing paste form is visible
5. Take screenshots of each page state
6. Report any errors or issues found
7. If tests pass, create a verification artifact with screenshots
