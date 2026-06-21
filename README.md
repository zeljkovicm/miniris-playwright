# MiniRIS - Test Automation Framework

A Playwright + TypeScript automation framework for **MiniRIS**, a synthetic
Radiology Information System. It tests the core radiology workflow at two layers:
the API and the UI.

```
REGISTERED → SCHEDULED → PERFORMED → REPORTED → SIGNED
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

I don't start MiniRIS by hand - `playwright.config.ts` has a `webServer` block that
runs `docker compose -f miniris/docker-compose.yml up --build` and waits for
`/api/health` before the tests run.

## Running the tests

```bash
npm test            # full suite
npm run test:api    # API layer only        (@api)
npm run test:e2e    # UI/E2E layer only      (@e2e)
npm run test:smoke  # critical-path smoke    (@smoke)
npm run test:headed # E2E with a visible browser
npm run report      # open the last HTML report
```

## Project structure

```
src/
  api/        API clients (ApiClient base + Orders/Reports/Admin)
  pages/      Page objects (BasePage, MainPage) + components (WorklistTable, ...)
  fixtures/   Playwright fixtures (clients + page objects injected into tests)
  data/       Test-data factories (unique data per run)
  helpers/    Multi-step setup helpers (e.g. createPerformedOrder)
  types/      Shared TypeScript types
tests/
  api/        orders, reports, order-lifecycle, projection
  e2e/        order-journey (UI)
