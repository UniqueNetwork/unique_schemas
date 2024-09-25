const config = {
  hooks: {
    "before:init": ["npm run testrun"],
    // "after:my-plugin:bump": "./bin/my-script.sh",
    "after:bump": "npm run build",
    "after:git:release": "echo After git push, before github release",
    "after:release": "echo Successfully released ${name} v${version}."
  },
  npm: {
    publishConfig: {
      access: "public",
    },
    publishPath: "./dist",
    tag: "v0",
  },
  git: {
    requireCleanWorkingDir: false,
    changelog: 'git log --pretty=format:"* %s (%h)" ${from}...${to}',
    commitMessage: 'chore: release v${version}',
    // requireBranch: 'master',
    tagName: "v${version}",
  },
  github: {
    release: false,
    releaseName: "Release v${version}",
    preRelease: true,
    autoGenerate: true,
    tokenRef: "GITHUB_TOKEN",
    assets: ["dist/unique_schemas.min.js"],
  },
}

module.exports = config
