import fs from 'fs';
import { Utils } from '/var/rad/lib/tool/util.js';

let util = new Utils;
function stripInvalids(line)
{
	let buf = "";
	for( var i=0; i<line.length; i++ ) {
		let c = line[i];
		if( util.isSpace(c) ) {
			buf += c;
		} else if( line.charCodeAt(i) == 13 ) {
			continue;
		} else if( !util.isCharacter(c) ) {
			buf += "x" + line.charCodeAt(i);
		} else {
			buf += line[i];
		}
	}
	return buf;
}

if( process.argv.length <= 2 ) {
	console.log("syntax: node stripchars.js <target file>");
	exit(0);
	throw "syntax";
}

let fn = process.argv[2];
let process_fn = process.argv[2] + "_tmp";

console.log("Reading " + fn);
let filedata = await fs.readFileSync(fn, 'utf-8');
let rows = filedata.split("\n");
let endbuf = "";
console.log("Processing");
for( var row of rows ) {
	endbuf += stripInvalids(row) + "\n";
}
console.log("Writing " + process_fn);
await fs.writeFileSync(process_fn, endbuf);
console.log("Removing " + fn);
await fs.unlinkSync(fn);
console.log("Replacing " + fn);
await fs.copyFileSync(process_fn, fn);
console.log("Done. Removing temp file.");
await fs.unlinkSync(process_fn);

		
