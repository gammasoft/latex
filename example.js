var 
	util = require("util"),
	latex = require("./app.js"),
	fs = require("fs");

//addRerunIndicator
//-----------------
//In case the version of latex you use outputs differently you are still able to identify that `pdflatex` must rerun
latex.addRerunIndicator("If the output log contains this huge string then it means that `pdflatex` must run again");

//setPreParseHook
//---------------
//example usage: 
//	- fetch resources to the temp folder:
//		* image files
//		* bib files
latex.setPreParseHook(function(params, cb){
	console.log();
	console.log([
	             "PRE PARSE HOOK",
	             "--------------",
	             "At this time a temporary folder has been created",
	             "A .tex file has been created within the temp folder",
	             "And you get some info on the first param",
	             JSON.stringify(params, null, 2),
	             "Output .pdf file is not created yet",
	             "In order to proceed you must call the callback (second parameter)",
	             "If you pass an error as first parameter the temp folder and its contents will be removed"
	             ].join("\n"));

	cb(null);
	//cb(new Error("You can force error for testing purposes!"));
});

//setPostParseHook
//----------------
//example usage: 
//	- upload resulting .pdf to amazon s3
//	- send resulting .pdf via email
latex.setPostParseHook(function(params, cb){
	console.log();
	console.log([
	             "POST PARSE HOOK",
	             "---------------",
	             "At this time the temporary folder still exists and all its contents are still there",
	             "A .pdf file has been created ",
	             "And you get some info on the first param",
	             JSON.stringify(params, null, 2),
	             "In order to proceed you must call the callback (second parameter)",
	             "If you pass an error as first parameter the temp folder and its contents will be removed"
	             ].join("\n"));
	
	cb();
	//cb(new Error("You can force error for testing purposes!"));
});

//You can load from a file or retrieve from database
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