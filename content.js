async function runAfterModalLoaded() {
    const modal = document.querySelector("ul.is-modal");
    if (modal) {
        console.log(modal.children.length);
        let total = 0;
        let count = 0;
        if (modal.children.length >= 10) {
            for (let item of modal.children) {
                const price = parseFloat(item?.children[3]?.innerText.replace("$", "")) || 0;
                if (!isNaN(price)) {
                    total += price;
                    count++;
                    if (count === 10) {
                        return total / count;
                    }
                }
            }
        }
        return count > 10 ? total / count : 0;
    }
    else return 0;
}

function observeModalLoading() {
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const modal = document.querySelector("ul.is-modal");
                    if (modal) {
                        observer.disconnect(); // Stop observing once the modal is found
                        const averagePrice = runAfterModalLoaded();
                        resolve(averagePrice);
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Timeout to stop observing after 30 seconds
        setTimeout(() => {
            observer.disconnect();
            reject(new Error('Modal did not load within timeout period.'));
        }, 30000);
    });
}

function activateModalAndObserve() {
    return new Promise((resolve, reject) => {
        const modalButton = document.querySelector(".modal__activator");
        if (modalButton) {
            modalButton.click();
            observeModalLoading().then(resolve).catch(reject);
        } else {
            reject(new Error('.modal__activator button not found'));
        }
    });
}

function scrapeOrderFromCurrentPage() {
    try {
        const OrderNumbers = Array.from(document.querySelectorAll('td[data-label="Order #"]'))
            .map(lineElement => lineElement.children[0].children[0].children[0].innerText);
        const buyerNames = Array.from(document.querySelectorAll('td[data-label="Buyer Name"]'))
            .map(buyerElement => buyerElement.innerText);
        const orderDates = Array.from(document.querySelectorAll('td[data-label="Order Date"]'))
            .map(dateElement => dateElement.innerText);
        const statuses = Array.from(document.querySelectorAll('td[data-label="Status"]'))
            .map(statusElement => statusElement.innerText);
        const shippingTypes = Array.from(document.querySelectorAll('td[data-label="Shipping Type"]'))
            .map(typeElement => typeElement.innerText);
        const ProductAmts = Array.from(document.querySelectorAll('td[data-label="Product Amt"]'))
            .map(productAmtElement => productAmtElement.innerText);
        const shippingAmts = Array.from(document.querySelectorAll('td[data-label="Shipping Amt"]'))
            .map(shippingAmtElement => shippingAmtElement.innerText);
        const totalAmts = Array.from(document.querySelectorAll('td[data-label="Total Amt"]'))
            .map(totalAmtElement => totalAmtElement.innerText);
        const buyerPaids = Array.from(document.querySelectorAll('td[data-label="BuyerPaid"]'))
            .map(buyerPaidElement => buyerPaidElement.innerText);
        const links = Array.from(document.querySelectorAll('td[data-label="Order #"]'))
            .map(lineElement => lineElement.children[0].children[0].children[0].getAttribute('href'));

        const data = OrderNumbers.map((OrderNumber, index) => ({
            OrderNumber,
            buyerName: buyerNames[index] || null,
            orderDate: orderDates[index] || null,
            status: statuses[index] || null,
            shippingType: shippingTypes[index] || null,
            productAmt: ProductAmts[index] || null,
            shippingAmt: shippingAmts[index] || null,
            totalAmt: totalAmts[index] || null,
            buyerPaid: buyerPaids[index] || null,
            link: links[index] || null
        }));

        chrome.runtime.sendMessage({ action: 'scrapedOrder', data: data });
    } catch (error) {
        console.error('Error scraping order:', error);
    }
}

function GetAllOrdersByNextPage() {
    const nextPageButton = document.querySelector('.pagination-next');
    if (nextPageButton) {
        scrapeOrderFromCurrentPage();

        // Temporarily change display style to make it clickable
        const originalDisplay = nextPageButton.style.display;
        nextPageButton.style.display = 'block';

        setTimeout(() => {
            nextPageButton.click();

            // Restore original display style after clicking
            nextPageButton.style.display = originalDisplay;
            GetAllOrdersByNextPage();
        }, 5000);
    } else {
        window.close();
    }
}

