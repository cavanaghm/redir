const startButton = document.getElementById('start');
const readButton = document.getElementById('read');
const fileInput = document.getElementById('filename');
const dir = document.getElementById('filepath');
const docx = require('docx');
const { AlignmentType, Document, Packer, Paragraph, HeadingLevel, TextRun } = docx;


console.log(HeadingLevel)

const electron = require('electron');
const remote = require('@electron/remote');
const dialog = remote.dialog;
const fs = require('fs');
const path = require('path');

var savepath = '/home/michael/Documents';
var filename = undefined;

var root = undefined;
var data = [];
var nthChild = (root, dir) => {
	var start = root.split('/').length
	var current = dir.split('/').length
	return current - start + 1;
}

startButton.addEventListener('click', async()=>{
	data = [];
	const filepath = await dialog.showOpenDialogSync({
		properties: ['openDirectory'],
	})[0];

	root = filepath;
	fs.writeFile(`${savepath}/${filename}.docx`, filepath, {flag: 'a'}, (err) => {
		if(err) console.log(`err: ${err}`)
	})

	for (const filePath of walkSync(filepath)) {
		console.log(filePath);
	}

	createDoc(data)
})

readButton.addEventListener('click', async()=>{
	const filepath = await dialog.showOpenDialogSync({
		properties: ['openDirectory'],
	})[0];

	savepath = filepath;
	console.log(dir)
	dir.innerHTML = filepath;

	if(filename && savepath) return startButton.removeAttribute('disabled');
	if(!filename || !savepath) return startButton.setAttribute('disabled', true);
})

fileInput.addEventListener('keyup', async(e)=>{
	filename = e.target.value;
	if(filename && savepath) return startButton.removeAttribute('disabled');
	if(!filename || !savepath) return startButton.setAttribute('disabled', true);
})

function *walkSync(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
	//fs.writeFile(`${savepath}/${filename}.docx`, '\nDIR: ' + file.name, {flag: 'a'}, (err) => {
	//	if(err) console.log(`err: ${err}`)
	//})
	data.push({child: nthChild(root, dir), name: file.name})
      yield* walkSync(path.join(dir, file.name));
    } else {
	//fs.writeFile(`${savepath}/${filename}.docx`, '\n' + file.name, {flag: 'a'}, (err) => {
	//	if(err) console.log(`err: ${err}`)
	//})
	data.push({child: nthChild(root, dir), name: file.name})
      yield path.join(dir, file.name);
    }
  }
}

var i = 0;
function *numbering(child) {
	console.log(i)
	if(child == 0){
		i = 0
		yield ''
	} else if(child == 1){
		i++
		yield i
	} else {
		yield ''
	}
}

var textRunFormat = (child) => {
	var size = {
		0: '16pt',
		1: '16pt',
		2: '11pt',
	};
	return {
		font: 'Calibri Light',
		color: '#4D5D53',
		size: '16pt',
	}
}

var paragraphFormat = (file) => {
	var headingLevel = (file) => {
		if(file.child == 0) return HeadingLevel.HEADING_1
		if(file.child == 1) return HeadingLevel.HEADING_2
		if(file.child == 2) return HeadingLevel.HEADING_3
		return null
	}

	var textCalc = (file) => {
		var num = numbering(file.child).next().value;
		return `${num ? num + '.' : ''} ${file.name.split('.')[0]}`
	}


	var data = {
		heading: headingLevel(file),
		children: []
	}
	var textrun = {
			text: textCalc(file),
			font: 'Calibri Light',
		};
	if(file.child > 2) {
		textrun.size = '11pt'
		data.bullet = {
			level: 1
		}
	}
	data.children.push(new TextRun(textrun))
	return  data
}

var createDoc = async(data)=>{
	console.log(data)

	const doc = new Document({
		numbering: {
			config: [{
				reference: 'ref',
				levels: [
				{
					level: 0,
					alignment: AlignmentType.START,
					style: {
						paragraph: {
							heading: HeadingLevel.HEADING_1,
							indent: { left: 720, hanging: 260},
						},
					},
				},

				{
					level: 1,
					alignment: AlignmentType.START,
					style: {
						paragraph: {
							bullet: {
								level: 1
							},
						},
					},
				}
				],
			}]
		},
		sections: [{
			children: [
				...data.map(file => {
					//return new Paragraph({
					//	children: [
					//		new TextRun({
					//			text: file.name,
					//			...textRunFormat(file.child),
					//		})
					//	],
					//	...paragraphFormat(file.child),
					//})
					return new Paragraph({
						...paragraphFormat(file),
					})
				})
			],
		}],
	})

	const b64string = await Packer.toBuffer(doc).then(buffer => {
		fs.writeFileSync(`${savepath}/${filename}.docx`, buffer)
	})
}
