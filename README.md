gammalatex
==========
[![NPM][NPM1]][NPM2]

A simple latex wrapper for the `pdflatex` binary.

You don't have to worry about rerunning `pdflatex` in order to get the cross-references right.

#### Prerequisites
You must have `pdflatex` installed (or another LaTeX command, see `setCompileCommand` below).

**Linux**: `sudo yum install texlive-latex`

**Mac OS**: [MacTeX](http://tug.org/mactex/)

#### Installation

```bash
npm install --save gammalatex
```

Then `var latex = require("gammalatex");` on any node.js file.

#### API

- **.parse(string, callbackFunction)**  
	*string*: String containing valid latex syntax  
	*callbackFunction*: A function that will be called after parsing your string. Signature: *callbackFunction(err, readStream)*

- **.setPreParseHook(callbackFunction)**  
	*callbackFunction*: A function that will be called **before** running `pdflatex`. Signature: *callbackFunction(params, cb)*

- **.setPostParseHook(callbackFunction)**  
	*callbackFunction*: A function that will be called **after** running `pdflatex`. Signature: *callbackFunction(params, cb)*

- **.addRerunIndicator(string)**  
	*string*: A string to check against `pdflatex` log output to determine whether `pdflatex` must be rerun.

- **.setCompileCommand(object)**  
	*object*: An object with one mandatory field: `command` gives the name of the latex command, for example `'pdflatex'`, `'xelatex'`, etc.  An optional `options` field gives an array of additional command-line options.  An optional `texpath` field gives a value for the `TEXINPUTS` environment variable, used to specify additional search paths for latex files and packages.  An optional `tmpdir` field gives a path for a temporary working directory.

#### Usage
```javascript
var 
	util = require("util"),
	latex = require("gammalatex"),
	fs = require("fs");

var string = [
              "\\documentclass{article}",
              "\\begin{document}",
              "Gammasoft Desenvolvimento de Software Ltda",
              "\\end{document}"
              ].join("\n");

latex.parse(string, function(err, readStream){
	if(err) throw err;
	
	var writeStream = fs.createWriteStream("output.pdf");
	util.pump(readStream, writeStream);
});
```

**See a full example [here](https://github.com/gammasoft/latex/blob/master/example.js).**

### License

MIT License

[NPM1]: https://nodei.co/npm/gammalatex.png
[NPM2]: https://nodei.co/npm/gammalatex/
