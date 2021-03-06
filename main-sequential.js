'use strict';

/* Module Require */
var mkdirp = require('mkdirp'),
  request = require('request'),
  FormData = require('form-data'),
  async = require('async'),
  path = require('path'),
  fs = require('fs'),
  sleep = require('sleep');

// the URL of the GROBID service (to be changed if necessary)
const GROBID_URL = "http://localhost:8070/api/";

// for making console output less boring
const green = '\x1b[32m';
const red = '\x1b[31m';
const orange = '\x1b[33m';
const white = '\x1b[37m';
const blue = `\x1b[34m`;
const score = '\x1b[7m';
const bright = "\x1b[1m";
const reset = '\x1b[0m';

/**
 * List all the PDF files in a directory in a synchronous fashion,
 * @return the list of file names
 */
function getFiles(dir) {
    var fileList = [];
    var files = fs.readdirSync(dir);
    for (var i=0; i<files.length; i++) {
    	if (fs.statSync(path.join(dir, files[i])).isFile()) {
    		if (files[i].endsWith(".pdf") || files[i].endsWith(".PDF"))
            	fileList.push(files[i]);
        }
    }
    return fileList;
}

function sequentialRequests(options, listOfFiles, i) {
  	if (i == undefined) {
  		i = 0;
  	}
  	if (i >= listOfFiles.length) {
  		return;
  	}
	var file = listOfFiles[i];	
  	console.log("---\nProcessing: " + options.inPath+"/"+file);

	var form = new FormData();
	form.append("input", fs.createReadStream(options.inPath+"/"+file));
	form.append("consolidateHeader", "1");
    form.append("consolidateCitations", "0");
	form.submit(GROBID_URL+"processFulltextDocument", function(err, res, body) {
		if (err) {
			console.log(err);
			return false;
		}

		if (!res) {
			console.log("GROBID service appears unavailable");
			//return false;
		} else {
	   	   res.setEncoding('utf8');
        }

        if (res.statusCode == 503) {
            // service unavailable, normally it means all the threads for GROBID on the server are currently used 
            // so we sleep a bit before retrying the process
            sleep.sleep(5); 
            sequentialRequests(options, listOfFiles, i);
        } else if (res.statusCode != 200) {
			console.log("Call to GROBID service failed with error " + res.statusCode);
			// move to next file to be processed
			i++;
			sequentialRequests(options, listOfFiles, i);
			return false;
		}

		var body = "";
	  	res.on("data", function (chunk) {
			body += chunk;
		});
		
		res.on("end", function () {
			mkdirp(options.outPath, function(err, made) {
			    // I/O error
			    if (err) 
			      	return cb(err);

			    // first write the TEI reponse 
				var jsonFilePath = options.outPath+"/"+file.replace(".pdf", ".tei.xml");
				fs.writeFile(jsonFilePath, body, 'utf8', 
					function(err) { 
						if (err) { 
							console.log(err);
						} 
						console.log(white, "TEI response written under: " + jsonFilePath, reset); 
					}
				);
			
				// move to next file to be processed
				i++;
				sequentialRequests(options, listOfFiles, i);
				/*} else {
					// redo
					console.log("(weird bug from formdata/node.js...)");
					console.log("retry...");
					sequentialRequests(options, listOfFiles, i);
				}*/
			});
		});
  	});
}

/**
 * Process a PDF file by calling the entity-fishing service and enrich with the resulting
 * JSON
 * @param {object} options object containing all the information necessary to manage the paths:
 *  - {object} inPath input directory where to find the PDF files
 *  - {object} outPath output directory where to write the results
 *  - {string} profile the profile indicating which filter to use with the entity-fishing service, e.g. "species"
 * @return {undefined} Return undefined
 */
function processGROBID(options) {
  	// get the PDF paths
  	var listOfFiles = getFiles(options.inPath);
	console.log("found " + listOfFiles.length + " files to be processed");
	sequentialRequests(options, listOfFiles, 0);
};

/**
 * Init the main object with paths passed with the command line
 */
function init() {
	var options = new Object();
	//var inPath; // path to the PDF
	//var outPath; // path where to write the results
	//var nbThread = 1; // number of threads to use when calling entity-fishing
	var attribute; // name of the passed parameter
	// get the path to the PDF to be processed
	for (var i = 1, len = process.argv.length; i < len; i++) {
		if (process.argv[i-1] == "-in") {
			options.inPath = process.argv[i];
		} else if (process.argv[i-1] == "-out") {
			options.outPath = process.argv[i];
		} 
	}

	if (!options.inPath) {
		console.log("Input path is not defines");
		return;
	}

	// check the input path
	fs.lstat(options.inPath, (err, stats) => {
	    if (err)
	        console.log(err);
	    if (stats.isFile()) 
	    	console.log("Input path must be a directory, not a file");
	    if (!stats.isDirectory())
	    	console.log("Input path is not a valid directory");
	});

	// check the output path
	if (options.outPath) {
		fs.lstat(options.outPath, (err, stats) => {
		    if (err)
		        console.log(err);
		    if (stats.isFile()) 
		    	console.log("Output path must be a directory, not a file");
		    if (!stats.isDirectory())
		    	console.log("Output path is not a valid directory");
		});
	}
	return options;
}

function main() {
	var options = init();
	processGROBID(options);
}

main();
