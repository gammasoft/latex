var
	rimraf = require("rimraf"),
	path = require("path"),
	spawn = require("child_process").spawn,
	fs = require("fs");

module.exports.parse = function(texString, callback){
	var outputDirectory = path.join(__dirname, "temp-" + generateGuid());
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
							if(err) throw err;
							
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
									if(err) throw err;
									
									return callback(postParseHookError);
								});
							}
							else
								sendPdfStream();
						});
					}
					else sendPdfStream();
					
					function sendPdfStream(){
						var readStream = fs.createReadStream(outputFilePath);
						callback(null, readStream, outputLogs);
						
						readStream.on("close", function(){
							rimraf(outputDirectory, function(err){
								if(err) throw err;
							});
						});
					}
				}
				else{
					process.stderr.write(outputLog);
					process.stderr.write("--------------------------------------------");
					return callback(new Error("Output file was not found - Attempts: " + attempt));
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

var compileCommand = PDFLATEX;

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
