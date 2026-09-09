# Changelog

## 3.2.0

### Changed

- **The bot does the change at a developer's scale, not the smallest edit.** The
  Claude prompt now allows a new component, a modal or multiple files, and only
  skips genuinely non-code points (compliment, question) or a target it cannot
  locate. A point needing a new dependency stays a skip-with-reason
  (`package.json` / lockfiles are never touched). `--max-turns` raised to 120.

### Added

- **Caveats.** On an assumption about approach, scope or place the bot makes the
  change anyway and records a `Kanttekening: <reason>` line in the commit body.
  `orbit-feedback pr-body` reads those and renders a "Kanttekeningen" section, so
  every consumer gets them without workflow glue.
- **Stale-claim self-healing.** Both workflows call `status --stale 6h` at the
  start, releasing `In behandeling` points older than the cutoff back to `Open`,
  so a cancelled or hard-killed run's leaked claims recover on their own. The
  on-failure release is kept.

### Fixed

- **The feedback branch is never cleaned up.** The process workflow pushes with
  `--force-with-lease` (with a fetched baseline) so a stale same-day branch is
  overwritten safely, and the sync workflow deletes the branch when its PR merges.
- **Partial / max-turns runs.** Commits are counted in their own step gated on
  `!cancelled()`, so commits from a failed Claude step still become a PR; only
  actually-committed points go to `In review`, the rest back to `Open`.

## 3.1.1

### Fixed

`orbit-feedback init` templates, from bugs hit on a fresh setup in a Next.js
client project:

- **`npm ci` 401/403.** Both workflows only set `NODE_AUTH_TOKEN`, so a project
  `.npmrc` that authenticates `npm.pkg.github.com` via `${NPM_TOKEN}` got an empty
  token. The install step now also sets `NPM_TOKEN`. Documented that `GITHUB_TOKEN`
  only works when the repo has read access to the package (package "Manage Actions
  access" / Internal visibility); otherwise `ORBIT_NPM_TOKEN` (a PAT with
  `read:packages`) is required.
- **`git push` "Invalid username or token".** `anthropics/claude-code-action`
  mints its own GitHub App token via OIDC and revokes it when its step ends, so
  the following push failed. The action is now passed an explicit `github_token`.
- **`gh pr create` "label 'orbit-feedback' not found".** The label is now created
  idempotently (`gh label create ... --force`) before the PR is opened.
- **`gh pr create` "GitHub Actions is not permitted to create or approve pull
  requests".** Documented the required "Allow GitHub Actions to create and approve
  pull requests" setting (or `ORBIT_GH_TOKEN`); `init --check` now verifies it via
  `repos/{owner}/{repo}/actions/permissions/workflow`.
- **Re-run on the same day.** A leftover `feedback/<date>` branch from a failed
  run blocked the push; it is now pushed with `--force-with-lease` on that
  bot-owned branch.
- **Every point skipped.** When Claude changes nothing, the branch has no commits
  and "No commits between main and feedback/<date>" failed the run. The step now
  counts commits against the default branch first; with zero it skips the push and
  PR and releases every point back to `Open` with its skip reason as the answer.
- **Unreadable skip reasons.** `claude-code-action` hides its output, so `.orbit/`
  (manifest, results, PR body) is now uploaded as a run artifact
  (`actions/upload-artifact@v4`, `if: always()`, `include-hidden-files: true`,
  14-day retention).
- **`orbit-feedback sync` "ambiguous argument 'main..HEAD'".** A CI checkout of
  the feedback branch has no local base branch, only `origin/main`. The base is
  now resolved to `origin/<base>` (from the PR body's `base=` marker) before the
  `git log` range, with a regression test covering a checkout that lacks a local
  base branch.

## 3.1.0

### Added

- **Feedback → PR automation.** An `orbit-feedback` CLI (`fetch` / `status` /
  `pr-body` / `sync` / `init`) that turns client feedback in Notion into a
  reviewable pull request: one branch per run, one commit per feedback point,
  and a PR checklist where reviewers reject a point by unchecking it (its commit
  is reverted and the point goes to `Afgewezen`; on merge checked points go to
  `Opgelost`). Runs from a GitHub Action (scheduled + manual) or a local Claude
  Code skill; `orbit-feedback init` scaffolds both into a consuming project.
- Builds on the existing Notion schema — `Project` relation (`NOTION_PROJECT_ID`)
  and `Status` select — adding the statuses `In review` / `Afgewezen` and reading
  `Component` / `Bron` / `PR` when present.

This release is additive: the annotation/feedback library and its API are
unchanged, so upgrading from 3.0.x only adds the new CLI.

## 3.0.0

- Rebrand to Orbit (`@strakzat/orbit`) and a UI rebuild in a Geist/Vercel style,
  with inline styles replaced by a prefixed stylesheet and design tokens.
