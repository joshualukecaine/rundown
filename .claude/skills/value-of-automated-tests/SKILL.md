---
name: value-of-automated-tests
description: Analyzes the value of automated tests using frameworks from Kent Beck, Dave Farley, Martin Fowler, and other thought leaders. Use when asked to "analyze test value", "assess test quality", "are these tests valuable", or "review test ROI".
---

# Test Value Analysis

Analyzes automated tests to assess whether they provide genuine value or just create noise and make the pipeline slower. A test's worth comes from the confidence it gives you to ship and refactor, the documentation it provides, and whether it catches real bugs without constant maintenance.

## When to Use

- Evaluating quality/value of tests
- Deciding which tests to keep, refactor, or delete
- Reviewing whether a test suite enables confident deployment
- Before large refactoring efforts (assessing safety net quality)

---

## Process

### 1. Coverage Reality Check (do this FIRST, always)

Before scoring a single test, answer: **"What does this application do, and what percentage of that is actually tested?"**

Coverage metrics and green test counts are meaningless without this context. A suite can show 95% coverage and 200 passing tests while leaving every system boundary untested — giving false confidence that's worse than having no tests at all.

#### 1a. Map the Application Surface

Inventory every functional behavior the application exposes. Group by architectural layer:

| Layer | What to look for | Examples |
|-------|-----------------|----------|
| **System boundaries** | API routes/controllers, CLI commands, queue handlers, webhook endpoints | `POST /api/events`, `GET /api/zone-pace` |
| **Business logic** | Services, actions, domain models, pure computation | `computeZonePace()`, `estimateWorkoutDistance()` |
| **Integration glue** | Hooks, middleware, auth guards, client wrappers | `useEstimatedDistance()`, auth middleware |
| **Presentation** | Components, views, formatters | Dashboard cards, chart components |

#### 1b. Map Tests to Surface

For each behavior, classify what type of test covers it (if any):

| Behavior | Unit | Integration | E2E | **Verdict** |
|----------|------|-------------|-----|-------------|
| Zone pace computation | Yes | — | — | Partially covered (logic only) |
| `GET /api/zone-pace` | — | — | — | **Untested boundary** |
| Auth middleware redirect | Yes | — | — | Covered |
| Distance estimation priority chain | — | — | — | **Untested business logic** |

#### 1c. Assess Testing Pyramid Balance

The testing pyramid says: many fast unit tests at the base, fewer integration tests in the middle, minimal E2E at the top. But **every layer must exist**. A pyramid with only a base is a slab — it proves individual bricks work but not that the building stands.

Flag these pyramid anti-patterns:

| Anti-Pattern | Shape | Problem |
|--------------|-------|---------|
| **The slab** | All unit, no integration | Individual functions work but system boundaries are unproven |
| **The ice cream cone** | All E2E, few units | Slow, flaky, poor localization |
| **The hourglass** | Unit + E2E, no integration | Gap where most bugs live |
| **The trophy** | Heavy integration, light unit/E2E | Best shape for most web apps (Kent C. Dodds) |

#### 1d. Expose False Confidence

Check whether coverage metrics are lying:

- **Are all production files included in coverage config?** Files excluded from coverage are invisible — 100% coverage means nothing if half the app is excluded.
- **Do passing tests prove the system works, or just that isolated functions return correct values?** 145 green unit tests don't prevent a broken API route from shipping.
- **Could you delete an entire architectural layer and still have all tests pass?** If yes, that layer has zero effective coverage regardless of what the metrics say.

Generate the **Coverage Reality** table:

| Layer | Production files | Tested files | Effective coverage | Risk |
|-------|-----------------|--------------|-------------------|------|
| System boundaries (API routes) | 8 | 0 | **0%** | **Critical** |
| Business logic | 5 | 4 | 85% | Low |
| Integration glue (hooks, middleware) | 5 | 1 | 20% | High |
| Presentation | 12 | 0 | 0% | Low (minimal logic) |

This table is the single most important output of the analysis. It answers: **"If all tests pass, what can you actually be confident about?"**

### 2. Identify Scope for Detailed Analysis

After the reality check, narrow to specific test files for dimension scoring.

**File open in IDE:** analyze that test file.

**Directory or domain specified:** analyze all tests in that scope.

**Current branch:** get changed test files:
```bash
git diff --name-only main...HEAD -- '*test*' '*.spec.*'
```

**No scope specified:** ask the user.

### 3. Read Tests and Subjects

Read each test file. For each, also read the **subject under test** to understand the relationship between test and implementation.

### 4. Score Against the 8 Dimensions

For every `it()` or `test()` block, score each dimension 1-5.

---

## The 8 Dimensions of Test Value

### 1. Refactoring Safety

**Question:** If I change the implementation but keep the same behavior, will this test still pass?

| Score | Meaning |
|-------|---------|
| 5 | Tests behavior through public API - survives any refactor |
| 4 | Tests behavior but has minor coupling to structure |
| 3 | Some implementation awareness but mostly behavioral |
| 2 | Coupled to specific method calls or internal structure |
| 1 | Breaks on any internal change - tests implementation not behavior |

