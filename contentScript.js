const songsOnPage = 16;
const detailedPageRegex = /.*whosampled.com\/\S*\/\S+\/\S+\/$/;


function OpenLinks(songURLs, songName, artistName) {
	chrome.runtime.sendMessage({links: songURLs, song: songName, artist: artistName}, function(response) {
		console.log(response.status);
		if (response.status != "OK") {
		  console.log(response.message);
		}
	});
}

function JustOpenVisible(section, songName, artistName) {
	let songsToOpen = section.querySelectorAll('div.list > div.listEntry > a');
	songsToOpen = [...songsToOpen].map(link => link.href);
	return songsToOpen;
}

async function FetchAndOpenAll (url) {
	let songURLs = [];
	// Naive implementation, fetch one page after another
	await fetch(url).then(response => response.text())
	.then(async text => {
		const parser = new DOMParser();
		const htmlDocument = parser.parseFromString(text, "text/html");
		songURLs = [...songURLs, ...[...htmlDocument.querySelectorAll("div.list > div.listEntry > a")].map(link => link.href)];
		const nextBtn = htmlDocument.querySelector('div.pagination > span.next > a');
		if (nextBtn) {
			let songsFromNextPage = await FetchAndOpenAll(nextBtn.href);
			songURLs = [...songURLs, ...songsFromNextPage];
		}
	});
	return songURLs; 
}

async function OpenAll(btn) {
	const section = btn.parentElement.parentElement;
	const sectionTitle = section.querySelector('header > span.section-header-title').innerText;
	const seeAllBtn = section.querySelector('header > a.moreButton');
	const songName = document.querySelector('div.trackInfo > h1 > meta[itemprop="name"]').content;
	const artistName = document.querySelector('div.trackInfo > h1 > span.trackArtistNames > meta[itemprop="name"]').content;
	let songURLs;
	if (!seeAllBtn) {
		if (detailedPageRegex.test(window.location.href)) {
			songURLs = await FetchAndOpenAll(window.location.href, songName, artistName, sectionTitle);
		} else {
			songURLs = JustOpenVisible(section, songName, artistName);
		}
	} else {
		songURLs = await FetchAndOpenAll(seeAllBtn.href, songName, artistName, sectionTitle);
	}
	OpenLinks(songURLs, songName, artistName);
}

function CreateOpenAllButton () {
	let openAllButton = document.createElement('button');
	openAllButton.textContent = "open all";
	openAllButton.style.marginLeft = "5px";
	openAllButton.classList.add('moreButton');
	openAllButton.onclick = () => OpenAll(openAllButton);
	return openAllButton;
}

console.log("Loaded..");
let sectionHeaders = document.querySelectorAll('section > header.sectionHeader');
sectionHeaders.forEach(header => {
	header.insertBefore(CreateOpenAllButton(), null);
});