window.addEventListener('load', () => {
    if (window.location.href === "https://www.tcgplayer.com/login?returnUrl=https://www.tcgplayer.com/search/sorcery-contested-realm/product?productLineName=sorcery-contested-realm&view=grid") {
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');

        if (emailInput && passwordInput) {
            emailInput.value = 'izzyprintingllc@gmail.com';
            passwordInput.value = 'Pencil1234!!';
            emailInput.dispatchEvent(new Event('input'));
            passwordInput.dispatchEvent(new Event('input'));
            const submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            } else {
                console.error('Submit button not found.');
            }
        }
    }

    else if (window.location.href.includes("https://www.tcgplayer.com/search")) {
        setInterval(() => {
            const productLines = Array.from(document.querySelectorAll('h3.product-card__category-name'))
                .map(lineElement => lineElement.innerText);
            const rarityElements = Array.from(document.querySelectorAll('.product-card__rarity'))
                .map(viewElement => viewElement.children[0].innerText);
            const sets = Array.from(document.querySelectorAll('.product-card__set-name'))
                .map(setElement => setElement.innerText);
            const productNames = Array.from(document.querySelectorAll('span.product-card__title.truncate'))
                .map(nameElement => nameElement.innerText);
            const links = Array.from(document.querySelectorAll('.product-card__content'))
                .map(linkElement => linkElement.children[0].getAttribute('href'));
            const nextbtn = document.querySelector("a[aria-label='Next page']");

            const data = productLines.map((productLine, index) => ({
                productLine,
                set: sets[index] || null,
                productName: productNames[index] || null,
                rarity: rarityElements[index] || null,
                link: links[index] || null
            }));

            chrome.runtime.sendMessage({ action: 'scrapedCard', data: data });
            nextbtn.click();
        }, 10000);
    }

    else if (window.location.href.includes('https://store.tcgplayer.com/admin/product/manage')) {
        chrome.storage.local.get(['inventoryProduct', 'bulkStatus'], function (result) {
            if (result.bulkStatus === 'getAllSaveInfo') {
                const lowestPrice = document.querySelector('span[data-bind="formatCurrency: lowestPrice"]')?.innerText;
                const lastSoldPrice = document.querySelector('span[data-bind="formatCurrency: lowestPrice"]')?.innerText;
                const lastSoldShipping = document.querySelector('span[data-bind="formatCurrency: lastSoldShipping"]')?.innerText;
                const marketPrice = document.querySelector('span[data-bind="formatCurrency: marketPrice"]')?.innerText;

                chrome.runtime.sendMessage({
                    action: 'scrapeCardSaveInfo',
                    data: {
                        link: window.location.href,
                        lowestPrice: lowestPrice || 0,
                        lastSoldPrice: lastSoldPrice || 0,
                        lastSoldShipping: lastSoldShipping || 0,
                        marketPrice: marketPrice || 0
                    },
                    message: 'success'
                }, function () {
                    console.log("scrape carddetail");
                });
            } else if (result.bulkStatus === "updateCard") {
                console.log(result.bulkStatus, result.inventoryProduct);
                const productName = document.querySelector('span[data-bind="text: productName"]').innerText;
                const inputField1 = document.querySelector('span[data-bind="validationMessage: newPrice"]').previousElementSibling;
                const inputField2 = document.querySelector('span[data-bind="validationMessage: quantity"]').previousElementSibling;

                Object.keys(result.inventoryProduct).forEach((item, index) => {
                    if (item === productName) {
                        inputField1.value = result.inventoryProduct[item].price;
                        inputField2.value = result.inventoryProduct[item].count;
                        inputField1.dispatchEvent(new Event('input'));
                        inputField2.dispatchEvent(new Event('input'));
                        const saveBtn = document.querySelector('input[value="Save"]');
                        if (saveBtn) saveBtn.click();
                    }
                });

                chrome.runtime.sendMessage({
                    action: 'updatecard',
                    link: window.location.href,
                    message: 'success'
                }, function () {
                    console.log("card update");
                });
            }
        });
    }

    else if (window.location.href.includes("https://www.tcgplayer.com/product/")) {
        setInterval(() => {
            const selector = Array.from(document.querySelectorAll('strong'));
            const ListPrices = Array.from(document.querySelectorAll('.listing-item__listing-data__info__price'));
            let elementElem = null;
            let rarityElem = null;
            let cardCategoryElem = null;
            let cardTypeElem = null;
            let toplowestListPrice = null;
            let mediumlowestListPrice = null;
            let bottomlowestListPrice = null;

            if (selector && ListPrices) {
                selector.forEach((item) => {
                    if (item.innerText === 'Element:') elementElem = item.nextElementSibling.innerText;
                    if (item.innerText === 'Rarity:') rarityElem = item.nextElementSibling.innerText;
                    if (item.innerText === 'Card Category:') cardCategoryElem = item.nextElementSibling.innerText;
                    if (item.innerText === 'Card Type:') cardTypeElem = item.nextElementSibling.innerText;
                });

                toplowestListPrice = ListPrices[2]?.innerText || '0$';
                mediumlowestListPrice = ListPrices[1]?.innerText || '0$';
                bottomlowestListPrice = ListPrices[0]?.innerText || '0$';

                activateModalAndObserve().then(averagePrice => {
                    chrome.runtime.sendMessage({
                        action: 'cardDetail',
                        data: {
                            element: elementElem,
                            cardCategory: cardCategoryElem,
                            cardType: cardTypeElem,
                            rarity: rarityElem,
                            link: window.location.href,
                            latestPriceAverage: averagePrice,
                            toplowestListPrice: parseFloat(toplowestListPrice.replace("$", "")) || 0,
                            mediumlowestListPrice: parseFloat(mediumlowestListPrice.replace("$", "")) || 0,
                            bottomlowestListPrice: parseFloat(bottomlowestListPrice.replace("$", "")) || 0
                        },
                        message: 'success getCardDetail'
                    });
                }).catch((error) => {
                    console.log("error");
                })
            }
        }, 8000);
    }

    else if (window.location.href === "https://store.tcgplayer.com/admin/orders/orderlist") {
        chrome.storage.local.get(['inventoryStatus'], function (result) {
            if (result.inventoryStatus === "order") {
                GetAllOrdersByNextPage();
            }
        });
    }

    else if (window.location.href === "https://store.tcgplayer.com/admin/product/catalog") {
        const myInventoryOnly = document.querySelector("label#OnlyMyInventoryLabel");
        const searchBtn = document.querySelector("input#Search");

        async function clickElement(element) {
            if (element) {
                element.click();
                console.log(`Clicked on: ${element.id || element.className || element.tagName}`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds after click
            } else {
                console.log('Element not found:', element);
            }
        }

        function scrapeInventory() {
            const links = Array.from(document.querySelectorAll('span[data-bind="text: ProductName"]'))
                .map(nameElement => nameElement.parentElement.getAttribute("href")).filter(item => item !== null);
            const inStocks = Array.from(document.querySelectorAll('span[data-bind="text: InStock"]'))
                .map(stockElement => stockElement.innerText);

            chrome.runtime.sendMessage({
                action: 'MyInventory',
                data: {
                    Links: links,
                    InStocks: inStocks
                },
                message: 'success getMyInventory'
            });

            // Check if there's a next button to click
            const nextBtn = document.querySelector("div.pager").lastElementChild.previousElementSibling;
            if (nextBtn) {
                nextBtn.click();
            } else {
                clearInterval(intervalId);
            }
        }

        async function main() {
            await clickElement(myInventoryOnly);
            await clickElement(searchBtn);

            // Wait for search results to load using MutationObserver
            await new Promise(resolve => {
                const observer = new MutationObserver((mutationsList, observer) => {
                    for (let mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            // Check if search results have loaded (adjust selector as needed)
                            const addBtn = Array.from(document.querySelectorAll('a.blue-button-sm-darker'))
                                .filter(btnElement => btnElement.innerText === 'Add');
                            if (addBtn.length > 0) {
                                clearInterval(intervalId);
                                scrapeInventory();
                                observer.disconnect();
                                resolve();
                            }
                        }
                    }
                });
                observer.observe(document.querySelector('body'), { childList: true, subtree: true });
            });

            // Start scraping at regular intervals
            intervalId = setInterval(scrapeInventory, 5000);
        }

        let intervalId; // Declare intervalId here

        main().catch(err => console.error('Error in main:', err));
    }
});

window.addEventListener('message', event => {
    if (event.source === window && event.data.type) {
        const { type, products } = event.data;
        switch (type) {
            case 'manageMyInventory':
                chrome.runtime.sendMessage({ type: 'manageMyInventory', products });
                break;
            case 'fetchCard':
                chrome.runtime.sendMessage({ type: 'fetchCard' });
                break;
            case 'fetchCardDetail':
                chrome.runtime.sendMessage({ type: 'fetchCardDetail', products });
                break;
            case 'fetchSaveInfo':
                chrome.runtime.sendMessage({ type: 'fetchSaveInfo', products });
                break;
            case 'fetchOrder':
                chrome.runtime.sendMessage({ type: 'fetchOrder' });
                break;
            case 'fetchSelectCardDetail':
                chrome.runtime.sendMessage({ type: 'fetchSelectCardDetail', products });
                break;
            case 'myInventoryOnly':
                chrome.runtime.sendMessage({ type: 'myInventoryOnly' });
                break;
        }
    }
});
