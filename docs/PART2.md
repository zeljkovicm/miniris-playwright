# Part 2 - Strategy and AI

## 2a. Automation strategy

The real MiniRIS is a set of services behind an API gateway. Orders, Scheduling, and
Reporting each own their own data and emit events when something changes; Worklist
listens to those events and builds a read model that powers the worklist query.
Reporting also talks to external systems (PACS/VNA, HL7). Because each service owns
its own database, no service can corrupt another's data directly - the real risks are
the contracts between services drifting and the read model falling out of sync. My
strategy is built around that.

I think about it as a test pyramid laid over the architecture: lots of small, fast
checks low down, a few slow ones at the top.

```
        /\        UI E2E         few   - critical user journeys through the SPA
       /  \       Cross-service  some  - full lifecycle through the gateway
      /----\      Contract       many  - event + API contracts between services
     /------\     Component      many  - each service with its own DB
    /--------\    Unit           most  - business rules inside each service
```

### Where the checks live, and what each layer is best at

**Unit - inside each service.** The business rules and state machine of one service,
in isolation, no network or database. Orders: you can only schedule a REGISTERED
order. Scheduling: you can only perform a SCHEDULED one. Reporting: a report needs a
PERFORMED order, and DRAFT→SIGNED only. This layer is best at the exhaustive cases -
every invalid transition, every bad field - because it's the fastest and closest to
the code.

**Component - one service plus its own database, everything else faked.** Spin up a
single service with its DB, hit its real API, and stub the event bus and the other
services. Best at proving one service behaves correctly on its own: it saves and reads
back correctly, returns the right errors (404/409/422), and emits the events it's
supposed to.

**Contract - between services.** Each service keeps its own small copy of what it
needs, all built from events, so the biggest risk is one service quietly changing an
event or endpoint and breaking another. Consumer-driven contract tests pin down the
shape both sides agreed on - the events Orders/Scheduling/Reporting emit and what
Worklist consumes. Best at catching a breaking change before it's deployed, without a
full end-to-end run.

**Integration - across a real boundary.** Two boundaries matter here. The event bus:
a service emits an event and the read model actually updates (tested with polling,
because of the lag). And the external systems: Reporting talks to PACS/VNA/HL7, which
can't run in CI, so they're stubbed/virtualised and contract-tested against agreed
messages. Best at proving the wiring across a boundary works.

**Cross-service (E2E API) - through the gateway.** The full REGISTERED→SIGNED workflow
that spans Orders, Scheduling, and Reporting and shows up in Worklist - the same thing
my current API tests do. Best at proving the whole business flow holds together, and
it's where eventual consistency is real, so these tests poll for the read model to
catch up. I keep fewer of these because they're slower and touch everything.

**UI E2E - the thin top.** A few journeys through the real SPA. Best at the one thing
only the UI can prove: that a real user can actually complete the flow on screen.

### What I'd push left to developers

The bottom three layers - unit, component, and contract - belong with the teams that
own each service, running in their own pipelines. That's where the exhaustive
rule-checking lives: every invalid state transition, every bad input, every error
code. Contract tests are shared between the producing and consuming teams, since both
sides have to agree. The point of pushing this left is speed and ownership - the
developer who changes Orders should find out in seconds that they broke a rule or an
event shape, long before it ever reaches a slow end-to-end suite. My rule of thumb:
push every check as far down as it will go; if a unit test can catch it, don't write a
slow end-to-end test for the same thing.

### Two things this architecture makes special

**Eventual consistency.** The worklist is a read model built from events, so it lags
the source of truth. Any check that crosses the write→read boundary has to wait for it
to catch up (poll, never a fixed sleep). Beyond the happy lag, I'd also test that the
read model converges correctly and survives missed or out-of-order events - that's a
real failure mode of this design, not just a timing detail.

**The external integration boundary.** PACS/VNA/HL7 can't run in CI and aren't mine to
control. So I stub them for normal runs, contract-test the integration against agreed
messages, and keep any tests that hit the real systems in a separate, controlled
sandbox - never in the gate that has to stay fast and reliable.

### What a CI quality gate should enforce

I'd run different things at different stages instead of everything everywhere:

- **On a pull request to a service:** that service's unit + component tests, plus its
  side of the contract tests. Fast, and it blocks the merge.
- **Contract verification across services:** a producer can't merge a change that
  breaks a consumer's contract - that's the check that lets services deploy
  independently without breaking each other.
- **On deploy to a shared environment:** a slice of cross-service API smoke and the
  critical UI smoke, blocking promotion.
- **Full E2E and external-integration suites:** on a schedule or before a release, not
  on every commit - they're too slow and too dependent on a full stack to gate every
  change.

