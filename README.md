# Trazable Changelog generator

[![NPM](https://img.shields.io/badge/NPM-red)](https://www.npmjs.com/)

## Description

Trazable custom changelog generator.

## How to use

To use the generator module you must follow the next steps:

- Step 1:
  - In your new project, download the module with the next command:
  `npm install --save-dev @trazable/changelog-generator`

- Step 2:
  - Put in to your package.json the next script:

  ```json
    "scripts":{
      "changelog": "./node_modules/.bin/changelog-generator"
    }
  ```

- Step 3:
  - Before run the script you must be in branch `release/*` or `hotfix/*`

- Step 4:
  - Remember run this script only before close the branch
