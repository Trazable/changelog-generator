const { promisify } = require('util')
const { exec } = require('child_process')
const semver = require('semver')
const conventionalCommitsParser = require('conventional-commits-parser')
const path = require('path')
const parserOptions = require('./parser-options')
const gitRawCommits = require('git-raw-commits')
const execAsync = promisify(exec)
const { readFile, writeFile, appendFile, access } = require('fs/promises')
const {
  constants: { F_OK },
} = require('fs')

/**
 * @typedef Commit
 * @property {string} hash
 * @property {string | null} type
 * @property {string | null} scope
 * @property {string | null} subject
 * @property {string | null} header
 * @property {string | null} body
 */

/**
 * @name getCurrentBranch
 * @description Get the current git branch name
 * @async
 *
 * @returns {Promise<string>} the current branch name
 */
exports.getCurrentBranch = async () => {
  const { stdout: currentBranch } = await execAsync(
    'git rev-parse --abbrev-ref HEAD'
  )
  return currentBranch.trim()
}

/**
 * @name isBranchRelease
 * @description check if the branch name is a release branch
 *
 * @param {string} branchName
 * @returns {boolean}
 */
exports.isBranchRelease = (branchName) => {
  return branchName.startsWith('release/')
}

/**
 * @name isBranchHotfix
 * @description check if the branch name is a hotfix branch
 *
 * @param {string} branchName
 * @returns {boolean}
 */
exports.isBranchHotfix = (branchName) => {
  return branchName.startsWith('hotfix/')
}

/**
 * @name isBranchDevelop
 * @description check if the branch name is a develop branch
 *
 * @param {string} branchName
 * @returns {boolean}
 */
exports.isBranchDevelop = (branchName) => {
  return branchName === 'develop'
}

/**
 * @name checkIsPatch
 * @description check if the commit do a Patch version change
 *
 * @param {Commit} commit
 * @returns {boolean}
 */
exports.checkIsPatch = ({ type }) => {
  return type && type === 'fix'
}

/**
 * @name checkIsMinor
 * @description check if the commit do a minor version change
 *
 * @param {Commit} commit
 * @returns {boolean}
 */
exports.checkIsMinor = ({ type }) => {
  return type && type === 'feat'
}

/**
 * @name checkIsMinor
 * @description check if the commit do a mayor version change
 *
 * @param {Commit} commit
 * @returns {boolean}
 */
exports.checkIsMayor = ({ type, body }) => {
  return (
    (type && type.includes('!')) ||
    (body &&
      body.split('\n').some((bodyLine) => bodyLine.includes('BREAKING_CHANGE')))
  )
}

/**
 * @name getNextVersion
 * @description knowing the latest tag read all commits since tag to know the next version following the semver standard
 *
 * @param {string} lastTag
 * @param {string} currentBranch
 * @returns {Promise<string>}
 */
exports.getNextVersion = async (lastTag, currentBranch) => {
  const commits = await this.getAllCommits(lastTag, currentBranch)

  if (this.isBranchHotfix(currentBranch)) {
    // If the current branch is a hotfix increment a path version
    return commits.some((commit) => this.checkIsPatch(commit))
      ? semver.inc(lastTag, 'patch')
      : lastTag
  } else if (
    this.isBranchDevelop(currentBranch) ||
    this.isBranchRelease(currentBranch)
  ) {
    // If the current branch is a Release or Develop without commits don't increment version
    if (commits.length === 0) return lastTag

    // If the current branch is a Release or Develop with commits check commits but increment a minor by default
    return commits.some((commit) => this.checkIsMayor(commit))
      ? semver.inc(lastTag, 'major')
      : semver.inc(lastTag, 'minor')
  }
}

/**
 * @name getLastTag
 * @description Get the latest git tag created
 *
 * @returns {Promise<string>}
 */
exports.getLastTag = async () => {
  const { stdout: tagsList } = await execAsync('git tag --sort=-"v:refname"')
  return tagsList.split('\n')[0]
}

/**
 * @name getAllCommits
 * @description Get all commits in a range
 *
 * @param {string} from
 * @param {string} to
 *
 * @returns {Promise<Commit[]>}
 */
exports.getAllCommits = async (from, to) => {
  return new Promise((resolve, reject) => {
    const commits = []

    gitRawCommits({ from, to, format: '%h %B' })
      .pipe(conventionalCommitsParser(parserOptions))
      .on('data', (commit) => commits.push(commit))
      .on('error', reject)
      .once('end', () =>
        resolve(
          commits
            .map((commit) => {
              if (
                commit.header &&
                commit.header.includes("Merge branch 'feature/")
              ) {
                commit.hash = commit.header.slice(0, 7)
                commit.type = 'merge'
                commit.subject = commit.header.slice(
                  22,
                  commit.header.indexOf("' into develop")
                )
              }

              return commit
            })
            .filter(({ type }) => type !== null)
        )
      )
      .resume()
  })
}

/**
 * Write the new Changelog info
 *
 * @param {string} changelogPath
 * @param {() => string} template
 * @param {import('./template').Changelog} changelog
 * @returns {Promise<void>}
 */
exports.writeChangelog = async (changelogPath, template, changelog) => {
  try {
    // Check if the changelog exist
    await access(changelogPath, F_OK)

    // Read the current changelog content
    const currectContent = await readFile(changelogPath)

    // Write the new changelog info and append the old content
    await writeFile(changelogPath, template(changelog))
    await appendFile(changelogPath, currectContent)
  } catch {
    // Createe the file and write the new changelog info
    await writeFile(changelogPath, template(changelog))
  }
}

/**
 * Update the version specified in package and package-lock
 *
 * @param {string} version
 * @returns {Promise<void>}
 */
exports.updatePackageVersion = async (version) => {
  const cwd = process.cwd()
  const packagePath = path.resolve(cwd, 'package.json')
  const packageLockPath = path.resolve(cwd, 'package-lock.json')

  const package_ = await readFile(packagePath, 'utf-8')
  const packageLock = await readFile(packageLockPath, 'utf-8')

  await writeFile(
    packagePath,
    `${JSON.stringify(
      {
        ...JSON.parse(package_),
        version,
      },
      undefined,
      2
    )}\n`
  )
  await writeFile(
    packageLockPath,
    `${JSON.stringify(
      {
        ...JSON.parse(packageLock),
        version,
      },
      undefined,
      2
    )}\n`
  )
}

/**
 * Commit the CHANGELOG and package to commit the bump version
 *
 * @param {string} version
 * @returns {Promise<void>}
 */
exports.commitBump = async (version) => {
  // Add changes to git index
  await execAsync(
    'git add -A CHANGELOG.md package.json package-lock.json'
  )

  // Commit with a bump messaage
  await execAsync(
    `git commit -m "chore(release): bump version to ${version}"`
  )
}
