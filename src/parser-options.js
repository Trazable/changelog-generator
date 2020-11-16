const conventionalCommitsParser = require('conventional-commits-parser') // eslint-disable-line no-unused-vars

/**
 * Custom conventional commits Parser options
 *
 * @type {conventionalCommitsParser.Options}
 */
module.exports = {
  headerPattern: /^(.{7}).?(\w*)(?:\((.*)\))?!?: (.*)$/,
  breakingHeaderPattern: /^(.{7}).?(\w*)(?:\((.*)\))?!: (.*)$/,
  headerCorrespondence: ['hash', 'type', 'scope', 'subject'],
  noteKeywords: ['BREAKING CHANGE'],
  revertPattern: /^(?:revert|revert:)\s"?([\S\s]+?)"?\s*this reverts commit (\w*)\./i,
  revertCorrespondence: ['header', 'hash'],
  issuePrefixes: ['#'],
}
