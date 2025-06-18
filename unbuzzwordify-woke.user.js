// ==UserScript==
// @run-at document-start
// @name Unbuzzwordify (Just Woke)
// @description Replaces specifically the word woke with other, more entertaining words.
// @author Chris Lowles
// @version 2025.6.19
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify-woke.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify-woke.user.js
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
		"GOATSE",
		"BIG FAT CAWK",
		"DEEZ NUTS",
		"AIRPLANES FULL OF SNAKES",
		"HOLY SHIT THEY HIT THE PENTAGON",
		"Restauraunt QR Code Menu"
	];
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		for (var j = 0; j < element.childNodes.length; j++) {
			var node = element.childNodes[j];
			if (node.nodeType === 3) {
				var txt = node.nodeValue;
				var replaced = txt.replace(/(woke)/gi, phrases[Math.floor(Math.random() * phrases.length)]);
				// var replaced = replaced.replace(/woke/gi, `${} `);
				if (replaced !== txt) element.replaceChild(document.createTextNode(replaced), node);
			}
		}
	}
}

setTimeout(unbuzzwordify, 1000);
setInterval(unbuzzwordify, 2000);