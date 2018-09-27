# Simple node.js client for GROBID REST services

This node.js module can be used to process in an efficient concurrent manner a set of PDF in a given directory by the [GROBID](https://github.com/kermitt2/grobid) service. Results are written in a given output directory and include the resulting XML TEI representation of the PDF. 

## Build and run

You need first to install and start the *grobid* service, latest stable version, see the [documentation](http://grobid.readthedocs.io/). It is assumed that the server will run on the address `http://localhost:8070`. You can change the server address by editing the file `main.js`.

Install the present module:

> npm install

Usage (GROBID server must be up and running): 

> node main -in *PATH_TO_THE_PDFS_TO_PROCESS* -out *WHERE_TO_PUT_THE_RESULTS*

Example:

> node main -in ~/tmp/in -out ~/tmp/out

Only the files with extension `.pdf` present in the input directory (`-in`) will be processed, the other files will be ignored. Results will be written in the output directory (`-out`), reusing the file name with different file extensions (see above).

Other parameters 

* `n`: the number of concurrent call to GROBID, default is `10`

* the service to be called, default being `processFulltextDocument` (full processing of the document body), other possibilities are `processHeaderDocument` (only extracting and structuring the header) and `processReferences` (only extracting and structuring the bibliographical references). 

Example: 

> node main -in ~/tmp/in -out ~/tmp/out -n 20 processHeaderDocument

This command will extract the header of the PDF files under `~/tmp/in` with 20 concurrent call to the GROBID server and write the TEI results under `~/tmp/out`.

## Benchmarking

Full text processing of __136 PDF__ on Intel Core i7-4790K CPU 4.00GHz, 8 cores, 16GB memory, n being the concurrency parameter:

| n  | runtime (s)| s/PDF |
|----|------------|-------|
| 1  | 230.9 | 1.69       |
| 2  | 121.6 | 0.89       |
| 3  | 87.9  | 0.64       |
| 5  | 66.2  | 0.48       |
| 8  | 57.7  | 0.42       |
| 10 | 56.5  | 0.41       |

![Runtime Plot](resources/20180927035700.png | width=200)


## Requirements

- async
- request
- form-data
- fs
- mkdirp
- path
- sleep
