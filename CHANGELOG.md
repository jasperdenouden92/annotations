# Changelog

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
