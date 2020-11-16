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
 * @property {Commit[]} features
 */

/**
 *
 * @param {Changelog} changelog
 */
exports.changelogTemplate = ({
  header,
  repoUrl,
  version,
  date,
  merges,
  release,
  bugfixs,
}) =>
  `${header}
## ${version} (${date})

### Release commits

${release
  .map(
    ({ type, scope, subject, hash }) =>
      `* **${type} ${
        scope ? `- ${scope}` : ''
      }**: ${subject} ([${hash}](${repoUrl}/commit/${hash}))  \n`
  )
  .join('')}


### Features Merged

${merges
  .map(
    ({ subject, hash }) =>
      `* ${subject} ([${hash}](${repoUrl}/commit/${hash}))  \n`
  )
  .join('')}


### Bug Fixes

${bugfixs
  .map(
    ({ scope, subject, hash }) =>
      `* ${
        scope ? `**${scope}**:` : ''
      } ${subject} ([${hash}](${repoUrl}/commit/${hash}))  \n`
  )
  .join('')}

___
`

/**
 *
 * @param {Changelog} changelog
 */
exports.previewTemplate = ({ merges, features, bugfixs }) => `

### Features Merged
${merges.map(({ subject, hash }) => `${subject} (${hash})`).join('\n')}


### Features
${features
  .map(
    ({ scope, subject, hash }) =>
      `${scope ? `${scope} -> ` : ''}${subject} (${hash})`
  )
  .join('\n')}


### Bug Fixes
${bugfixs
  .map(
    ({ scope, subject, hash }) =>
      `${scope ? `${scope} -> ` : ''}${subject} (${hash})`
  )
  .join('\n')}

`
