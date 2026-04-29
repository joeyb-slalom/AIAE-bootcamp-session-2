# Testing Guidelines: TODO App

## Core Testing Principles

1. All new features shall include appropriate automated tests.
2. Tests shall be maintainable and follow established best practices.
3. All tests shall be isolated and independent, with each test setting up its own data and avoiding reliance on other tests.
4. Setup and teardown hooks shall be used where required so tests succeed reliably across repeated runs.

## Unit Tests

5. Unit tests shall use Jest to test individual functions and React components in isolation.
6. Unit test files shall use the naming convention `*.test.js` or `*.test.ts`.
7. Backend unit tests shall be placed in `packages/backend/__tests__/`.
8. Frontend unit tests shall be placed in `packages/frontend/src/__tests__/`.
9. Unit test files shall be named to match what they are testing, such as `app.test.js` for `app.js`.

## Integration Tests

10. Integration tests shall use Jest and Supertest to test backend API endpoints with real HTTP requests.
11. Integration tests shall be placed in `packages/backend/__tests__/integration/`.
12. Integration test files shall use the naming convention `*.test.js` or `*.test.ts`.
13. Integration test files shall be named clearly based on the behavior they cover, such as `todos-api.test.js` for TODO API endpoints.

## End-to-End Tests

14. End-to-end tests shall use Playwright as the required framework to test complete UI workflows through browser automation.
15. End-to-end tests shall be placed in `tests/e2e/`.
16. End-to-end test files shall use the naming convention `*.spec.js` or `*.spec.ts`.
17. End-to-end test files shall be named according to the user journey they cover, such as `todo-workflow.spec.js`.
18. Playwright tests shall use one browser only.
19. Playwright tests shall use the Page Object Model (POM) pattern for maintainability.
20. End-to-end coverage shall be limited to 5-8 critical user journeys, prioritizing happy paths and key edge cases over exhaustive coverage.

## Port Configuration

21. Port configuration shall always use environment variables with sensible defaults.
22. The backend shall use `const PORT = process.env.PORT || 3030;`.
23. The frontend shall default to port 3000 and allow override through the `PORT` environment variable.
24. Port configuration shall support CI/CD workflows that need to detect or assign ports dynamically.
