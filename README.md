# MiniRIS - Test Automation Framework

A Playwright + TypeScript framework for **MiniRIS**, a synthetic Radiology Information
System. It tests the core workflow at two layers - the API and the UI.

```
REGISTERED  ->   SCHEDULED  ->   PERFORMED  ->   REPORTED  ->   SIGNED
```

## Prerequisites

- **Node.js** (LTS)
- **Docker** (the suite starts the MiniRIS container automatically)

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env        # sets BASE_URL=http://localhost:8000
```

`playwright.config.ts` has a `webServer` block that runs
`docker compose -f miniris/docker-compose.yml up --build` and waits for `/api/health`,
so I don't start MiniRIS by hand.

## Running the tests

```bash
npm test            # full suite
npm run test:api    # API layer            (@api)
npm run test:ui     # through the browser   (@ui)
npm run test:e2e    # full end-to-end flows (@e2e)
npm run test:smoke  # critical-path smoke   (@smoke)
npm run test:headed # UI with a visible browser
npm run report      # open the last HTML report
```

**Tags are two axes:** `@ui` = goes through the browser, `@e2e` = walks the full
workflow end to end. They differ on purpose - a UI filter test is `@ui` but not `@e2e`,
and the API lifecycle test is `@e2e` but not `@ui`.

## Project structure

```
src/
  api/        API clients (ApiClient base + Orders/Reports/Admin)
  pages/      Page objects (BasePage, MainPage) + components
  fixtures/   Playwright fixtures (clients + page objects injected into tests)
  data/       Test-data factories (unique data per run)
  helpers/    Multi-step setup helpers (e.g. createPerformedOrder)
  types/      Shared TypeScript types
tests/
  api/        orders, reports, order-lifecycle, projection
  ui/         order-journey
