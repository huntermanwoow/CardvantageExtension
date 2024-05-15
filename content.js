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
        productElements.forEach(element => {
            if (element.innerText === parameter) {
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
        nextPageButton.click();
        setTimeout(() => {
            searchDataFromCurrentPage(parameter);
            SearchProductByNextPage(parameter);
        }, 1000);
    }
}

// Define a function to navigate to the next page
function GetAllProductsByNextPage() {
    const nextPageButton = document.querySelector('.pager').lastElementChild.previousElementSibling;
    // If the "Next" button exists, click it and scrape data
    if (nextPageButton) {
        nextPageButton.click();
        setTimeout(() => {
            scrapeDataFromCurrentPage();
            GetAllProductsByNextPage();
        }, 1000);
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
        chrome.storage.local.get(['inventoryStatus'], function (result) {
            if (result.inventoryStatus === "manageProductToInventory") {
                SearchProductByNextPage()
            }
            if (result.inventoryStatus === "addProductToInventory") {
                SearchProductByNextPage()
            }
            if (result.inventoryStatus === "login") {
                var urlChangeInterval = setInterval(() => {
                    clearInterval(urlChangeInterval); // Stop checking for URL changes
                    GetAllProductsByNextPage();
                }, 1000);
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
