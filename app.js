var
	rimraf = require("rimraf"),
	path = require("path"),
	spawn = require("child_process").spawn,
	fs = require("fs");

var compileCommand;

module.exports.parse = function(texString, callback){
	var baseDirectory = compileCommand.tmpdir || __dirname;
	var outputDirectory = path.join(baseDirectory, "temp-" + generateGuid());
	var texFilePath = path.join(outputDirectory, "output.tex");
	
	fs.mkdir(outputDirectory, function(err){
		if(err) return callback(err);
		
		fs.writeFile(texFilePath, texString, function(err){
			if(err) return callback(err);
			
			if(preParseHook){
				preParseHook({
					outputDirectory: outputDirectory,
					texFilePath: texFilePath,
					texString: texString
				}, function(err){
					if(err){
						rimraf(outputDirectory, function(err){
							if(err) return callback(err);
							
							return callback(postParseHookError);
						});
					}
					
					spawnLatexProcess(0, outputDirectory, [], callback);
				});
			}
			else
				spawnLatexProcess(0, outputDirectory, [], callback);
		});
	});
};

function spawnLatexProcess(attempt, outputDirectory, outputLogs, callback){
	var outputFilePath = path.join(outputDirectory, "output.pdf");
	
	var env = Object.create(process.env); // inherit the standard environment
	if (compileCommand.texpath) {
		env.TEXINPUTS = compileCommand.texpath;
	}
	var options = compileCommand.options || [];
	var pdflatex = spawn(compileCommand.command, options.concat(["output.tex"]), {
		cwd: outputDirectory,
		env: env
	});
	pdflatex.on('error', callback);
	
	var outputLog = "", outputErr = "";
	pdflatex.stdout.on("data", function(data){
		outputLog += data.toString("utf8");
	});
	pdflatex.stderr.on("data", function(data){
		outputErr += data.toString("utf8");
	});
	
	pdflatex.on("close", function(code){
		if(code !== 0){
			process.stderr.write(outputLog);
			process.stderr.write("\n---------------------------------------\n");
			process.stderr.write(outputErr);
			process.stderr.write("\n---------------------------------------\n");
			return rimraf(outputDirectory, function(err){
				if(!err) {
					err = new Error("Latex Error! Check your latex string");
					err.code = code;
					err.stdout = outputLog;
					err.stderr = outputErr;
				}
				return callback(err);
			});
		}
		
		outputLogs.push(outputLog);
		if(shouldRerun(outputLog) && attempt < 10)
			spawnLatexProcess(++attempt, outputDirectory, outputLogs, callback);
		else{
			fs.exists(outputFilePath, function(exists){
				if(exists){
					if(postParseHook){
						postParseHook({
							outputDirectory: outputDirectory,
							outputFilePath: outputFilePath,
							outputLog: outputLog
						}, function(postParseHookError){
							if(postParseHookError){
								rimraf(outputDirectory, function(err){
									if(err) return callback(err);
									return callback(postParseHookError);
								});
							}
							else
								sendPdfStream();
						});
					}
					else sendPdfStream();

					function sync(dir, fd, cb) {
						var punt = function(err) { fs.close(fd); return cb(err); };
						// ensure that file metadata is flushed
						fs.fsync(fd, function(err) {
							if (err) { return punt(err); }
							// ensure that directory metadata is flushed
							fs.open(dir, 'r', function(err, dfd) {
								if (err) { return punt(err); }
								fs.fsync(dfd, function(err) {
									if (err) { fs.close(dfd); return punt(err); }
									fs.close(dfd);
									return cb(null);
								});
							});
						});
					};

					function sendPdfStream(){
						var readStream = fs.createReadStream(outputFilePath);
						readStream.on("open", function(fd){
							// ensure that the file is actually on disk and in the directory
							// (avoid race where we try to unlink before the file is present)
							sync(outputDirectory, fd, function(err1) {
								// as soon as the file is opened we can clean
								// up the dir -- we can continue reading from the
								// deleted file until it is closed.
								rimraf(outputDirectory, function(err2) {
									// wait to invoke the callback, so we can
									// properly report any errors which occurred
									// during the rimraf.
									if (err1 || err2) { fs.close(fd); return callback(err1 || err2); }
									callback(null, readStream, outputLogs);
								});
							});
						});
					}
				}
				else{
					process.stderr.write(outputLog);
					process.stderr.write("--------------------------------------------");
					rimraf(outputDirectory, function(err){
						if(err) return callback(err);
						return callback(new Error("Output file was not found - Attempts: " + attempt));
					});
				}
			});
		}
	});
}

var postParseHook = null;
module.exports.setPostParseHook = function(fn){
	postParseHook = fn;
};

var preParseHook = null;
module.exports.setPreParseHook = function(fn){
	preParseHook = fn;
};

var LATEXMK = {
	command: "latexmk",
	options: ["--pdf"]
};

var PDFLATEX = {
	command: "pdflatex",
	options: ["-interaction=nonstopmode"]
};

var XELATEX = {
	command: "xelatex",
	options: ["-interaction=nonstopmode"]
};

compileCommand = PDFLATEX;

module.exports.setCompileCommand = function(command){
	compileCommand = command;
};

var rerunIndicators = ["Rerun to get cross-references right", "Rerun to get outlines right"];
module.exports.getRerunIndicators = function(){
	return rerunIndicators;
};

module.exports.addRerunIndicator = function(text){
	rerunIndicators.push(text);
};


function shouldRerun(outputLog){
	if(compileCommand.command === "latexmk") return false;
	
	for(var i = 0; i < rerunIndicators.length; i++){
		if(outputLog.indexOf(rerunIndicators[i]) !== -1)
			return true;
	}
	
	return false;
}

function generateGuid(){
    var S4 = function (){
        return Math.floor(Math.random() * 0x10000).toString(16);
    };

    return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
};
