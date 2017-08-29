# webchurch [![Build Status](https://travis-ci.org/probmods/webchurch.svg?branch=master)](https://travis-ci.org/probmods/webchurch)

## Install

### Dependencies
- [nodejs](http://nodejs.org/download/) v0.10.26 (see `package.json` for npm dependencies). Some people have reported that v0.10.28 doesn't work but that switching to v0.10.26 does
- Python (on Windows; version must be > 2.5 and < 3.0)

### Installing with git (preferred method)

In a terminal, go to wherever you want your webchurch folder to live and run:

```sh
git clone https://github.com/probmods/webchurch.git
cd webchurch
git init ## only if you are on Windows
git submodule update --init --recursive
npm install
./compile.sh
```

Note that you only need to run `git init` on Windows.

To pull-in and work in a particular branch (say `box2d`):

lists all branches, local and remote to see what `box2d` is called on remote

    git branch -a

setup local branch box2d to track remote branch box2d

    git branch -b box2d remote/origin/box2d

switch to branch box2d

	git checkout box2d

### Installing without git

(not good for getting updates, but useful if you can't/don't want to get git installed)

1. Download the [webchurch ZIP](https://github.com/probmods/webchurch/archive/master.zip)
2. Unarchive the zip file and go to that directory (called `webchurch-master`)
3. Download [probabilistic-js](https://github.com/dritchie/probabilistic-js/archive/0881cd5bf2607750ede273e0408b1e957487b5e1.zip), unarchive this file, rename it to `probabilistic-js`, and move it into the `webchurch-master` folder (replacing the folder that's already there)
4. In terminal, go to `webchurch-master` folder and run the following commands:

        npm install
        ./compile.sh

### Making `church` a global command

If you want to be able to call `church` from anywhere on the command line, this is what you would do:

1. If you don't alreay have a directory `~/bin`, make that directory.
2. Add a symbolic link to the church executable:

		ln -s path/to/webchurch/church ~/bin/
		
3. If you don't already have a file called `~/.bash_profile`, make that file
4. Open that file and add the line:

		export PATH=$PATH:~/bin

5. Re-open your terminal or `source ~/.bash_profile`

Now you can use the command `church` from any directory.

## Usage

### In a web browser
Open `online/index.html`. If you wish to use the `load` builtin for dynamically loading Church or Javascript libraries, you will need to access this page from the `http://` protocol rather than the `file://` protocol. We provide a simple way to do this. First, run `npm run-script server` on the command line and then point your browser to `http://localhost:8080/online/index.html`

### On the command line
`church [OPTIONS] [FILE]` will run the contents of `[FILE]`.

Available options:

- `-p, --precompile`: Turn on pre-compilation (very experimental)
- `-a, --program-args [MESSAGE]`: Arguments to pass to program. MESSAGE is sent to Church is the `argstring` variable.
- `-s, --seed [SEED]`: Set the seed for the random number generator.
- `-t, --timed`: Print out timing information.
- `-d, --desugar-only`: Apply Church desugaring without execution.
- `-c, --compile-only`: Compile to Javascript without execution.
- `-e, --disable-church-errors`: Disable special Church error checking and show Javascript errors instead.
