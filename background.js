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

    if (message.type === 'addProductToInventory') {
        console.log('Received message from frontend:', message);
        chrome.tabs.create({ url: 'https://store.tcgplayer.com/admin/product/catalog' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'addProductToInventory' });
            chrome.storage.local.set({ 'product': message });
        });
    }

    if (message.type === 'manageProductToInventory') {
        console.log('Received message from frontend:', message);
        chrome.tabs.create({ url: 'https://store.tcgplayer.com/admin/product/catalog' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'manageProductToInventory' })
            chrome.storage.local.set({ 'product': message });
        });
    }
    
    if (message.type === 'startScraping') {
        console.log("start");
        chrome.tabs.create({ url: 'https://www.tcgplayer.com/login?returnUrl=https://store.tcgplayer.com/admin/product/catalog' }, function (tab) {
            chrome.storage.local.set({ 'inventoryStatus': 'login' });
            chrome.storage.local.set({ 'product': null });
        });
    }
});