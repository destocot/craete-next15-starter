import validateProjectName from "validate-npm-package-name"

export function validateNpmName(name: string) {
  return validateProjectName(name).validForNewPackages
}
