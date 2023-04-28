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
$ yarn clean
$ yarn install
$ yarn bootstrap
$ # Run tests if you want to test the code
$ yarn test
$ # If you want to cleanup everything built, run this command
$ yarn clean
``` 

## ⚙️ Commands

`yarn bootstrap`
Installs Lerna, all dependencies and links packages within the repo as needed

`yarn install`
Runs build in all packages

`yarn test`
Runs tests in all packages

`yarn clean`
Cleans everything

`yarn run publish`
Publish packages to npm package registry

## ⚙️ Browser

Make sure that your `tsconfig.json` file on frontend (Angular, React..) has `"ESNext"` in `"lib"` list!