The gate's job is a clear pass/fail: green means safe to promote. A known issue I
can't fix shouldn't hold the gate permanently red (in this project I handled one such
case with `test.fixme` so it's recorded without breaking the gate).

### What could be reused across products

- The framework skeleton itself: the API client with its centralised status check,
  fixtures, page objects, data factories, and setup helpers.
- The eventual-consistency polling pattern - any product with a read projection has the
  same problem, so the "wait for the read model to catch up" helper carries over.
- Shared event/contract schema definitions, so teams test against the same source.
- A shared CI template and the reporting/artifact setup, so every product gets the
  same gate and the same traces-on-failure for free.
- Common auth/setup and domain data factories for entities that show up in more than
  one product.

## 2b. A test agent

The idea: an AI agent that takes a user story and its acceptance criteria and proposes
Playwright tests for it — using this framework, not generic snippets. It reuses the
existing page objects, API clients, fixtures, factories, and tags, and it opens its
work as a draft pull request for a human to review. It can also help maintain tests:
when one breaks, it can suggest a fix. It never merges anything on its own.

### Inputs

- **The user story and its acceptance criteria** — the main input, one criterion at a
  time so each can map to a test.
- **The framework as context** — the page objects and their methods, the API clients,
  the fixtures, the data factories, the tag conventions, and a few existing tests as
  style examples, so it writes in our style instead of inventing its own.
- **The stable-selector catalog** — the list of `data-testid` values the app exposes,
  so it only uses selectors that actually exist.
- **The API spec (OpenAPI)** for the endpoints and their status codes.
- **The running app** (or a recent snapshot), so it can confirm a selector or endpoint
  is really there before relying on it.

### Outputs

- **First, a list of proposed test cases** — titles, what each one checks, and which
  layer it belongs in (API vs E2E). This is a cheap thing for a human to approve before
  any code is written.
- **Then the draft test code** — reusing the existing page objects and clients, adding
  a new page-object method only when something genuinely isn't covered yet, tagged
  `@api`/`@e2e`/`@smoke` as appropriate.
- **A short note per test** explaining what it covers, plus a clear flag on anything in
  the acceptance criteria that was ambiguous.
- All of it as a **draft PR**, never a merge.

### Where the human stays in the loop

- The human **approves the test-case list** before code is generated — the cheapest
  place to catch a wrong direction.
- The human **reviews and merges the PR**; the agent can't merge.
- When the acceptance criteria are unclear, the agent **asks instead of guessing**.
- For maintenance, when a test breaks the agent can **propose** a fix, but a human
  decides whether the test was outdated or the app is actually broken.

### Guardrails

- **Only use selectors that exist.** It must pull from the `data-testid` catalog and
  the page objects — if a selector it needs isn't there, it flags that, it doesn't make
  one up.
- **Follow the framework's rules.** No fixed sleeps (use web-first assertions / polling,
  like the projection pattern), use the status-checking client, use the factories for
  unique data.
- **It must compile and lint** before it's allowed to propose anything.
- **Stay in scope** — only what the story's criteria cover, no unrelated changes.
- **No real data.** It never hardcodes secrets or sends real patient data to the model,
  and it never runs destructive actions outside a sandbox.

### How I'd validate what it produces

- It **compiles and lints**.
- It **runs green** against the app.
- It **can actually fail** — this is the important one. A test that can't fail is
  useless, so I'd confirm it catches the thing it's meant to: run it against a build
  where that behaviour is deliberately broken and check it goes red. If it still passes,
  it isn't really testing anything.
- It's **not flaky** — run it several times (or with repeat) before trusting it, and
  keep new tests quarantined until they pass consistently.
- It **traces back to the criteria** — each acceptance criterion has a matching test,
  and a human reads it to confirm it checks the right thing, not just something green.

### Failure modes I'd worry about

- **Made-up selectors or endpoints** — tests written against things that don't exist.
  The selector catalog and a compile/run check are there to catch this.
- **Tests that always pass** — asserting nothing meaningful, or the wrong thing, which
  gives false confidence. The "can it fail?" check is the main defence.
- **Locking in a bug** — the agent sees the current behaviour and writes a test that
  expects it, even when that behaviour is wrong (the scheduling-in-the-past case is
  exactly this trap). A human has to decide what *should* happen, not just what does.
- **Flaky tests** — from bad waits or shared state. Handled by the no-sleep rule and the
  repeat-before-trust check.
- **Brittleness** — over-fitting to current UI text or structure, so tests break on
  harmless changes.
- **Volume over value** — generating lots of shallow tests that cost more to maintain
  than they ever catch.
- **Misreading ambiguous criteria** — confidently testing the wrong rule; the
  ask-don't-guess guardrail and the human approval of the case list are there for this.

### A small proof of concept

A realistic first version wouldn't need anything fancy: feed the model the story, the
selector catalog, and a couple of existing specs as examples, and have it output the
proposed test-case list plus draft code into a branch. The pipeline then compiles it,
runs it, and runs it again against a deliberately broken build to confirm it can fail —
and only then is it handed to a human as a PR. Start it on simple, well-specified
stories, keep a human on every PR, and widen its scope only as it earns trust.
