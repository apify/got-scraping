# AGENTS.md

## GitHub Actions

Workflows reference actions by version tag (`actions/checkout@v7.0.1`), never by commit SHA. [`.github/workflows/actions.lock`](.github/workflows/actions.lock) pins every tag, including those called by composite actions, to its commit. After adding or changing a `uses:` line, run `gh actions-lock` ([extension](https://github.com/github/gh-actions-lock)) and commit the lockfile. Prefer composite actions from `apify/actions` over reusable workflows from `apify/workflows`, which the lockfile can't pin.