**Watch for:** Mocking internal collaborators that aren't boundaries. Asserting on method call counts for non-side-effect methods. Testing private method behavior through reflection. Asserting on intermediate state rather than final outcome.

**Good signs:** Tests through contract interfaces. Asserts on database state or return values. Tests HTTP responses, not controller internals. Uses factories to set up state, asserts on outcomes.

### 2. Documentation Quality

**Question:** Could a new developer read this test and understand what the system does?

| Score | Meaning |
|-------|---------|
| 5 | Test name + body reads like a specification |
| 4 | Clear intent, minor setup noise |
| 3 | Understandable with some effort |
| 2 | Unclear purpose, cryptic setup |
| 1 | Test name like "it works" - no documentation value |

**Watch for:** Names like `it('works')`, `it('test 1')`, `it('handles case')`. Excessive setup obscuring the behavior under test. No clear Arrange/Act/Assert separation. Magic numbers without explanation.

**Good signs:** `it('applies 10% discount when order exceeds 100 pounds')`. Clear Arrange/Act/Assert structure. Named variables: `$expiredCampaign`, `$cancelledOrder`. Datasets with descriptive labels.

### 3. Feedback Speed

**Question:** How fast does this test give you a signal?

| Score | Meaning |
|-------|---------|
| 5 | Pure unit test, runs in <10ms |
| 4 | Simple DB test with factory, <100ms |
| 3 | Integration test with multiple models, <500ms |
| 2 | Heavy test with queues/external fakes, <2s |
| 1 | Slow test needing real services, file I/O, or >5s |

**Watch for:** `sleep()` calls. Large factory chains creating unnecessary related models. Testing through HTTP when direct Action call would suffice. Creating hundreds of records when 2-3 would prove the point.

**Good signs:** Direct Action/Service calls instead of HTTP roundtrip. Minimal factory usage. Faked external services. Focused assertions that don't require complex state.

### 4. Defect Localization

**Question:** When this test fails, do you immediately know what's broken and where?

| Score | Meaning |
|-------|---------|
| 5 | Failure points to exact behavior and location |
| 4 | Failure narrows it to a small area |
| 3 | Failure tells you the area but not the specific issue |
| 2 | Failure could be many things - need to debug |
| 1 | Failure tells you almost nothing - just "something broke" |

**Watch for:** Testing 5 behaviors in one test. Catch-all integration tests that fail for dozens of reasons. Assertions on large JSON blobs without pinpointing fields.

**Good signs:** One concept per test. Specific expectations: `->name->toBe('John')` not `->toEqual($expected)`. Descriptive test names that match the single assertion.

### 5. Determinism

**Question:** Does this test give the same result every time, regardless of environment, time, or order?

| Score | Meaning |
|-------|---------|
| 5 | Fully deterministic, no external dependencies |
| 4 | Uses DB but properly isolated (transactions/migrations) |
| 3 | Minor time/order sensitivity but usually reliable |
| 2 | Flaky - fails intermittently |
| 1 | Depends on external state, time, network, or test order |

**Watch for:** `new Date()` without fake timers. Depending on auto-increment IDs or insertion order. Race conditions in queue/async testing. Shared state between tests. Tests that only pass in certain timezones.

**Good signs:** Fake timers for date-dependent logic. `RefreshDatabase` or `DatabaseTransactions` trait. All external services faked. No reliance on test execution order.

### 6. Defect Detection

**Question:** If I introduce a real bug, will this test catch it?

| Score | Meaning |
|-------|---------|
| 5 | Thoroughly asserts on all meaningful outcomes |
| 4 | Catches most real defects in the tested behavior |
| 3 | Catches obvious defects but misses edge cases |
| 2 | Only tests happy path - most bugs would slip through |
| 1 | Asserts almost nothing - would pass with wrong implementation |

**Watch for:** `assertSuccessful()` without checking response body. Creating data but never asserting it was stored correctly. Mocking the thing being tested (test always passes). No assertions at all.

**Good signs:** Asserts on return values AND side effects (DB state, events). Tests boundary conditions and edge cases. Tests error paths, not just happy path. Uses datasets to cover multiple scenarios.

### 7. Maintenance Cost

**Question:** How much effort does this test require to keep working as the codebase evolves?

| Score | Meaning |
|-------|---------|
| 5 | Almost zero maintenance - survives changes naturally |
| 4 | Occasional updates for intentional behavior changes |
| 3 | Needs updating for structural changes but not too painful |
| 2 | Frequently needs fixing after unrelated changes |
| 1 | Constant maintenance burden - breaks with every change |

**Watch for:** Hardcoded IDs, timestamps, or paths. Snapshot-style assertions on large structures. Tight coupling to database schema details. Duplicated setup across many tests.

**Good signs:** Uses factories with states (schema changes handled in one place). Tests through stable interfaces (contracts). Shared `beforeEach()` setup. Datasets for variations instead of copy-paste tests.

