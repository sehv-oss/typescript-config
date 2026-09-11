# @sehv-oss/typescript-config

Shared TypeScript configurations for Node.js/web libraries and applications.

These presets target **TypeScript 7 or newer**. TypeScript 6.0 turned `strict`, `module: esnext`, `target: es2025` and `types: []` into defaults, so the presets only carry what actually differs from a stock configuration.

## Installation

```bash
# npm
npm install --save-dev @sehv-oss/typescript-config typescript

# pnpm
pnpm add --dev @sehv-oss/typescript-config typescript

# yarn
yarn add --dev @sehv-oss/typescript-config typescript
```

The `node/*` presets set `types: ["node"]`, so add `@types/node` alongside them.

## Usage

Extend a preset from your own `tsconfig.json`:

```jsonc
{
  "extends": "@sehv-oss/typescript-config/node/app",
  "include": ["src"],
}
```

## Presets

| Preset     | Environment | Emits             | Produces the shipped artifact  |
| ---------- | ----------- | ----------------- | ------------------------------ |
| `node/lib` | Node.js     | JS + declarations | `tsc`, with no bundler at all  |
| `node/app` | Node.js     | nothing           | nobody — Node runs the sources |
| `node/cli` | Node.js     | JS only           | `tsc`                          |
| `web/lib`  | Browser     | nothing           | your bundler                   |
| `web/app`  | Browser     | nothing           | Vite, Next.js, and the like    |

`tsc` is a type checker and a compiler, not a bundler. It has no tree shaking, no minification, no bundled declarations and no dual ESM/CJS output. So `node/lib` and `node/cli` are the presets where `tsc` alone is genuinely enough; anything targeting a browser still needs a bundler, and the preset only type checks.

### Composable layers

These carry no environment of their own. Combine them using an array, where later entries win:

| Layer             | Adds                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `layer/react`     | `jsx: react-jsx`                                                    |
| `layer/composite` | `composite`, `incremental` and declarations, for project references |
| `layer/test`      | Vitest types, and relaxes the unused-symbol checks                  |

```jsonc
{
  "extends": [
    "@sehv-oss/typescript-config/web/app",
    "@sehv-oss/typescript-config/layer/react",
  ],
  "include": ["src"],
}
```

The building blocks the presets are made of — `base`, `node/base` and `web/base` — are exported too, for cases none of the presets fit.

### Libraries must set their own output paths

Relative paths inside a shared configuration resolve against the file that declares them, not against the `tsconfig.json` that extends it. A published preset therefore cannot set `rootDir` or `outDir` for you — it would point them inside `node_modules`. Declare them yourself:

```jsonc
{
  "extends": "@sehv-oss/typescript-config/node/lib",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
  },
  "include": ["src"],
}
```

## Two conventions worth knowing

### Relative imports carry the `.ts` extension

`base` enables `allowImportingTsExtensions` together with `rewriteRelativeImportExtensions`, so you write the extension of the file that actually exists:

```ts
import { greet } from './util.ts';
```

The same source then runs directly under Node **and** compiles, with `tsc` rewriting the specifier to `./util.js` on the way out. Without this, `module: nodenext` would force you to write `./util.js` for a file named `util.ts`, and would stop the sources from running directly.

### Only erasable syntax is allowed

`base` enables `erasableSyntaxOnly`, which rejects `enum`, `namespace` and constructor parameter properties — the TypeScript-only constructs that no type stripper can erase. Avoiding them is what keeps your code runnable by Node's native type stripping, and by esbuild, oxc, or anything else that strips rather than compiles.

Use `enum` in a Node application and you get:

```
error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

Projects that need decorators with parameter properties, NestJS being the usual case, can opt back out:

```jsonc
{
  "extends": "@sehv-oss/typescript-config/node/app",
  "compilerOptions": {
    "erasableSyntaxOnly": false,
  },
}
```

## Running Node applications without a build step

`node/app` sets `noEmit`, which makes `tsc` a pure type checker. Node runs the TypeScript sources as they are:

```bash
node src/index.ts    # requires Node.js 24.12 or newer
tsc --noEmit         # type checking, as a separate concern
```

## Maintenance notes

`web/base` pins `lib` to a specific ECMAScript year. TypeScript's default `target` follows the current year, so both need to move together when a new one lands.

Every entry in `exports` must point at the file sitting at the identical path, minus the `.json` extension — `"./node/app"` to `"./node/app.json"`, never to somewhere else. Remapping a subpath to a different path breaks [`extends` navigation in VS Code](https://github.com/microsoft/vscode/issues/276592) and hides the file from resolvers that ignore `exports`. Nothing enforces this automatically, so check it by hand when adding a preset.

## License

[ISC](LICENSE)
