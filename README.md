## Repository State

The feature-set for angular2-slickgrid is incomplete. If there are missing features you would like, please submit an issue and/or create a pull request implementing the feature. 

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
Install gulp-cli
```bash
[sudo] npm install gulp-cli -g
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

## Examples 
Example applications using this component can be found in the examples folder. To run the examples,
run `gulp compile:examples` (running `gulp build` will also compile the examples) then run `gulp serve`. This will launch a static server at the root of the project.
Navigate a browser to `http://localhost:{port}/dist/{exampleName}` e.g `http://localhost:8080/dist/basic_application`.


## Contributing
Because this project is meant to be used as an npm module, compiled files are checked into the repo. Before commiting run `gulp publish` (compiles
everything except the examples). This should be removed once/if this is added to the npm registry.
