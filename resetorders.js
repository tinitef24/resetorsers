// ==UserScript==
// @name         ArbitTerminal: Reset Max Orders
// @version      1.9
// @description  Adds a button to reset all "Max orders" to 0 with a native-style exclusion list.
// @author       @an200885
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'arbit_terminal_excluded_coins';

    // Впровадження стилів для кнопки та меню
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-reset-wrapper {
            display: inline-flex !important;
            margin-left: 10px !important;
            position: relative !important;
            height: 38px !important; /* Трохи вище, щоб відповідати іншим кнопкам */
            order: 999 !important;
        }
        .custom-reset-btn {
            padding: 0 16px !important;
            border: none !important;
            border-radius: 4px 0 0 4px !important;
            background-color: #006edb !important;
            color: white !important;
            cursor: pointer !important;
            font-weight: 500 !important;
            font-size: 14px !important;
            transition: background-color 0.2s ease !important;
            display: inline-flex !important;
            align-items: center !important;
            height: 100% !important;
            white-space: nowrap !important;
        }
        .custom-reset-dropdown {
            padding: 0 10px !important;
            border: none !important;
            border-left: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 0 4px 4px 0 !important;
            background-color: #006edb !important;
            color: white !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100% !important;
            transition: background-color 0.2s ease !important;
        }
        .custom-reset-btn:hover, .custom-reset-dropdown:hover {
            background-color: #005bb7 !important;
        }
        .custom-reset-btn:active, .custom-reset-dropdown:active {
            background-color: #0050a3 !important;
        }
        .custom-reset-menu {
            display: none;
            position: absolute;
            top: calc(100% + 5px);
            right: 0;
            background: #111111 !important;
            border: 1px solid #333 !important;
            border-radius: 6px !important;
            padding: 14px !important;
            z-index: 10000 !important;
            width: 240px !important;
            box-shadow: 0 8px 20px rgba(0,0,0,0.6) !important;
            color: #fff !important;
            font-family: sans-serif !important;
        }
        .custom-reset-menu.show {
            display: block !important;
        }
        .custom-reset-menu h4 {
            margin: 0 0 10px 0 !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #999 !important;
            text-transform: uppercase !important;
            display: flex !important;
            align-items: center !important;
            letter-spacing: 0.5px !important;
        }
        .custom-reset-menu h4 svg {
            margin-right: 8px;
        }
        .exclude-textarea {
            width: 100% !important;
            background: #1a1a1a !important;
            color: #fff !important;
            border: 1px solid #444 !important;
            padding: 8px !important;
            border-radius: 4px !important;
            font-family: monospace !important;
            font-size: 13px !important;
            resize: vertical !important;
            min-height: 70px !important;
            box-sizing: border-box !important;
            outline: none !important;
        }
        .exclude-textarea:focus {
            border-color: #006edb !important;
        }
        .exclude-hint {
            font-size: 11px !important;
            color: #777 !important;
            margin-top: 10px !important;
            line-height: 1.5 !important;
        }
        .exclude-hint b {
            color: #aaa !important;
        }
    `;
    document.head.appendChild(style);

    // Отримання списку виключень
    const getExcludedCoins = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        return saved.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    };

    // Збереження списку виключень
    const saveExcludedCoins = (text) => {
        localStorage.setItem(STORAGE_KEY, text);
    };

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

    // Спроба знайти символ монети в картці
    const getCoinSymbol = (card) => {
        // Зазвичай символ знаходиться в заголовку або в елементі з назвою пари
        const titleEl = card.querySelector('.title, .pair, .symbol, b, strong');
        if (titleEl) {
            const text = titleEl.textContent.trim().toUpperCase();
            // Беремо перше слово (наприклад, "MEGA" з "MEGA / USDT")
            return text.split(/[^A-Z0-9]/)[0];
        }
        return '';
    };

    // Основна логіка скидання
    const resetAndSaveMaxOrders = async () => {
        const excluded = getExcludedCoins();
        const cards = document.querySelectorAll('.trade-card');

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const symbol = getCoinSymbol(card);

            if (symbol && excluded.includes(symbol)) {
                console.log(`[ResetOrders] Skipping excluded coin: ${symbol}`);
                continue;
            }

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
        if (document.getElementById('reset-max-orders-wrapper')) return;

        const containers = document.querySelectorAll('.save-api-keys');
        if (containers.length > 0) {
            const targetContainer = containers[0];

            const wrapper = document.createElement('div');
            wrapper.id = 'reset-max-orders-wrapper';
            wrapper.className = 'custom-reset-wrapper';

            const resetBtn = document.createElement('button');
            resetBtn.innerText = 'Reset Orders to 0';
            resetBtn.className = 'custom-reset-btn';
            resetBtn.onclick = (e) => {
                e.preventDefault();
                resetAndSaveMaxOrders();
            };

            const dropdownBtn = document.createElement('button');
            dropdownBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9l6 6 6-6"></path>
                </svg>
            `;
            dropdownBtn.className = 'custom-reset-dropdown';

            const menu = document.createElement('div');
            menu.className = 'custom-reset-menu';
            menu.innerHTML = `
                <h4>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Виключені монети
                </h4>
                <textarea class="exclude-textarea" placeholder="e.g. MEGA, ALL, XEM" spellcheck="false">${localStorage.getItem(STORAGE_KEY) || ''}</textarea>
                <div class="exclude-hint">
                    Монети в цьому списку будуть <b>пропущені</b> при процесі скидання. 
                    <br><br>
                    Розділяйте символи <b>комами</b>.
                </div>
            `;

            const textarea = menu.querySelector('textarea');
            textarea.oninput = (e) => {
                saveExcludedCoins(e.target.value);
            };

            dropdownBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                menu.classList.toggle('show');
            };

            // Закриття меню при кліку зовні
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });

            wrapper.appendChild(resetBtn);
            wrapper.appendChild(dropdownBtn);
            wrapper.appendChild(menu);
            targetContainer.appendChild(wrapper);
        }
    };

    // Спостерігач за змінами DOM для підтримки SPA
    const observer = new MutationObserver(injectButton);
    observer.observe(document.body, { childList: true, subtree: true });

    injectButton();
})();
