const songsOnPage = 16;

function JustOpenVisible(section, songName, artistName) {
	let songsToOpen = section.querySelectorAll('div.list > div.listEntry > a');
	songsToOpen = [...songsToOpen].map(link => link.href);
	chrome.runtime.sendMessage({links: songsToOpen, song: songName, artist: artistName}, function(response) {
	  console.log(response.status);
	  if (response.status != "OK") {
		console.log(response.message);
	  }
	});
	console.log(songsToOpen);
}

async function FetchAndOpenAll (url, songName, artistName) {
	let songURLs = [];
	// Naive implementation, fetch one page after another
	await fetch(url).then(response => response.text())
	.then(text => {
		const parser = new DOMParser();
		const htmlDocument = parser.parseFromString(text, "text/html");
        console.log(htmlDocument.querySelectorAll("div.list > div.listEntry > a"));
		songURLs.push([...htmlDocument.querySelectorAll("div.list > div.listEntry > a")].map(link => link.href));
		const nextBtn = htmlDocument.querySelector('div.pagination > span.next > a');
		if (nextBtn) {
			console.log(nextBtn.href);
			let songsFromNextPage = FetchAndOpenAll(nextBtn.href, songName, artistName);
			songURLs.push(songsFromNextPage);
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
	if (!seeAllBtn) {
		JustOpenVisible(section, songName, artistName);
	} else {
		await FetchAndOpenAll(seeAllBtn.href, songName, artistName, sectionTitle);
	}
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