function scrapeDataFromCurrentPage() {
    try {
        const productLines = Array.from(document.querySelectorAll('td[data-bind="text: ProductLine"]'))
            .map(lineElement => lineElement.innerText);
        const views = Array.from(document.querySelectorAll('.product-image-thumbnail'))
            .map(viewElement => viewElement.getAttribute('src'));
        const productNames = Array.from(document.querySelectorAll('span[data-bind="text: ProductName"]'))
            .map(nameElement => nameElement.innerText);
        const sets = Array.from(document.querySelectorAll('span[data-bind="text: SetName"]'))
            .map(setElement => setElement.innerText);
        const rarities = Array.from(document.querySelectorAll('td[data-bind="text: DisplayedNumber"]'))
            .map(rarityElement => rarityElement.previousElementSibling.innerText);
        const numbers = Array.from(document.querySelectorAll('td[data-bind="text: DisplayedNumber"]'))
            .map(numberElement => numberElement.innerText);
        const instocks = Array.from(document.querySelectorAll('span[data-bind="text: InStock"]'))
            .map(stockElement => stockElement.innerText);
        const links = Array.from(document.querySelectorAll('.product-image-desktop'))
            .map(linkElement => linkElement.getAttribute('href'))
        // Send scraped data to the background script
        chrome.runtime.sendMessage({
            action: 'scrapedData',
            data: {
                productLines: productLines,
                views: views,
                productNames: productNames,
                sets: sets,
                rarities: rarities,
                numbers: numbers,
                instocks: instocks,
                links: links
            }
        });
    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

function searchDataFromCurrentPage(parameter) {
    try {
        const productElements = Array.from(document.querySelectorAll('span[data-bind="text: ProductName"]'));
        productElements.forEach(element => {
            console.log(element.innerText);
            const clickButton = element.parentElement.parentElement.parentElement.lastElementChild.children[0];
            if (element.innerText === parameter) {
                clickButton.click();
            }
        });
    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

// Define a function to navigate to the next page
function GetAllProductsByNextPage() {
    const nextPageButton = document.querySelector('.pager').lastElementChild.previousElementSibling;
    scrapeDataFromCurrentPage();
    // If the "Next" button exists, click it and scrape data
    if (nextPageButton) {
        setTimeout(() => {
            scrapeDataFromCurrentPage();
            GetAllProductsByNextPage();
        }, 2000);
        nextPageButton.click();
    }
}

const scrapeBulkData = async (req, res) => {
    try {
        const lowestPriceElem = document.querySelector('span[data-bind="formatCurrency: lowestPrice"]');
        const lowestShippingElem = document.querySelector('span[data-bind="formatCurrency: lowestShipping"]');
        const lastSoldPriceElem = document.querySelector('span[data-bind="formatCurrency: lastSoldPrice"]');
        const marketPriceElem = document.querySelector('span[data-bind="formatCurrency: marketPrice"]');
        const productNameElem = document.querySelector('span[data-bind="text: productName"]')
        // Ensure all elements are found
        const lowestPrice = lowestPriceElem ? lowestPriceElem.innerText : null;
        const lowestShipping = lowestShippingElem ? lowestShippingElem.innerText : null;
        const lastSoldPrice = lastSoldPriceElem ? lowestShippingElem.innerText : null;
        const marketPrice = marketPriceElem ? marketPriceElem.innerText : null;
        const productName = productNameElem ? productNameElem.innerText : null;
        chrome.runtime.sendMessage({
            action: 'bulkData',
            data: {
                lowestPrice: lowestPrice,
                lowestShipping: lowestShipping,
                lastSoldPrice: lastSoldPrice,
                marketPrice: marketPrice,
                productName: productName
            },
            message: 'success bulk'
        });
    } catch (error) {
        console.error('Error scraping bulk data:', error);
    }
}

const insertAndupdateData = async (req, res) => {
    try {
        console.log(result.inventoryProduct);
        const productName = document.querySelector('span[data-bind="text: productName"]').innerText;
        const inputField1 = document.querySelector('span[data-bind="validationMessage: newPrice"]').previousElementSibling;
        const inputField2 = document.querySelector('span[data-bind="validationMessage: quantity"]').previousElementSibling;
        Object.keys(message.inventoryProduct).forEach((item, index) => {
            if (item === productName) {
                console.log(item);
                inputField1.value = result.inventoryProduct[item].price;
                inputField2.value = result.inventoryProduct[item].count;
                const saveBtn = document.querySelector('input[value="Save"]');
                saveBtn.click();
            }
        })
    } catch (error) {
        console.error(error);
    }
}

window.addEventListener('load', () => {
    if (window.location.href === "https://www.tcgplayer.com/login?returnUrl=https://store.tcgplayer.com/admin/product/catalog") {
        var emailInput = document.querySelector('input[type="email"]');
        var passwordInput = document.querySelector('input[type="password"]');

        if (emailInput && passwordInput) {
            // Simulate user input by setting input values directly
            emailInput.value = 'izzyprintingllc@gmail.com';
            passwordInput.value = 'Pencil1234!!';
            emailInput.dispatchEvent(new Event('input'));
            passwordInput.dispatchEvent(new Event('input'));

            // Get the submit button
            var submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                // Click the submit button to initiate login
                submitButton.click();
            } else {
                console.error('Submit button not found.');
            }
        }
    }
    if (window.location.href === "https://store.tcgplayer.com/admin/product/catalog") {
        chrome.storage.local.get(['inventoryStatus', 'product', 'bulkStatus', 'bulkproduct'], function (result) {
            if (result.inventoryStatus === "login") {
                console.log(result.inventoryStatus);
                setTimeout(() => {
                    GetAllProductsByNextPage();
                    window.close();
                }, 2000);
                chrome.local.storage.clear(() => {
                    console.log("success clear!!!");
                })
            }
        });
    }

    if (document.querySelector('input[value="Clear Inventory"]')) {
        chrome.storage.local.get(['inventoryStatus', 'inventoryProduct', 'bulkStatus', 'bulkproduct'], function (result) {
            if (result.inventoryStatus === "manage" || result.inventoryStatus === "add") {
                insertAndupdateData().then(() => {
                    // window.close();
                })
            }

            else if (result.bulkStatus === 'add' || result.bulkStatus === 'manage') {
                scrapeBulkData().then(() => {
                    window.close();
                })
                    .catch((error) => {
                        console.error('Error occurred during data scraping:', error);
                    });
            }
        });
    }
});

window.addEventListener('message', event => {
    if (event.source === window && event.data.type && (event.data.type === 'addMyInventory')) {
        chrome.runtime.sendMessage({ type: 'addMyInventory', products: event.data.products });
    }

    if (event.source === window && event.data.type && (event.data.type === 'manageMyInventory')) {
        chrome.runtime.sendMessage({ type: 'manageMyInventory', products: event.data.products });
    }

    if (event.source === window && event.data.type && (event.data.type === 'startScraping')) {
        chrome.runtime.sendMessage({ type: 'startScraping' });
    }

    if (event.source === window && event.data.type && (event.data.type === 'bulkManageProducts')) {
        chrome.runtime.sendMessage({ type: 'bulkManageProducts', products: event.data.products });
    }

    if (event.source === window && event.data.type && (event.data.type === 'bulkAddProducts')) {
        chrome.runtime.sendMessage({ type: 'bulkAddProducts', products: event.data.products });
    }
});
