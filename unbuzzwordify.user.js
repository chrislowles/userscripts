// ==UserScript==
// @name         Unbuzzwordify
// @namespace    https://github.com/chrishazfun
// @version      1.5.3
// @description  Replaces buzzwords with other, more entertaining words.
// @source       https://github.com/chrishazfun
// @updateURL    https://raw.githubusercontent.com/chrishazfun/userscripts/main/unbuzzwordify.user.js
// @downloadURL  https://raw.githubusercontent.com/chrishazfun/userscripts/main/unbuzzwordify.user.js
// @author       chrishazfun
// @icon         https://raw.githubusercontent.com/chrishazfun/userscripts/main/unbuzzwordify.png
// -- sites that break with this
// @exclude-match *://onlyfans.com/*
// @exclude-match *://*pcpartpicker*/*
// @exclude-match *://webapp.licenceready.com.au/*
// @exclude-match *://*.deviantart.com/*
// @exclude-match *://*.bandcamp.com/*
// ==/UserScript==

function unbuzzwordify() {
	var elements = document.querySelectorAll('*:not(textarea)');
	var phrases = [
		"WAH",
		"GOATSE",
		"BIG FAT CAWK",
		"WAP",
		"AIRPLANES FULL OF SNAKES"
	];
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		for (var j = 0; j < element.childNodes.length; j++) {
			var node = element.childNodes[j];
			if (node.nodeType === 3) {
				var txt = node.nodeValue;
				var replaced = txt.replace(/(woke|libtard|conservitard|conservatard|sjw|cringe|social justice warrior|cancel culture|fake news)/gi, phrases[Math.floor(Math.random()*phrases.length)]);
				// var replaced = replaced.replace(/woke/gi, `${} `);
				if (replaced !== txt) element.replaceChild(document.createTextNode(replaced), node);
			}
		}
	}
}

setTimeout(unbuzzwordify, 1000);
setInterval(unbuzzwordify, 2000);