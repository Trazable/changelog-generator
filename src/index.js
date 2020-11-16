/* eslint-disable no-console */
const readConfig = require('./read-config')
const {
  getCurrentBranch,
  getLastTag,
  isBranchRelease,
  isBranchHotfix,
  getNextVersion,
  getAllCommits,
  writeChangelog,
  updatePackageVersion,
  commitBump,
} = require('./utils')

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
 * @typedef Changelog
 * @property {string} header
 * @property {string} host
 * @property {string} repository
 * @property {string} repoUrl
 * @property {string} version
 * @property {string} date
 * @property {Commit[]} merges
 * @property {Commit[]} bugfixs
 */

const ChangelogGenerator = async () => {
  try {
    // Load the module configuration
    const config = await readConfig()

    // Get current branch
    const currentBranch = await getCurrentBranch()
    console.log('currentBranch :>>', currentBranch)

    // Get the latest tag generated
    const lastTag = await getLastTag()
    console.log('lastTag :>>', lastTag)

    // Get all commits from the latest tag to the current branch through develop
    const commitsAll = await getAllCommits(lastTag, currentBranch)

    // Get all commits at current branch
    const commitsRelease = await getAllCommits('develop', currentBranch)

    // Get the next version tag to use depending the commits since the last tag
    const nextVersionTag = await getNextVersion(lastTag)
    console.log('nextVersionTag :>>', nextVersionTag)

    /**
     * @type {Changelog}
     */
    const changelog = {
      header: config.changelogHeader,
      repoUrl: config.repoUrl,
      version: nextVersionTag,
      date: new Date().toISOString().slice(0, 10),
      merges: commitsAll.filter(
        (commit) => commit.type && commit.type === 'merge'
      ),
      features: commitsAll.filter((commit) => commit.type && commit.type === 'feat'),
      release: commitsRelease,
      bugfixs: [
        ...commitsAll.filter((commit) => commit.type && commit.type === 'fix'),
        ...commitsRelease.filter(
          (commit) => commit.type && commit.type === 'fix'
        ),
      ].filter(
        (commit, index, self) =>
          index === self.findIndex((c) => c.hash === commit.hash)
      ),
    }


    // This generation only works if the current branch is a release or hotfix otherwise only show a preview
    if (!isBranchRelease(currentBranch) && !isBranchHotfix(currentBranch)) {
      // Update the changelog file
      await writeChangelog(config.changelogPath, config.changelogTemplate, changelog)
      // Update the version in package and package-lock
      await updatePackageVersion(nextVersionTag)
      // Commit the bump version
      console.log('Commiting...')
      await commitBump(nextVersionTag)
    } else {
      console.log(config.previewTemplate(changelog))
    }
  } catch (error) {
    console.error(error)
  }
}

module.exports = ChangelogGenerator
