chrome.runtime.onInstalled.addListener(function () {
    chrome.tabs.onActivated.addListener(async info => {
        const tab = await chrome.tabs.get(info.tabId);

        const isWhoSampled = tab.url.startsWith('https://www.whosampled.com/');
        isWhoSampled
         ? chrome.action.enable(tab.tabId)
         : chrome.action.disable(tab.tabId);
    });
	chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
		try {
			let createdTabs = [];
			let createdGroup;
			request.links.forEach(link => chrome.tabs.create({active: false, url: link}, tab => createdTabs.push(tab.id)));
			console.log(createdTabs);
			sendResponse({
				status: "OK"
			});
			// Wait for the tabs to open and to be registered by browser
			await new Promise(res => setTimeout(res, 100));
			chrome.tabs.group({tabIds: createdTabs}, id => {
				chrome.tabGroups.update(id, {color: "yellow", title: `Samples of ${request.song} by ${request.artist}`}, grp => {console.log(grp)});
			});
		} catch(error) {
			sendResponse({
				status: "Failure",
				message: error.message
			});
		}
		
	});
});

