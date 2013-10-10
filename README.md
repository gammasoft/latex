latex
=====

A simple latex wrapper for the `pdflatex` binary.

You don't have to worry about rerunning `pdflatex` in order to get the cross-references right.

#### Pre Requirements
You must have `pdflatex` installed. 

**Linux**: `sudo yum install textlive-latex`  
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
	*string*: A string to check against `pdflatex` log output to determine wether `pdflatex` must be reran.	

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

**See a full example [here](https://github.com/gammasoft/latex/blob/master/example.js)**

### MIT License
