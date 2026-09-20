document.addEventListener("touchstart", function() {}, {passive: true});

window.addEventListener("DOMContentLoaded", function() {
    
    // =======================================================
    // 📺 1. 5大メニューの画面遷移（タブ切り替え）システム
    // =======================================================
    const navItems = document.querySelectorAll(".nav-item");
    const appScreens = document.querySelectorAll(".app-screen");

    if (navItems.length > 0 && appScreens.length > 0) {
        navItems.forEach(function(item) {
            item.addEventListener("click", function() {
                const targetScreenId = item.getAttribute("data-target");
                
                navItems.forEach(i => i.classList.remove("active"));
                appScreens.forEach(s => s.classList.remove("active"));
                
                item.classList.add("active");
                const targetScreen = document.getElementById(targetScreenId);
                if (targetScreen) {
                    targetScreen.classList.add("active");
                }
            });
        });
    }

    // =======================================================
    // ⚙️ 2. スキン着せ替えシステム（セーブ機能付き）
    // =======================================================
    const themeButtons = document.querySelectorAll(".theme-btn");
    
    // 🎨 各テーマの色データの箱（設計図 - ちょんちょんを確実に修正しました！）
    const themeStyles = {
        cyber: {
            "--bg-main": "#121214", "--bg-card": "#1a1a1e", "--bg-input": "#0d0d0f",
            "--text-main": "#e2e8f0", "--text-muted": "#64748b",
            "--accent-シアン": "#00f5ff", "--accent-グリーン": "#39ff14",
            "--btn-gradient": "linear-gradient(135deg, #00f5ff 0%, #0055ff 100%)", "--border-color": "#2d2d34"
        },
        cafe: {
            "--bg-main": "#231f1b", "--bg-card": "#2d2722", "--bg-input": "#1c1815",
            "--text-main": "#f5f0eb", "--text-muted": "#8c7e74",
            "--accent-シアン": "#c7a17a", "--accent-グリーン": "#d4af37",
            "--btn-gradient": "linear-gradient(135deg, #c7a17a 0%, #8a6543 100%)", "--border-color": "#423a33"
        },
        pop: {
            "--bg-main": "#26131c", "--bg-card": "#361b27", "--bg-input": "#1a0b12",
            "--text-main": "#fff0f5", "--text-muted": "#a67c90",
            "--accent-シアン": "#ff6b8b", "--accent-グリーン": "#ffde4d",
            "--btn-gradient": "linear-gradient(135deg, #ff6b8b 0%, #ff477e 100%)", "--border-color": "#4d2839"
        },
        light: {
            "--bg-main": "#f8fafc", "--bg-card": "#ffffff", "--bg-input": "#f1f5f9",
            "--text-main": "#0f172a", "--text-muted": "#64748b",
            "--accent-シアン": "#3b82f6", "--accent-グリーン": "#10b981",
            "--btn-gradient": "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", "--border-color": "#e2e8f0"
        }
    };

    themeButtons.forEach(function(btn) {
        btn.addEventListener("click", function() {
            const selectedTheme = btn.getAttribute("data-theme");
            applyTheme(selectedTheme);
            localStorage.setItem("saved-theme", selectedTheme);
        });
    });

    function applyTheme(themeName) {
        const colors = themeStyles[themeName];
        if (!colors) return;
        for (const [key, value] of Object.entries(colors)) {
            document.documentElement.style.setProperty(key, value);
        }
    }

    const savedTheme = localStorage.getItem("saved-theme");
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    // =======================================================
    // 💸 3. 家計簿の月別管理 ＆ 自動セーブ（LocalStorage）システム
    // =======================================================
    let transactions = JSON.parse(localStorage.getItem("kakeibo-transactions")) || [];
    let monthlyIncome = parseInt(localStorage.getItem("kakeibo-income")) || 0; 
    
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    let selectedYearMonth = currentYearMonth;

    const kakeiboForm = document.getElementById("kakeibo-form");
    const salaryForm = document.getElementById("salary-form");
    const salaryAmountInput = document.getElementById("salary-amount");
    const totalPriceSpan = document.getElementById("total-price");
    const balancePriceSpan = document.getElementById("balance-price");
    const historyList = document.getElementById("history-list");
    const emptyMessage = document.getElementById("empty-message");
    const monthFilter = document.getElementById("month-filter");

    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = today.toISOString().substring(0, 10);
    }

    if (salaryForm) {
        if (salaryAmountInput && monthlyIncome > 0) {
            salaryAmountInput.value = monthlyIncome;
        }

        salaryForm.addEventListener("submit", function(e) {
            e.preventDefault();
            if (!salaryAmountInput) return;

            monthlyIncome = parseInt(salaryAmountInput.value) || 0;
            localStorage.setItem("kakeibo-income", monthlyIncome);

            updateApp();
            alert(`毎月の手取り金額を ¥${monthlyIncome.toLocaleString()} に保存しました！`);
        });
    }

    if (kakeiboForm) {
        kakeiboForm.addEventListener("submit", function(e) {
            e.preventDefault(); 

            const amountInput = document.getElementById("amount");
            const categoryInput = document.getElementById("category");
            const memoInput = document.getElementById("memo");

            if (!amountInput || !categoryInput || !dateInput) return;

            const amount = parseInt(amountInput.value);
            const category = categoryInput.value;
            const fullDate = dateInput.value; 
            const memo = memoInput ? (memoInput.value || "なし") : "なし";

            const yearMonthStamp = fullDate.substring(0, 7);

            const newTransaction = {
                id: Date.now(), 
                amount: amount,
                category: category,
                date: fullDate,
                yearMonth: yearMonthStamp, 
                memo: memo
            };
            transactions.push(newTransaction);

            localStorage.setItem("kakeibo-transactions", JSON.stringify(transactions));
            selectedYearMonth = yearMonthStamp;

            updateApp();
            
            amountInput.value = "";
            if (memoInput) memoInput.value = "";
        });
    }

    if (monthFilter) {
        monthFilter.addEventListener("change", function() {
            selectedYearMonth = monthFilter.value;
            updateApp();
        });
    }

    function updateMonthOptions() {
        if (!monthFilter) return;

        const months = new Set();
        months.add(currentYearMonth); 
        transactions.forEach(t => {
            if (t.yearMonth) months.add(t.yearMonth);
        });

        const sortedMonths = Array.from(months).sort().reverse();

        monthFilter.innerHTML = "";
        sortedMonths.forEach(m => {
            const [y, mm] = m.split("-");
            const option = document.createElement("option");
            option.value = m;
            option.textContent = `${y}年${mm}月`;
            if (m === selectedYearMonth) {
                option.selected = true;
            }
            monthFilter.appendChild(option);
        });
    }

    function updateApp() {
        updateMonthOptions();

        const filteredTransactions = transactions.filter(t => t.yearMonth === selectedYearMonth);
        const selectedMonthTotal = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        if (totalPriceSpan) {
            totalPriceSpan.textContent = selectedMonthTotal.toLocaleString();
        }

        const remainingBalance = monthlyIncome - selectedMonthTotal;
        if (balancePriceSpan) {
            balancePriceSpan.textContent = remainingBalance.toLocaleString();
            if (remainingBalance < 0) {
                balancePriceSpan.style.color = "#ff4a4a";
                balancePriceSpan.style.textShadow = "0 0 10px rgba(255, 74, 74, 0.6)";
            } else {
                balancePriceSpan.style.color = "";
                balancePriceSpan.style.textShadow = "";
            }
        }

        if (!historyList) return;
        historyList.innerHTML = "";

        if (filteredTransactions.length === 0) {
            if (emptyMessage) historyList.appendChild(emptyMessage);
            return;
        }

        filteredTransactions.slice().reverse().forEach(function(t) {
            const card = document.createElement("div");
            card.className = "kakeibo-card";
            card.innerHTML = `
                <div class="card-left">
                    <span class="card-category">${t.category}</span>
                    <span class="card-memo">${t.memo}</span>
                    <span class="card-date">${t.date}</span>
                </div>
                <div class="card-right">
                    <span class="card-amount">¥${t.amount.toLocaleString()}</span>
                    <button class="delete-btn" onclick="deleteTransaction(${t.id})">❌</button>
                </div>
            `;
            historyList.appendChild(card);
        });
    }

    window.deleteTransaction = function(id) {
        if (!confirm("この記録を削除してもよろしいですか？")) return;
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem("kakeibo-transactions", JSON.stringify(transactions));
        updateApp();
    };

    updateApp();
});
