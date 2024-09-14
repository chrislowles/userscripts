// ==UserScript==
// @name Unbuzzwordify
// @description Replaces buzzwords with other, more entertaining words.
// @author Chris Lowles
// @version 2024.9.14
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify.user.js
// -- sites that break with this
// @exclude-match *://onlyfans.com/*
// @exclude-match *://*pcpartpicker.com/*
// @exclude-match *://*.pcpartpicker.com.au/*
// @exclude-match *://webapp.licenceready.com.au/*
// @exclude-match *://*.deviantart.com/*
// @exclude-match *://*.bandcamp.com/*
// @exclude-match *://*.codetasty.com/*
// @exclude-match *://*.vscode.dev/*
// @exclude-match *://*.x.com/*
// ==/UserScript==

function unbuzzwordify() {
	var elements = document.querySelectorAll('*:not(textarea,input)');
	var phrases = [
		"WAH",
		"GOATSE",
		"BIG FAT CAWK",
		"DEEZ NUTS",
		"AIRPLANES FULL OF SNAKES",
		"HOLY SHIT THEY HIT THE PENTAGON",
		"CLAM CHOWDEh",
		"PROLAPSED ANUS"
	];
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		for (var j = 0; j < element.childNodes.length; j++) {
			var node = element.childNodes[j];
			if (node.nodeType === 3) {
				var txt = node.nodeValue;
				var replaced = txt.replace(/(woke|libtard|conservitard|conservatard|sjw|cringe|social justice warrior|cancel culture|fake news)/gi, phrases[Math.floor(Math.random() * phrases.length)]);
				// var replaced = replaced.replace(/woke/gi, `${} `);
				if (replaced !== txt) element.replaceChild(document.createTextNode(replaced), node);
			}
		}
	}
}

setTimeout(unbuzzwordify, 1000);
setInterval(unbuzzwordify, 2000);