global-setup.ts   resets MiniRIS once before the suite
```

## What I built and why

- **Two layers (API + UI).** They fail for different reasons, so I put the heavy
  rule-checking on the fast, stable API layer and keep the UI suite thin - only what a
  real user flow can prove.
- **Test data set up via the API, not the UI.** Faster and less flaky; the UI is used
  only for the part a test is actually about.
- **Status code checked in the API client.** Tests assert data, not repeated 200/201,
  and a call can't silently pass when it failed.
- **Page objects split into components.** Selectors live in one place, classes stay
  small, and tests use stable `data-testid` selectors.
- **Fixtures inject clients and page objects.** Setup lives in one place; tests read
  cleanly and show their dependencies.
- **Factories with unique data (`Date.now()`).** Tests don't collide, so they run in
  parallel safely and don't depend on the seeded data.
- **Helpers, but not blindly.** `createPerformedOrder` removes repeated setup, but I
  don't use it in the lifecycle test, where checking each step is the point.
- **No fixed waits for the projection lag.** `projection.spec` polls with `expect.poll`;
  the UI refreshes in a `toPass` loop until the worklist catches up.
- **Isolated + parallel.** One reset before the suite + unique data per test lets me run
  `fullyParallel`.
- **Tags + minimal smoke.** `@api` / `@ui` / `@e2e` / `@smoke`; smoke is just one API
  lifecycle and one UI journey for an end-to-end happy path basic functionality test in seconds.
- **Grouped with `describe` blocks** so the report reads by topic.
- **CI as a quality gate.** GitHub Actions starts the container, runs the suite with a
  clear pass/fail, caches npm + browsers, and uploads the report and traces.
- **An open question via `test.fixme`.** The API accepts a past `scheduled_at`; the spec
  doesn't define this, so I recorded the expected behaviour without failing the gate and
  flagged it for the product owner.

## What I left out and why

- **Perform through the UI.** I have decided to set it up via the API; with little bit more time I'd add one UI test for
  the perform button.
- **Every filter combination / every bad input.** Representative cases only - exhaustive
  permutations belong in unit tests, pushed left.
- **Cross-browser.** Chromium only; adding Firefox/WebKit is a couple of config lines.
- **Catching the worklist while it's still stale.** I only test that it catches up -
  asserting the stale moment is timing-sensitive and flaky.
- **More scenarios I'd add:** duplicate orders for the same patient, partial /
  case-insensitive search, invalid modality/priority (422), report body echoed back, a
  `/api/health` liveness check.
- **Consistency / cleanup / refactor.** TypeScript type annotations aren't perfectly consistent, the
  page objects expose a few unused members, and a little more setup could be a helper.
- **Fewer UI than API tests, on purpose.** Business logic matters more and is cleaner to
  check on the API; it also gives a clear line - API passes but UI fails means a UI
  problem. Also, UI seems to be just rendering API data.
- **Thinner UI filtering / invalid-action feedback.** No UI modality filter or combos
  (proven at the API layer), and I don't assert the UI's error feedback or which actions
  show per status.

## Part 2a - automation strategy

The real MiniRIS is a set of services behind a gateway: Orders/Scheduling/Reporting
own their data and emit events, and Worklist builds a read model from those events
(the source of the lag). DB-per-service means isolation - the real risks are
**contracts drifting** and the **read model going out of sync**. I'd place tests as a
pyramid over that:

- **Unit** (per service, push left) - the business rules and state machine in isolation,
  no HTTP or DB. Most of the tests; all the exhaustive cases.
- **Component** (per service, push left) - the service with its real DB, everything else
  stubbed: status codes, validation, persistence, and that it emits the right events.
- **Contract** (push left, shared) - the shape of messages between services. The producer
  emits to the agreed schema; the consumer can handle that schema. Catches a breaking
  event/API change before deploy, without a full E2E. I believe the system is hybrid, so I'd split
  it: a shared schema + registry for the async events, Pact for the sync gateway calls.
- **Integration** - the real connection points between components: an emitted event actually reaches the read model
  (eventual consistency), and the read model survives missed / duplicate / out-of-order
  events. External systems (PACS/VNA/HL7) are stubbed, never in the gate.
- **Cross-service (E2E API)** - the full REGISTERED -> SIGNED workflow through the gateway,
  proving the services, the bus, and the read model cooperate to deliver the whole
  business flow. It crosses the write->read boundary, so instead of a fixed wait it polls
  the worklist until the read model catches up (the authoritative single-order read is
  already correct; the worklist lags). I keep few of these - they're slow and touch
  everything. This is what my API tests do.
- **UI E2E** - a few critical journeys through the browser. This is what my UI tests do.

**Push left:** unit + component + contract belong in each service team's pipeline.

**CI gate, by stage.** Not everything runs everywhere - fast checks gate often, slow
ones rarely:

- *On each PR to a service:* its unit + component + contract tests. Fast and reliable,
  so they can block every merge without slowing devs down.
- *Contract verification:* a producer can't merge a change that breaks a consumer - what
  makes independent deploys safe.
- *On deploy to a shared env:* a thin slice of cross-service + UI smoke, gating promotion.
- *Full E2E / integration / external suites:* on a schedule or before a release, not
  every commit - too slow and flaky to gate every change.

The gate is a clear pass/fail.

**Reusable across products:** the framework skeleton and the eventual-consistency
polling pattern carry over directly. Shared event/contract schemas are reusable in two
ways. The schema *itself* is reused wherever products share domain events - on a
platform several products may all care about events like `OrderSigned`, and then the
schema is the single contract every one of them builds against, with one set of
contract tests protecting all consumers. And independent of domain, the *setup* around
schemas - the schema registry / Pact broker, the compatibility rules, and the CI step
that verifies contracts - is platform tooling you stand up once and reuse for every
product.

## Part 2b - a test agent

An AI agent that turns a Jira user story into proposed Playwright tests in this
framework, and helps keep existing tests up to date. It works on a branch and opens a
PR; a human always reviews and merges.

**Inputs**
- the Jira user story + acceptance criteria (triggered when a story is ready)
- read access to the repos it needs: the test repo (where it writes), the frontend (to
  pull stable selectors and see the flow), and the backend - or at least its OpenAPI
  schema, to know what each endpoint expects

**Outputs**
- the story translated into test cases, written as code in this framework (reusing the
  page objects, clients, factories, tags)
- on a new branch, as a PR, with each change documented and explained

**Human in the loop**
- if the spec isn't clear and unambiguous, the agent doesn't guess - it comments on the
  Jira ticket asking for clarification
- a human reviews and merges the PR, even when all status checks are green; the agent
  never merges on its own

**Maintenance**
- it watches the repo: when something it relies on changes (e.g. a frontend selector), it
  notices the affected tests and proposes the update - but a human decides whether the
  test was outdated or the app actually broke

**Guardrails**
- only uses selectors/endpoints that actually exist (from the frontend + OpenAPI) - it
  never invents them
- follows the framework's rules: stable `data-testid`, no fixed sleeps, the
  status-checking client, factories for data
- stays in the story's scope; least-privilege access (write only to the test repo/branch);
  no real patient data

**Validation (how I'd check what it produces)**
- it compiles and lints
- it runs green - and, the key part, it can actually *fail*: run it against a deliberately
  broken build to confirm it catches the regression (a test that can't fail is useless)
- run a few times to catch flakiness before it's trusted
- each acceptance criterion maps to a test, and the human confirms it checks the right thing

**Failure modes I'd worry about**
- invented selectors/endpoints; tests that always pass (false confidence)
- locking in a bug - testing current behaviour as if it's correct (the past-date case is
  exactly this)
- flaky or brittle tests, over-fitting to current UI text
- misreading an ambiguous story - mitigated by the ask-on-Jira guardrail

**Proof of concept** - above is my proof of concept