global-setup.ts   resets MiniRIS once before the suite
```

## What I built and why

### 1. Two layers: API and E2E

**What I did.** I split the tests into two layers. The API tests hit the order and
report endpoints directly - the happy path, the wrong-state cases (409), bad input
(422), and not-found (404). The E2E tests use the real UI for the user journey:
make an order, find it in the worklist, write the report, sign it. The full
REGISTERED→SIGNED path is there in both layers.

**Why.** The two layers break for different reasons, so they tell me different
things. API tests are fast and stable, so I put most of the rule-checking there.
UI tests are slower and easier to break, so I keep them focused on the one thing
only they can prove: that a real user can actually click through and finish the
job. If an API test fails, it's a logic or contract problem. If an E2E test fails,
it's a UI problem. Keeping the heavy checking on the API side means the E2E suite
stays small and I can trust it.

### 2. I set up test data through the API, not the UI

**What I did.** When an E2E test needs an order in some state, I create it through
the API clients, not by clicking through the UI. For example, the full journey test
creates the order and moves it to PERFORMED via the API, then switches to the UI
only for the part it actually wants to test - writing and signing the report.

**Why.** Clicking through every setup step in the UI is slow and breaks easily, and
it's not what that test is trying to prove. Setting up through the API is fast and
reliable, and it keeps the test focused on the one thing it's checking. The exercise
also asks for this directly. The trade-off is that the perform button in the UI
doesn't get exercised this way - I cover that separately (see "what I left out").

### 3. The status-code check lives in the API client

**What I did.** My `ApiClient` checks the HTTP status for me. Each call says what
status it expects (201 for creates, 200 for everything else), and if the response
doesn't match, the client throws an error with a clear message. So my happy-path
tests don't repeat `expect(status).toBe(200)` everywhere - they just check the
actual data. Negative tests check the thrown status, like `rejects.toThrow("409")`.

**Why.** The status code is part of the contract, so I want it checked in one
place, not copy-pasted into every test. This keeps the tests short and focused on
what they're really about - the data and the behaviour. And because the client
throws on a wrong status, a test can't accidentally pass when the call failed. If
MiniRIS ever changed a status code, I'd fix it in one spot instead of in every
test.

### 4. Page objects, split into components

**What I did.** The UI is wrapped in page objects instead of raw selectors in the
tests. `MainPage` holds the screen, and I split it into smaller components for the
parts that make sense on their own: `WorklistTable`, `NewOrderForm`, and
`OrderDetailPanel`. The tests call methods like `worklistTable.openOrder(id)` or
`orderDetailPanel.signReport()` and never touch a selector directly.

**Why.** I want the selectors and the "how" of clicking around to live in one
place. If the UI changes, I fix it in the page object, not in ten tests. Splitting
the page into components keeps each class small and about one thing, instead of one
giant page class that knows everything. It also reads better - the test says what
it's doing, not how. I use the stable `data-testid` selectors the app provides, so
the locators don't break on styling or text changes.

### 5. Fixtures give each test what it needs

**What I did.** I use Playwright fixtures to hand the API clients and page objects
to the tests. A test just asks for what it needs in its arguments -
`{ ordersClient }` or `{ mainPage }` - and the fixture builds it. The tests don't
create clients or page objects by hand.

**Why.** This keeps the setup in one place and out of the tests. Every test gets a
fresh, ready-to-use object without repeating `new OrdersClient(...)` at the top of
each file. It also makes the tests read cleanly - you see right away what a test
depends on just from its arguments. If I ever need to change how a client or page
is built, I change the fixture, not every test.

### 6. Test data comes from factories and is unique per run

**What I did.** I don't hardcode order data in the tests. Small factory functions
like `createCtHeadOrder()` build the data, and they make it unique each time using
`Date.now()` in the patient name and id. Every test that needs an order creates its
own.

**Why.** Two reasons. First, unique data means tests don't step on each other - one
test's order can't be confused with another's, even when they run at the same time.
That's what lets me run everything in parallel safely. Second, building data in one
place keeps the tests clean and easy to change - if the shape of an order changes, I
fix the factory, not every test. I also chose not to rely on the seeded data, so the
tests don't break if the seed changes.

### 7. Reusable helpers - but not blindly

**What I did.** Where the same setup repeated, I pulled it into a helper -
`createPerformedOrder` gets an order to PERFORMED in one line. But I didn't use it
in the lifecycle test, where the point is to check each step.

**Why.** I didn't follow DRY blindly. A helper is good when a test only needs to
reach a state. But where showing the steps is the point of the test, hiding them in
a helper would remove what I'm trying to prove - so there I wrote them out.

### 8. Handling worklist without fixed waits

**What I did.** When you change an order's status,
the single-order read (`GET /orders/{id}`) is correct right away, but the worklist
(`GET /orders`) shows the old status for about 1.5 seconds. The UI worklist also
doesn't refresh on its own.

I handle this in two places. In the API tests, `projection.spec.ts` documents it
directly: right after a change, the single read is already correct, while the
worklist catches up - I wait for that with `expect.poll`. In the UI, my
`waitForOrderStatus` clicks refresh and re-checks in a loop (`toPass`) until the
worklist shows the new status. I never use a fixed `sleep`.

**Why.** A fixed wait is a guess - too short and the test is flaky, too long and
the suite is slow. Polling waits for the real thing to happen and moves on the
moment it does, so it's both stable and fast. I drive the refresh through the UI
(not by calling the API inside the page object) because the E2E test should do what
a real user does. One thing I leaned on: a brand-new order shows up in the worklist
right away, so there I just use a normal assertion - the lag only matters for status
changes.

### 9. Isolated tests, run in parallel

**What I did.** I reset MiniRIS once before the whole suite (in `global-setup.ts`),
and from there each test makes its own unique data instead of sharing state. With
that, I turn on `fullyParallel` so tests run at the same time.

**Why.** Parallel tests only work if they don't share state. Since each test creates
its own unique order, they can't collide, so I get the speed of parallelism without
flaky failures. I reset once at the start for a clean baseline, but I don't reset
between every test - that would force tests to run one by one and slow everything
down. My tests also never check the exact number of orders, so the seeded data
sitting there doesn't bother them.

### 10. Tags and a small smoke set

**What I did.** Every test is tagged `@api` or `@e2e` for its layer, and a few key
ones are tagged `@smoke`. The smoke set is small on purpose: one full API lifecycle
test and one full UI journey test. The `package.json` scripts let me run any of
these on their own (`test:api`, `test:e2e`, `test:smoke`).

**Why.** Tags let me run just the slice I care about. During quick checks I run
smoke and get an answer in seconds - if those two pass, the system works end to end
on both layers. I kept smoke minimal so it stays fast and meaningful; the
individual happy-path tests are already covered by the full lifecycle, so I didn't
need to mark all of them as smoke too.

### 11. Grouped tests with describe blocks

**What I did.** Inside each spec I group the tests with nested `describe` blocks by
what they're about - for example "Lifecycle", "Validation and state transitions",
and "Filtering and search" in the orders tests. The E2E tests are grouped the same
way.

**Why.** Grouping makes the report easier to read - the results come out organized
by topic instead of one long flat list, so it's quick to see which area passed or
failed. It also makes the file easier to scan and shows how I think about the tests.
It's purely organizational - it doesn't change how the tests run, each one is still
independent.

### 12. CI as a quality gate

**What I did.** A GitHub Actions workflow runs on every push and pull request to
`main`/`master`. It starts the MiniRIS container (through the Playwright
`webServer`), runs the suite, and passes or fails clearly. It caches npm and the
Playwright browsers so runs stay fast, and it always uploads the HTML report plus
traces, screenshots, and videos as artifacts - even when tests fail.

**Why.** The point of CI is to be a gate: if the tests fail, the change shouldn't
go in, and that signal has to be obvious. Caching keeps each run quick so the gate
isn't annoying to wait on. Uploading the report and traces matters most when
something fails on CI - instead of guessing, I can open the trace and see exactly
what happened. I upload on pass too, so the report is always there to look at.

**A note on the triggers.** Right now it runs on both pushes and pull requests,
which I did mostly because it was the easiest way to test the pipeline from home. In
a real setup I'd probably do this differently - for example, make it a required
check on pull requests so a branch can't be merged into `main` while tests are
failing, instead of just running after the fact on a push. The exact rules vary
from company to company, but the idea is to use the gate to actually block bad
merges, not only to report on them.

### 13. An open question, marked with test.fixme

**What I did.** I noticed the API (and the UI) let you schedule an order with a
date in the past. I wrote tests that expect this to be rejected, but I marked them
with `test.fixme`, so they're skipped with a clear message instead of failing.

**Why.** The spec doesn't say whether a past date should be allowed - unlike the
1.5s worklist lag, which the README clearly calls intentional. So I didn't want to
assume it's a bug and make the suite fail over it. A past date might even be valid
in a real radiology system. `test.fixme` lets me record the question and my
expected behaviour in code, while keeping the gate clean, and flag it as something
to confirm with whoever owns the product. If they say past dates should be
rejected, the test is already written - I just remove the skip.

## What I left out and why

### A. Doing the whole journey through the UI

**What I left out.** I don't click through every step in the UI. I cover creating
an order and scheduling through the UI, but for the full journey test I jump to
PERFORMED through the API and only use the UI for the report and sign steps. So the
"perform" button in the detail panel isn't exercised by a test.

**Why.** The exercise itself says to prefer setting up data through the API instead
of clicking through it, so I treated this as a clear place to show that - get to the
state I need through the API, then use the UI only for the part the test is really
about. In a bigger system the same approach would usually apply: don't re-drive
every step through the UI when the API can set it up faster and more reliably.

These steps are trivial here, but trivial doesn't mean safe -
sometimes even a button just doesn't work (wrong handler, hidden, disabled). By
setting up through the API I wouldn't catch that on the "perform" step. This one was not done
because of lack of time, it is a simple test, and I wanted to use my time for other tests. I'd add one small UI test for perform so the button itself is
covered too.

### B. Every filter combination and every bad input

**What I left out.** I test each filter on its own (status, modality, search) and
one combination (status + modality), but not every possible mix. For bad input I
check the main cases (422 on an empty body, 404 on missing ids, 409 on wrong-state
moves) but not every invalid permutation.

**Why.** I went for representative cases instead of every combination. Testing one
combined filter proves the filtering works together; listing out every mix would add
a lot of tests for very little new signal. The same goes for bad input - once I've
shown the API returns the right error for the key cases, exhaustive permutations are
better pushed left to unit tests, which are faster and closer to the validation
logic. At this layer I want to prove the contract holds, not re-check every branch.

### C. Cross-browser testing

**What I left out.** The suite runs on Chromium only. I didn't add Firefox or
WebKit projects.

**Why.** For the time I had, I'd rather have a solid, meaningful suite on one
browser than spread thin across three. MiniRIS is a small internal-style app, so
browser-specific bugs are less likely to be the main risk here. Adding the other
browsers is easy though - it's just a couple more projects in the Playwright config
- so if cross-browser mattered, that's a quick next step.

### D. Catching the worklist while it's still stale

**What I left out.** My projection test checks that the worklist *eventually* shows
the new status after a change. It doesn't try to catch the very first moment, while
the worklist still shows the *old* status.

**Why.** To catch the old status I'd have to read the worklist inside that ~1.5s
window. If the test is even a little slow (say, on CI), the window passes, the
worklist has already caught up, and my "expect the old status" check fails - not
because anything is broken, but because I missed the timing. So I test the part that
matters and is reliable (it catches up), and skip the part that's flaky (it's stale
at the exact start). It's a small loss of precision for a much more stable test.

### E. More test scenarios I'd add

**What I left out.** With more time I'd add: whether the same patient can have
duplicate orders scheduled at the same time; partial and case-insensitive search
(the API matches on substrings); rejecting invalid modality/priority values (should
be 422); checking the report body is stored and returned exactly as sent; and a
simple liveness check on `/api/health`.

**Why.** I covered the core workflow and its main rules first. These cases are real
and worth having, but each adds less than the core paths, so they were first to drop
under time. I'm listing them so it's clear what I know is missing, not what I missed.

### F. The "list orders" test is on the weak side

**What I left out.** My "should return a list of orders" test only checks that the
response is an array (`Array.isArray()`). If the list came back empty or with any array of elements, 
that check would
still pass - an empty array is still an array. I didn't strengthen it to assert the
items actually look like orders.

**Why.** I know the app always has seeded data, so in practice the list is never
empty here and the test works as a basic check of the endpoint. The shape of an
order is already checked properly in the create/fetch test. With more time I'd
create my own order first and assert it's in the list, so the test doesn't lean on
the seed.

### G. Consistency and cleanup

**What I left out.** Some housekeeping I didn't fully tidy. I'm not perfectly
consistent with TypeScript type annotations - some variables and functions are
explicitly typed, others lean on inference. My page objects also expose a few
selectors and methods I don't actually use yet. There are probably one or two more
bits of repeated setup I could have pulled into a helper. And I removed the repeated
status-code assertions from the tests by centralizing them in the API client (see
#3).

**Why.** None of these change what the tests prove, so under time pressure they were
lower priority than coverage and reliability. They're easy cleanups: settle on one
typing convention, drop the unused page-object members, and extract the last bits of
shared setup. I'm calling them out so they're known, not hidden.

### H. Fewer UI tests than API tests (on purpose)

**What I left out.** There are clearly fewer UI tests than API tests.

**Why.** That's deliberate. I think the business logic, and the tests that check it,
matter more than UI coverage here, and the API layer is where I can check that logic
cleanly and fully. It also gives me a clear line: if the API tests pass but a UI test
fails, I know the problem is in the UI, not the logic. So I put most of my effort
where it tells me the most and kept the UI tests focused on the journey a user
actually takes.
