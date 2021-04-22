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
			console.log(request.links);
			chrome.tabs.query({active: true, currentWindow: true}, currentTab => chrome.tabs.group({tabIds: currentTab[0].id}, async groupId => {
				chrome.tabGroups.update(groupId, {color: "yellow", title: `Samples of ${request.song} by ${request.artist}`}, grp => {console.log(grp)});
				let isSearchPageRemoved = false;
				for (link of request.links) {
					await chrome.tabs.create({active: false, url: link}, tab => {
						chrome.scripting.executeScript({function: () => {window.stop();}, target: {tabId: tab.id}},
						() => {});
						chrome.tabs.group({tabIds: tab.id, groupId}, () => {
							if (!isSearchPageRemoved) {
								chrome.tabs.ungroup(currentTab[0].id, () => {isSearchPageRemoved = true;});

							}
						});
					});
				}
			}));			
			sendResponse({
				status: "OK"
			});
		} catch(error) {
			sendResponse({
				status: "Failure",
				message: error.message
			});
		}
		
	});
});

