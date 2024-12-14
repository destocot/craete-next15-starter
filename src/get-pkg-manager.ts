import type { OptionValues } from "commander"

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

export function getPkgManager(opts: OptionValues): PackageManager {
  const packageManager = !!opts.useNpm
    ? "npm"
    : !!opts.usePnpm
      ? "pnpm"
      : !!opts.useYarn
        ? "yarn"
        : !!opts.useBun
          ? "bun"
          : null

  if (packageManager) return packageManager

  const userAgent = process.env.npm_config_user_agent || ""

  if (userAgent.startsWith("yarn")) return "yarn"

  if (userAgent.startsWith("pnpm")) return "pnpm"

  if (userAgent.startsWith("bun")) return "bun"

  return "npm"
}
