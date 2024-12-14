#! /usr/bin/env node

import { Command } from "commander"
import prompts, { type InitialReturnValue } from "prompts"
import { basename, resolve } from "node:path"
import { blue, bold, cyan, green, red, yellow } from "picocolors"
import { existsSync } from "node:fs"

import { getPkgManager } from "./get-pkg-manager"

import packageJson from "../package.json"
import { validateNpmName } from "./validate-project-name"
import { createApp } from "./create-app"

process.on("SIGINT", () => void process.exit(0))
process.on("SIGTERM", () => void process.exit(0))

const onPromptState = (state: {
  value: InitialReturnValue
  aborted: boolean
  exited: boolean
}) => {
  if (state.aborted) {
    process.stdout.write("\x1B[?25h")
    process.stdout.write("\n")
    process.exit(1)
  }
}

const program = new Command(packageJson.name)
  .version(
    packageJson.version,
    "-v, --version",
    `Output the current version of ${packageJson.name}.`,
  )
  .argument("[directory]")
  .usage("[directory] [options]")
  .helpOption("-h, --help", "Display the help message.")
  .option(
    "--use-npm",
    "Explicitly tell the CLI to bootstrap the application using npm.",
  )
  .option(
    "--use-pnpm",
    "Explicitly tell the CLI to bootstrap the application using pnpm.",
  )
  .option(
    "--use-yarn",
    "Explicitly tell the CLI to bootstrap the application using Yarn.",
  )
  .option(
    "--use-bun",
    "Explicitly tell the CLI to bootstrap the application using Bun.",
  )
  .option(
    "--skip-install",
    "Explicitly tell the CLI to skip installing packages.",
  )
  .option("--disable-git", `Skip initializing a git repository.`)
  .parse(process.argv)

const opts = program.opts()
const { args } = program

const packageManager = getPkgManager(opts)

async function run() {
  console.log(`[packageManager]: ${packageManager}`)

  let projectPath = args[0]?.trim() ?? null

  if (!projectPath) {
    const { path } = await prompts({
      onState: onPromptState,
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: "my-app",
      validate: (name) => validateNpmName(basename(resolve(name))),
    })

    if (typeof path === "string") projectPath = path.trim()
  }

  const appPath = resolve(projectPath)
  const appName = basename(appPath)

  const isValidNpmName = validateNpmName(appName)

  if (!isValidNpmName) {
    console.error(
      `Could not create a project called ${red(
        `"${appName}"`,
      )} because of npm naming restrictions:`,
    )

    process.exit(1)
  }

  if (existsSync(appPath)) process.exit(1)

  await createApp({
    appPath,
    packageManager,
    skipInstall: opts.skipInstall,
    disableGit: opts.disableGit,
  })
}

run().catch((err) => {
  console.log()
  console.log("Aborting installation.")
  if (err instanceof Error) {
    console.log(`  ${cyan(err.message)}.`)
  } else {
    console.log(red("Unexpected error:") + "\n", err)
  }
  process.exit(1)
})
