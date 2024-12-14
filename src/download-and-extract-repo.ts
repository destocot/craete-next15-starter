import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { sep, posix } from "node:path"
import { x } from "tar"

async function downloadTarStream(url: string) {
  const res = await fetch(url)

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`)
  }

  return Readable.fromWeb(res.body as import("stream/web").ReadableStream)
}

export async function downloadAndExtractRepo(root: string, repoUrl: string) {
  const [username, name, branch] = repoUrl
    .replace("https://github.com/", "")
    .replace("/tree/", "/")
    .split("/")

  const filePath =
    repoUrl.split("/tree/")[1]?.split("/").slice(1).join("/") || ""

  let rootPath: string | null = null
  await pipeline(
    await downloadTarStream(
      `https://codeload.github.com/${username}/${name}/tar.gz/${branch}`,
    ),
    x({
      cwd: root,
      strip: filePath ? filePath.split("/").length + 1 : 1,
      filter: (p: string) => {
        // Convert Windows path separators to POSIX style
        const posixPath = p.split(sep).join(posix.sep)

        // Determine the unpacked root path dynamically instead of hardcoding to the fetched repo's name / branch.
        // This avoids the condition when the repository has been renamed, and the old repository name is used to fetch the example.
        // The tar download will work as it is redirected automatically, but the root directory of the extracted
        // example will be the new, renamed name instead of the name used to fetch the example, breaking the filter.
        if (rootPath === null) {
          const pathSegments = posixPath.split(posix.sep)
          rootPath = pathSegments.length ? pathSegments[0] : null
        }

        return posixPath.startsWith(
          `${rootPath}${filePath ? `/${filePath}/` : "/"}`,
        )
      },
    }),
  )
}
