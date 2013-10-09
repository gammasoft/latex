latex
=====

A simple latex wrapper for the `pdflatex` binary.

You don't have to worry about rerunning `pdflatex` in order to get the cross-references right.

#### Installation

```bash
npm install --save gammalatex
```

Then `var latex = require("gammalatex");` on any node.js file.

#### API

- **.parse(string, callbackFunction)**
	string: String containing valid latex syntax
	callbackFunction: A function that will be called after parsing your string. This function is called with the following parameters:

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

### MIT License
