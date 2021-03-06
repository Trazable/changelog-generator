const path = require('path')
const readPkg = require('read-pkg')
const { changelogTemplate, previewTemplate } = require('./templates')

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

/**
 * @typedef Config
 * @property {string} changelogPath path where is the changelog file to fill
 * @property {string} repoUrl
 * @property {string} changelogHeader
 * @property {(changelog: Changelog) => string} changelogTemplate
 * @property {(changelog: Changelog) => string} previewTemplate
 */

/**
 * Load the configuration
 *
 * @returns {Promise<Config>}
 */
module.exports = async () => {
  const packageJson = await readPkg()

  return {
    changelogPath: path.resolve(process.cwd(), './CHANGELOG.md'),
    repoUrl: packageJson.repository.url,
    changelogHeader: '',
    changelogTemplate,
    previewTemplate,
  }
}
