importScripts('lib/axios.min.js');
function processTabData(index, data) {
    console.log(data);
    if (index < data.length) {
        var item = data[index];
        chrome.tabs.create({ url: `https://store.tcgplayer.com/admin/product/manage/${item.link.split('/')[2]}` }, function (tab) {
            chrome.storage.local.set({ 'currentTab': tab.id });
        });
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updatecard') {
                console.log("OK!!!!!");
                if ((message.link.split('/')[6] === item.link.split('/')[2])) {
                    axios.post('http://localhost:8000/api/Listproduct', {
                        data: item
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => {
                            console.log(response);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        })
                    chrome.storage.local.get(['currentTab'], function (result) {
                        console.log(result.currentTab);
                        chrome.tabs.remove(result.currentTab);
                        processTabData(index + 1, data);
                    })

                }
            }
        })
    } else {
        // All tabs processed
        console.log("All tabs processed.");
    }
}

function processCardDetail(index, data) {
    console.log(data);
    if (index < data.length) {
        var item = data[index];
        chrome.tabs.create({ url: `https://www.tcgplayer.com${item.link}` }, function (tab) {
            const tabId = tab.id;
            chrome.runtime.onMessage.addListener(function listener(message, sender, sendResponse) {
                if (message.action === 'cardDetail' && message.data.link.replace("&Language=English", "").replace("https://www.tcgplayer.com", "") === item.link) {
                    console.log(message);
                    chrome.tabs.remove(tabId, function () {
                        processCardDetail(index + 1, data);
                    });
                    chrome.runtime.onMessage.removeListener(listener);  // Clean up the listener
                }
            });
        });
    } else {
        processCardSaveInfo(0, data)
        console.log("All tabs processed.");
    }
}

function processCardSaveInfo(index, data) {
    chrome.storage.local.clear(() => {
        console.log("success clear!!!");
    })
    chrome.storage.local.set({ 'AllCards': data });
    chrome.storage.local.set({ 'bulkStatus': 'getAllSaveInfo' });
    if (index < data.length) {
        var item = data[index];
        chrome.tabs.create({ url: `https://store.tcgplayer.com/admin/product/manage/${item.link.split('/')[2]}` }, function (tab) {
            const tabId = tab.id;
            chrome.runtime.onMessage.addListener(function listener(message, sender, sendResponse) {
                console.log(message);
                if (message.action === 'scrapeCardSaveInfo' && message.data.link.split('/')[6] === item.link.split('/')[2]) {
                    chrome.tabs.remove(tabId, function () {
                        processCardSaveInfo(index + 1, data);
                    });
                    chrome.runtime.onMessage.removeListener(listener);
                }
            })
        });
    } else {
        // All tabs processed
        console.log("All tabs processed.");
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scrapedCard') {
        console.log('Received scraped card:', message.data);
        if (message.data.length !== 0) {
            axios.post('http://localhost:8000/api/scrapingCard', {
                data: message.data
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    console.log(response);
                })
                .catch(error => {
                    console.error('Error:', error);
                })
        }
    }

    else if (message.action === 'scrapedOrder') {
        console.log('Received scraped order:', message.data);
        if (message.data.length !== 0) {
            axios.post('http://localhost:8000/api/scrapingOrder', {
                data: message.data
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => {
                })
                .catch(error => {
                    console.error('Error:', error);
                })
        }
    }

    else if (message.action === 'cardDetail') {
        if (message.message === "success getCardDetail") {
            console.log(message.data);
            axios.post('http://localhost:8000/api/detail', {
                data: message.data
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => {
                    console.log(response);
                })
                .catch(error => {
                    console.error('Error:', error);
                })
        }
        else if (message.message === "failed bulk") {
            console.log("failed");
        }
    }

    else if (message.action === 'scrapeCardSaveInfo') {
        if (message.message === "success") {
            console.log(message.data);
            axios.post('http://localhost:8000/api/detailSaveInfo', {
                data: message.data
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => {
                    console.log(response);
                })
                .catch(error => {
                    console.error('Error:', error);
                })
        }
        else if (message.message === "failed bulk") {
            console.log("failed");
        }
    }

    else if (message.type === 'manageMyInventory') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        console.log('Received message from frontend:', message.products);
        chrome.storage.local.set({ "inventoryProduct": message.products });
        chrome.storage.local.set({ "bulkStatus": "updateCard" });
        chrome.storage.local.get(['inventoryProduct'], (result) => {
            console.log(result.inventoryProduct);
        });
        processTabData(0, Object.values(message.products));
    }

    else if (message.type === 'fetchCard') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        chrome.tabs.create({ url: 'https://www.tcgplayer.com/login?returnUrl=https://www.tcgplayer.com/search/sorcery-contested-realm/product?productLineName=sorcery-contested-realm&view=grid' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'login' });
            chrome.storage.local.set({ 'product': null });
        });
    }

    else if (message.type === 'fetchOrder') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        chrome.tabs.create({ url: 'https://store.tcgplayer.com/admin/orders/orderlist' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'order' });
            chrome.storage.local.set({ 'product': null });
        });
    }

    else if (message.type === 'fetchCardDetail') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        chrome.storage.local.set({ 'AllCards': message.products });
        chrome.storage.local.set({ 'bulkStatus': 'getAllCards' });
        console.log(message.products);
        processCardDetail(0, message.products);
    }
});