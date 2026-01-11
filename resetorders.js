// ==UserScript==
// @name         ArbitTerminal: Reset Max Orders
// @version      1.6
// @description  Adds a button to reset all "Max orders" to 0 and save changes across all cards.
// @author       @an200885
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Впровадження стилів для кнопки
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-reset-btn {
            margin-left: 10px !important;
            padding: 6px 14px !important;
            border: none !important;
            border-radius: 4px !important;
            background-color: #007bff !important;
            color: white !important;
            cursor: pointer !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            transition: all 0.2s ease !important;
            display: inline-flex !important;
            align-items: center !important;
            height: 34px !important;
            order: 999 !important; /* Гарантує позицію справа в flex-контейнері */
        }
        .custom-reset-btn:hover {
            background-color: #0062cc !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }
        .custom-reset-btn:active {
            transform: scale(0.96) !important;
        }
    `;
    document.head.appendChild(style);

    // Функція для оновлення стану React
    const setReactValue = (input, value) => {
        const lastValue = input.value;
        input.value = value;
        const event = new Event('input', { bubbles: true });
        const tracker = input._valueTracker;
        if (tracker) tracker.setValue(lastValue);
        input.dispatchEvent(event);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Основна логіка скидання
    const resetAndSaveMaxOrders = async () => {
        const cards = document.querySelectorAll('.trade-card');

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const fieldGroups = card.querySelectorAll('.field-group');

            let targetInput = null;
            let saveButton = null;

            fieldGroups.forEach(group => {
                if (group.textContent.includes('Max orders:')) {
                    targetInput = group.querySelector('input');
                    saveButton = group.querySelector('button');
                }
            });

            if (targetInput && saveButton && targetInput.value !== '0') {
                targetInput.focus();
                setReactValue(targetInput, '0');
                targetInput.blur();

                await new Promise(r => setTimeout(r, 100));

                if (saveButton.disabled) {
                    saveButton.disabled = false;
                }

                saveButton.click();

                // Пауза між збереженнями для стабільності запитів
                await new Promise(r => setTimeout(r, 150));
            }
        }
    };

    // Додавання кнопки в інтерфейс
    const injectButton = () => {
        if (document.getElementById('reset-max-orders-btn')) return;

        const containers = document.querySelectorAll('.save-api-keys');
        if (containers.length > 0) {
            const targetContainer = containers[0];

            const resetBtn = document.createElement('button');
            resetBtn.id = 'reset-max-orders-btn';
            resetBtn.innerText = 'Reset Orders to 0';
            resetBtn.className = 'custom-reset-btn';

            resetBtn.onclick = (e) => {
                e.preventDefault();
                resetAndSaveMaxOrders();
            };

            targetContainer.appendChild(resetBtn);
        }
    };

    // Спостерігач за змінами DOM для підтримки SPA
    const observer = new MutationObserver(injectButton);
    observer.observe(document.body, { childList: true, subtree: true });

    injectButton();
})();