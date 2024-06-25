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
                if ((message.link.split('/')[6] === item.link.split('/')[2])) {
                    axios.post('https://cardvantage.ai:8443/api/Listproduct', {
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
        console.log("All tabs processed.");
    }
}

function processInventoryInfo(index, data) {
    if (index < data.length) {
        var item = data[index];
        chrome.tabs.create({ url: `https://store.tcgplayer.com/admin/product/manage/${item.link.split('/')[2]}` }, function (tab) {
            const tabId = tab.id;
            chrome.runtime.onMessage.addListener(function listener(message, sender, sendResponse) {
                if (message.action === 'scrapeMyInventory' && message.data.link.split('/')[6] === item.link.split('/')[2]) {
                    chrome.tabs.remove(tabId, function () {
                        processInventoryInfo(index + 1, data);
                    });
                    chrome.runtime.onMessage.removeListener(listener);
                }
            })
        });
    } else {
        console.log("All tabs processed.");
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scrapedCard') {
        console.log('Received scraped card:', message.data);
        if (message.data.length !== 0) {
            axios.post('https://cardvantage.ai:8443/api/scrapingCard', {
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
            axios.post('https://cardvantage.ai:8443/api/scrapingOrder', {
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
            axios.post('https://cardvantage.ai:8443/api/detail', {
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
            axios.post('https://cardvantage.ai:8443/api/detailSaveInfo', {
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

    else if (message.action === 'MyInventory') {
        if (message.message === "success getMyInventory") {
            chrome.storage.local.get(['credential'], (result) => {
                axios.post('https://cardvantage.ai:8443/api/myInventory', {
                    data: message.data,
                    user: result.credential.email
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
            })

        }
        else if (message.message === "failed bulk") {
            console.log("failed");
        }
    }

    else if (message.action === 'EndCatalog') {
        console.log("endcatalog");
        axios.post('https://cardvantage.ai:8443/api/endcatalog', {
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

    else if (message.action === 'scrapeMyInventory') {
        console.log("endDetailInventory");
        axios.post('https://cardvantage.ai:8443/api/endDetailInventory', {
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

    else if (message.action === 'endCardScraping') {
        console.log("endcardscraping");
        axios.post('https://cardvantage.ai:8443/api/endCardScraping', {
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

    else if (message.type === 'manageMyInventory') {
        console.log('Received message from frontend:', message.products);
        chrome.storage.local.set({ "inventoryProduct": message.products });
        chrome.storage.local.set({ "bulkStatus": "updateCard" });
        chrome.storage.local.get(['inventoryProduct'], (result) => {
            console.log(result.inventoryProduct);
        });
        processTabData(0, Object.values(message.products));
    }

    else if (message.type === 'fetchOrder') {
        chrome.tabs.create({ url: 'https://store.tcgplayer.com/admin/orders/orderlist' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'order' });
            chrome.storage.local.set({ 'product': null });
        });
    }

    else if (message.type === 'fetchCardDetail') {
        chrome.storage.local.set({ 'AllCards': message.products });
        chrome.storage.local.set({ 'bulkStatus': 'getAllCards' });
        processCardDetail(0, message.products);
    }

    else if (message.type === 'fetchSelectCardDetail') {
        chrome.storage.local.set({ 'SelectCards': message.products });
        chrome.storage.local.set({ 'bulkStatus': 'getSelectCards' });
        if (message.products.productLine[0] === 'all') {
            if (message.products.sets.length === 1) {
                chrome.tabs.create({ url: `https://www.tcgplayer.com/search/all/${message.products.sets[0]}?view=grid&page=1&setName=${message.products.sets[0]}` }, function (tab) {
                });
            }

            else {
                chrome.tabs.create({ url: `https://www.tcgplayer.com/search/all/product?view=grid&setName=${message.products.sets.join('|')}` }, function (tab) {
                });
            }
        }

        else {
            if (message.products.sets.length === 1) {
                chrome.tabs.create({ url: `https://www.tcgplayer.com/search/${message.products.productLine[0]}/${message.products.sets[0]}?productLineName=${message.products.productLine[0]}&view=grid&setName=${message.products.sets[0]}` }, function (tab) {
                });
            }

            else {
                chrome.tabs.create({ url: `https://www.tcgplayer.com/search/${message.products.productLine[0]}/product?productLineName=${message.products.productLine[0]}&view=grid&setName=${message.products.sets.join('|')}` }, function (tab) {
                });
            }
        }
    }

    else if (message.type === 'myInventoryOnly') {
        chrome.tabs.create({ url: `https://store.tcgplayer.com/admin/product/catalog` }, function (tab) {
        });
    }

    else if (message.type === 'InventoryFetch') {
        chrome.storage.local.set({ "bulkStatus": "fetchInventory" });
        console.log(message.products);
        processInventoryInfo(0, message.products);
    }
});