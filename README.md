latex
=====

A simple latex wrapper for the `pdflatex` binary.

You don't have to worry about rerunning `pdflatex` in order to get the cross-references right.

#### Installation

```bash
npm install --save gammalatex
```

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

latex(string, function(err, readStream){
	if(err) throw err;
	
	var writeStream = fs.createWriteStream("output.pdf");
	util.pump(readStream, writeStream);
});
```

### MIT License
