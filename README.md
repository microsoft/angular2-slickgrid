## Set up Node, npm, gulp and typings

### Node and npm
**Windows and Mac OSX**: Download and install node from [nodejs.org](http://nodejs.org/)

**Linux**: Install [using package manager](https://nodejs.org/en/download/package-manager/)

From a terminal ensure at least node 5.4.1 and npm 3:
```bash
$ node -v && npm -v
v5.9.0
3.8.2
```
**Note**: To get npm version 3.8.2, you may need to update npm after installing node.  To do that:
```bash
[sudo] npm install npm -g
```

### Gulp
Install gulp
```bash
[sudo] npm install gulp -g
```
From the root of the repo, install all of the build dependencies:
```bash
[sudo] npm install --greedy
```

### Typings
#### Install Typings CLI utility
`npm install typings --global`

#### Install required typings to build this project
`typings install`

## Build project
Type `gulp build` from the command line or run build inside VSCode

