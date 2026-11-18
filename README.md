# lacaude-Mobile

A **BYOK** (bring your own key) mobile client that reimplements the core
conversation experience of the Claude Android app, built from REA
(reverse-engineering analysis) of the shipped APK.

> **Not affiliated with Anthropic.** "Claude" is a trademark of Anthropic PBC.
> This project does not ship Anthropic's proprietary code, brand assets, or
> logos. It is an independent, source-available interoperability client that
> talks to the public Anthropic API using a key **you** provide.

## Why BYOK

The official app authenticates against an Anthropic account. This client
instead uses an Anthropic **API key** that you supply, so it can run without
account-based auth and as a self-hostable/experiment-friendly client.

## Status

- [ ] Target artifact acquired and verified (signature + hashes)
- [ ] Structure inventory (components, screens, navigation, design tokens)
- [ ] Protocol/data-model inventory
- [ ] Core: chat send/receive against the Messages API
- [ ] Persistence: local conversation store
- [ ] Polish: styling parity from measured tokens

## Method

Every structural/visual claim is derived from the analyzed artifact and cited
with an evidence id under `analysis/`. Where a value cannot be measured it is
marked as an inference, not presented as fact.

## Repo layout

```
artifacts/   analyzed target + tool binaries (git-ignored, not redistributed)
analysis/    REA evidence, extract notes, design-token measurements
app/         the client implementation
```
