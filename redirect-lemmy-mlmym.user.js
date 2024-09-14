// ==UserScript==
// @name Redirect Lemmy To mlmym Interface (WIP)
// @description Redirects supported Lemmy instances to their installed mlmym interface, which tries to emulate the interface of old.reddit
// @author Chris Lowles
// @version 2024.9.14
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-lemmy-mlmym.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-lemmy-mlmym.user.js
// ==/UserScript==

let supported = [
	"lemmy.world",
	"lemmy.dbzer0.com",
	"reddthat.com",
	"ttrpg.network",
	"lemmy.eco.br",
	"lemmy.today",
	"monyet.cc",
	"bookwormstory.social",
	"lemmy.ca",
	"lemmy.sdf.org",
	"literature.cafe",
	"lemdro.id",
	"lemmy.nz",
	"endlesstalk.org",
	"kerala.party",
	"lemy.lol",
	"leminal.space",
	"slrpnk.net",
	"thelemmy.club",
	"startrek.website",
	"lemmings.world"
];

let mlmym = [
	"old.lemmy.world",
	"old.lemmy.dbzer0.com",
	"old.reddthat.com",
	"old.ttrpg.network",
	"old.lemmy.eco.br",
	"old.lemmy.today",
	"old.monyet.cc",
	"old.bookwormstory.social",
	"old.lemmy.ca",
	"old.lemmy.sdf.org",
	"old.literature.cafe",
	"old.lemdro.id",
	"old.lemmy.nz",
	"old.endlesstalk.org",
	"old.kerala.party",
	"m.lemy.lol",
	"old.leminal.space",
	"old.slrpnk.net",
	"old.thelemmy.club",
	"old.startrek.website",
	"old.lemmings.world"
];

supported.forEach((a, i) => {
	if (window.location.host == a) window.location.host = mlmym[i];
});