function scrapeDataFromCurrentPage() {
    try {
        const productLines = Array.from(document.querySelectorAll('td[data-bind="text: ProductLine"]'))
            .map(titleElement => titleElement.innerText);
        const views = Array.from(document.querySelectorAll('.product-image-thumbnail'))
            .map(titleElement => titleElement.getAttribute('src'));
        const productNames = Array.from(document.querySelectorAll('span[data-bind="text: ProductName"]'))
            .map(titleElement => titleElement.innerText);
        const sets = Array.from(document.querySelectorAll('span[data-bind="text: SetName"]'))
            .map(titleElement => titleElement.innerText);
        const rarities = Array.from(document.querySelectorAll('td[data-bind="text: DisplayedNumber"]'))
            .map(titleElement => titleElement.previousElementSibling.innerText);
        const numbers = Array.from(document.querySelectorAll('td[data-bind="text: DisplayedNumber"]'))
            .map(titleElement => titleElement.innerText);
        const instocks = Array.from(document.querySelectorAll('span[data-bind="text: InStock"]'))
            .map(titleElement => titleElement.innerText);

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
                instocks: instocks
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
            if (element.innerText === parameter) {
                console.log(element.innerText);
                element.parentNode.lastElementChild.childNode.click()
            }
        });
    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

function SearchProductByNextPage(parameter) {
    const nextPageButton = document.querySelector('.pager').lastElementChild.previousElementSibling;
    // If the "Next" button exists, click it and scrape data
    if (nextPageButton) {
        setTimeout(() => {
            searchDataFromCurrentPage(parameter);
            SearchProductByNextPage(parameter);
        }, 2000);
        nextPageButton.click();
    }
}

// Define a function to navigate to the next page
function GetAllProductsByNextPage() {
    const nextPageButton = document.querySelector('.pager').lastElementChild.previousElementSibling;
    // If the "Next" button exists, click it and scrape data
    if (nextPageButton) {
        setTimeout(() => {
            scrapeDataFromCurrentPage();
            GetAllProductsByNextPage();
        }, 2000);
        nextPageButton.click();
    }
}

window.addEventListener('load', () => {
    var emailInput = document.querySelector('input[type="email"]');
    var passwordInput = document.querySelector('input[type="password"]');

    if (emailInput && passwordInput) {
        // Simulate user input by setting input values directly
        emailInput.value = 'izzyprintingllc@gmail.com';
        passwordInput.value = 'Password1234!!';

        // Trigger input events to simulate user interaction
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
    if (window.location.href === "https://store.tcgplayer.com/admin/product/catalog") {
        chrome.storage.local.get(['inventoryStatus', 'product'], function (result) {
            if (result.inventoryStatus === "manageProductToInventory") {
                console.log(result.inventoryStatus);
                const checkButton = document.querySelector('#OnlyMyInventoryLabel');
                if (checkButton) checkButton.click();
                const searchButton = document.querySelector('#Search');
                if (searchButton) searchButton.click();
                var urlChangeInterval = setInterval(() => {
                    // Perform scraping process here
                    SearchProductByNextPage(result.product.product.productname);
                    var scrapingCompleted = false;
                    if (scrapingCompleted) {
                        // Clear the interval and close the URL
                        clearInterval(urlChangeInterval);
                        window.close(); // Close the current tab or window
                    }
                }, 500);
            }
            if (result.inventoryStatus === "addProductToInventory") {
                var urlChangeInterval = setInterval(() => {
                    // Perform scraping process here
                    SearchProductByNextPage(result.product.product.productname);
                    var scrapingCompleted = false;
                    if (scrapingCompleted) {
                        // Clear the interval and close the URL
                        clearInterval(urlChangeInterval);
                        window.close(); // Close the current tab or window
                    }
                }, 500);
            }
            if (result.inventoryStatus === "login") {
                var urlChangeInterval = setInterval(() => {
                    // Perform scraping process here
                    GetAllProductsByNextPage();
                    var scrapingCompleted = false;
                    if (scrapingCompleted) {
                        // Clear the interval and close the URL
                        clearInterval(urlChangeInterval);
                        window.close(); // Close the current tab or window
                    }
                }, 500);
            }
        });
    }
});

window.addEventListener('message', event => {
    if (event.source === window && event.data.type && (event.data.type === 'addProductToInventory')) {
        chrome.runtime.sendMessage({ type: 'addProductToInventory', product: event.data.product });
    }

    if (event.source === window && event.data.type && (event.data.type === 'manageProductToInventory')) {
        chrome.runtime.sendMessage({ type: 'manageProductToInventory', product: event.data.product });
    }
});