### 8. Design Feedback

**Question:** Does the difficulty or ease of writing this test tell you something about the design?

| Score | Meaning |
|-------|---------|
| 5 | Test was trivial to write - design is clean and testable |
| 4 | Straightforward with minor setup |
| 3 | Some friction but manageable |
| 2 | Painful setup revealing coupling issues |
| 1 | Nearly impossible to test without major mocking - design smell |

**Watch for:** Needing to mock 5+ dependencies. Complex setup just to reach the behavior being tested. Can't test without hitting the database for unrelated reasons. Static method calls that can't be mocked.

**Good signs:** Constructor DI makes swapping dependencies trivial. Action pattern keeps classes small and focused. Clear boundaries between layers. Tests naturally follow Arrange/Act/Assert.

---

## 5. Classify Tests

| Classification | Avg Score | Action |
|---------------|-----------|--------|
| **High Value** | >= 4.0 | Keep and protect |
| **Medium Value** | 2.5 - 3.9 | Identify which dimensions drag the score down, suggest targeted fixes |
| **Low Value** | < 2.5 | Candidate for rewrite or deletion |
| **Negative Value** | n/a | Actively harms development - delete or fundamentally rethink |

Negative value tests include: tests that pass but don't verify behavior (false confidence), tests so coupled to implementation they block refactoring (change preventers), constantly flaky tests (time sinks), and tests whose names don't match what they test (misleading documentation).

## 6. Generate Report

### Coverage Reality (always first)

**Surface Area:**

| Layer | Production files | Tested | Effective coverage | Risk |
|-------|-----------------|--------|-------------------|------|
| System boundaries | X | Y | Z% | ... |
| Business logic | X | Y | Z% | ... |
| Integration glue | X | Y | Z% | ... |
| Presentation | X | Y | Z% | ... |

**Pyramid shape:** {slab / ice cream cone / hourglass / trophy / healthy pyramid}

**False confidence flags:**
- {list any files excluded from coverage config}
- {list any layers where all tests could pass while layer is broken}

**Deployment confidence:** {Can you ship if all tests pass? What could still be broken?}

### Test Quality (per-file detail)

**Overall Assessment:** {1-2 sentence summary}

**Dimension Breakdown:**

| Test | Safety | Docs | Speed | Localize | Determinism | Detection | Maintenance | Design | Avg |
|------|--------|------|-------|----------|-------------|-----------|-------------|--------|-----|
| `it('...')` | 4 | 5 | 4 | 5 | 5 | 3 | 4 | 5 | 4.4 |
| `it('...')` | 2 | 3 | 4 | 2 | 5 | 2 | 2 | 3 | 2.9 |

**High Value Tests:** (keep and protect)
- `it('applies discount when order exceeds threshold')` - Tests real behavior through contract, clear name, fast

**Improvement Opportunities:** (medium value, fixable)
- `it('handles payment')` - Rename to describe specific behavior, split multiple assertions
  - Dimensions to improve: Documentation (3->5), Localization (2->4)

**Candidates for Rewrite/Deletion:** (low or negative value)
- `it('works')` - Tests implementation details, unclear purpose, breaks on refactor
  - Recommendation: Rewrite to test behavior through public API, or delete if covered elsewhere

### Missing Coverage (prioritized by risk)

Ordered by impact — what would you add first?

| Priority | What's missing | Why it matters | Effort |
|----------|---------------|----------------|--------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

**Design Insights:** (what test difficulty reveals)
- {Class X} required 6 mocks to test - consider extracting responsibilities
- {Method Y} was trivial to test - good separation of concerns

## Anti-Patterns Quick Reference

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| **The slab** | All unit tests, no integration — proves bricks work, not that the building stands | Add integration tests at system boundaries |
| **Ice cream cone** | Too many E2E, too few unit | Invert the pyramid |
| **Mockery hell** | Mocking everything = testing nothing | Only mock at boundaries |
| **Assertion-free** | Test runs but proves nothing | Add meaningful assertions |
| **Flickering** | Non-deterministic, ignored by team | Fix or delete - flaky tests erode trust |
| **Implementation-coupled** | Breaks on refactor | Test behavior, not structure |
| **God test** | Tests everything in one test | Split into focused tests |
| **Liar test** | Name doesn't match what it tests | Rename to match actual behavior |
| **Tautological** | Tests that the mock returns what you told it to | Test real behavior instead |
| **Coverage theater** | High % but production files excluded from config | Include all production code in coverage or remove thresholds |

## Suggesting Improvements

Prioritize by effort-to-impact:

1. **Fill pyramid gaps** - Missing integration or boundary tests are almost always the highest-impact addition (high impact, medium effort)
2. **Quick wins** - Renaming, splitting, adding missing assertions (high impact, low effort)
3. **Structural** - Extracting helpers, adding datasets, reorganizing describe blocks (medium effort)
4. **Rewrites** - Tests that need fundamental rethinking (high effort, suggest approach)
5. **Deletions** - Tests with negative value (explain why removal improves the suite)
