# Upstream reference checkout

`cursor-plugins/` is an ignored sparse Git checkout of the authoritative
`https://github.com/cursor/plugins.git` repository. Only `pstack/` is selected.
It is review input, not installed skill content, and is excluded from npm packages.
The reviewed commit is recorded in `../upstream.lock.json`.

Recreate it from the repository root:

```bash
git clone --filter=blob:none --sparse https://github.com/cursor/plugins.git vendor/cursor-plugins
git -C vendor/cursor-plugins sparse-checkout set pstack
git -C vendor/cursor-plugins checkout 4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536
```

To inspect newer changes, fetch upstream, check out the desired revision, and
compare it with the lock. Do not overwrite protected Pi adaptations or advance
the lock before reviewing the source delta.
