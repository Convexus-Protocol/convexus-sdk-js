<p align="center">
  <img 
    src="https://i.imgur.com/qqIPMGE.png" 
    alt="Convexus logo">
</p>

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# 📖 **Introduction**

An SDK for building applications on top of Convexus

# 🏗️ Build

```bash
$ yarn reset
$ yarn bootstrap
$ # It should be OK! Try if everything works properly
$ yarn demo
```

## ⚙️ Commands

`yarn bootstrap`
Installs Lerna, all dependencies and links packages within the repo as needed

`yarn reset`
Deletes all buid artifacts, node_modules and runs bootstrap

`yarn test`
Runs tests in all packages

`yarn build`
Cleans all build artifacts and runs build in all packages

`yarn build:watch`
Watch mode of the above

`yarn cleanup`
Cleans build artifacts

`yarn demo`
Runs the demo app (delete this command if you don't want to use a demo app)

`yarn lint`
Runs npm lint the whole repository

`yarn publish`
Rebuilds all packages and starts Lerna's publish wizard (remove the --skip-npm --skip-git arguments as needed)
