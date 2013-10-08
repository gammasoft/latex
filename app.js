var
	rimraf = require("rimraf"),
	path = require("path"),
	spawn = require("child_process").spawn,
	fs = require("fs");

module.exports = function(texString, callback){
	var outputDirectory = path.join(__dirname, "temp-" + generateGuid());
	var texFilePath = path.join(outputDirectory, "output.tex");
	
	fs.mkdir(outputDirectory, function(err){
		if(err) return callback(err);
		
		fs.writeFile(texFilePath, texString, function(err){
			if(err) return callback(err);

			spawnLatexProcess(0, outputDirectory, callback);
		});
	});
};

function spawnLatexProcess(attempt, outputDirectory, callback){
	var outputFilePath = path.join(outputDirectory, "output.pdf");
	
	var pdflatex = spawn("pdflatex", ["-interaction=nonstopmode", "output.tex"], {
		cwd: outputDirectory
	});
	
	var outputLog = "";
	pdflatex.stdout.on("data", function(data){
		outputLog += data.toString("utf8");
	});
	
	pdflatex.on("close", function(code){
		if(code !== 0){
			process.stderr.write(outputLog);
			process.stderr.write("--------------------------------------------");
			return callback(new Error("Latex Error! Check your latex string"));
		}
		
		if(outputLog.indexOf("Rerun to get outlines right") !== -1 && attempt < 10)
			spawnLatexProcess(++attempt, outputDirectory, callback);
		else{
			fs.exists(outputFilePath, function(exists){
				if(exists){
					var readStream = fs.createReadStream(outputFilePath);
					callback(null, readStream);
					
					readStream.on("close", function(){
						rimraf(outputDirectory, function(err){
							if(err) throw err;
						});
					});
				}
				else callback(new Error("Output file was not found - Attempts: " + attempt));
			});
		} 
	});
}

function generateGuid(){
    var S4 = function (){
        return Math.floor(Math.random() * 0x10000).toString(16);
    };

    return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
};