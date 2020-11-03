const { resolve } = require('path')
const readPkg = require('read-pkg')
const defaultTemplate = require('./template')

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
 * @property {Changelog => string} template
 */

/**
 * Load the configuration
 *
 * @returns {Promise<Config>}
 */
module.exports = async () => {
  const packageJson = await readPkg()

  return {
    changelogPath: resolve(process.cwd(), './CHANGELOG.md'),
    repoUrl: packageJson.repository.url,
    changelogHeader: '',
    template: defaultTemplate,
  }
}
