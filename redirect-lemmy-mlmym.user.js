// ==UserScript==
// @run-at document-start
// @name Redirect Lemmy To mlmym Interface (WIP)
// @description Redirects supported Lemmy instances to their installed mlmym interface, which tries to emulate the interface of old.reddit
// @author Chris Lowles
// @version 2025.3.13
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-lemmy-mlmym.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-lemmy-mlmym.user.js
// ==/UserScript==

let instances = [
	{"lemmy": "lemmy.world", "mlmym": "old.lemmy.world"},
	{"lemmy": "lemmy.dbzer0.com", "mlmym": "old.lemmy.dbzer0.com"},
	{"lemmy": "reddthat.com", "mlmym": "old.reddthat.com"},
	{"lemmy": "ttrpg.network", "mlmym": "old.ttrpg.network"},
	{"lemmy": "lemmy.eco.br", "mlmym": "old.lemmy.eco.br"},
	{"lemmy": "lemmy.today", "mlmym": "old.lemmy.today"},
	{"lemmy": "monyet.cc", "mlmym": "old.monyet.cc"},
	{"lemmy": "bookwormstory.social", "mlmym": "old.bookworkstory.social"},
	{"lemmy": "lemmy.ca", "mlmym": "old.lemmy.ca"},
	{"lemmy": "lemmy.sdf.org", "mlmym": "old.lemmy.sdf.org"},
	{"lemmy": "literature.cafe", "mlmym": "old.literature.cafe"},
	{"lemmy": "lemdro.id", "mlmym": "old.lemmdro.id"},
	{"lemmy": "lemmy.nz", "mlmym": "old.lemmy.nz"},
	{"lemmy": "endlesstalk.org", "mlmym": "old.endlesstalk.org"},
	{"lemmy": "kerala.party", "mlmym": "old.kerala.party"},
	{"lemmy": "lemy.lol", "mlmym": "m.lemy.lol"},
	{"lemmy": "leminal.space", "mlmym": "old.leminal.space"},
	{"lemmy": "lemmy.world", "mlmym": "old.slrpnk.net"},
	{"lemmy": "lemmy.world", "mlmym": "old.thelemmy.club"},
	{"lemmy": "lemmy.world", "mlmym": "old.startrek.website"},
	{"lemmy": "lemmy.world", "mlmym": "old.lemmings.world"}
];

instances.forEach((a, i) => {
	if (window.location.host == a) console.log(a, i); // window.location.host = a[i];
});