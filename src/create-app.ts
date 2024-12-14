import { basename, dirname, join, resolve } from "node:path"
import { existsSync, mkdirSync } from "node:fs"
import { green, cyan } from "picocolors"

import { PackageManager } from "./get-pkg-manager"
import { isWriteable } from "./is-writeable"
import { getOnline } from "./is-online"
import { downloadAndExtractRepo } from "./download-and-extract-repo"
import { install } from "./install"
import { removeGit, tryGitInit } from "./try-git-init"

export async function createApp({
  appPath,
  packageManager,
  skipInstall,
  disableGit,
}: {
  appPath: string
  packageManager: PackageManager
  skipInstall: boolean
  disableGit: boolean
}) {
  const repoUrl = "https://github.com/destocot/next15-starter/tree/main"

  const root = resolve(appPath)

  if (!(await isWriteable(dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again.",
    )
    console.error(
      "It is likely you do not have write permissions for this folder.",
    )
    process.exit(1)
  }

  const appName = basename(root)

  console.log(`[appName]: ${appName}`)

  mkdirSync(root, { recursive: true })

  const useYarn = packageManager === "yarn"
  const isOnline = !useYarn || (await getOnline())
  const originalDirectory = process.cwd()

  console.log(`Creating a new Next 15 starter app in ${green(root)}.`)
  console.log()

  process.chdir(root)

  const packageJsonPath = join(root, "package.json")
  let hasPackageJson = false

  await downloadAndExtractRepo(root, repoUrl)

  hasPackageJson = existsSync(packageJsonPath)

  if (!skipInstall && hasPackageJson) {
    console.log("Installing packages. This might take a couple of minutes.")
    console.log()

    await install(packageManager, isOnline)
    console.log()
  }

  removeGit(root)

  if (disableGit) {
    console.log("Skipping git initialization.")
    console.log()
  } else if (tryGitInit(root)) {
    console.log("Initialized a git repository.")
    console.log()
  }

  let cdpath: string
  if (join(originalDirectory, appName) === appPath) {
    cdpath = appName
  } else {
    cdpath = appPath
  }

  console.log(`${green("Success!")} Created ${appName} at ${appPath}`)

  if (hasPackageJson) {
    console.log("We suggest that you begin by typing:")
    console.log()
    console.log(cyan("  cd"), cdpath)
    console.log(`  ${cyan(`${packageManager} ${useYarn ? "" : "run "}dev`)}`)
  }
  console.log()
}
