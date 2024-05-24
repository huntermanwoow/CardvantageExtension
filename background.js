importScripts('lib/axios.min.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scrapedData') {
        console.log('Received scraped data:', message.data);
        if (message.data.length !== 0) {
            axios.post('http://localhost:8000/api/scraping', {
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
    }

    else if (message.action === 'bulkData') {
        if (message.message === "success bulk") {
            console.log(message.data);
            axios.post('http://localhost:8000/api/bulk', {
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

    else if (message.type === 'addMyInventory') {
        console.log('Received message from frontend:', Object.values(message.products));
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        chrome.storage.local.set({ 'inventoryProduct': message.products });
        chrome.storage.local.set({ 'inventoryStatus': 'add' });
        Object.values(message.products).forEach((item) => {
            chrome.tabs.create({ url: `https://store.tcgplayer.com${item.link}` }, function (tab) {
            });
        })
    }

    else if (message.type === 'manageMyInventory') {
        console.log('Received message from frontend:', message.products);
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
    }

    else if (message.type === 'startScraping') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        chrome.tabs.create({ url: 'https://www.tcgplayer.com/login?returnUrl=https://store.tcgplayer.com/admin/product/catalog' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'login' });
            chrome.storage.local.set({ 'product': null });
        });
    }

    if (message.type === 'bulkManageProducts') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        message.products.forEach((item) => {
            chrome.tabs.create({ url: `https://store.tcgplayer.com${item}` }, function (tab) {
                chrome.storage.local.set({ 'bulkStatus': 'manage' })
            });
        })
    }

    if (message.type === 'bulkAddProducts') {
        chrome.storage.local.clear(() => {
            console.log("success clear!!!");
        })
        console.log(message.products);
        message.products.forEach((item) => {
            chrome.tabs.create({ url: `https://store.tcgplayer.com${item}` }, function (tab) {
                chrome.storage.local.set({ 'bulkStatus': 'add' });
            });
        })
    }
});