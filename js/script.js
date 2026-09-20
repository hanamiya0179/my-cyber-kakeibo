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
    // 💸 3. 家計簿の計算 ＆ 履歴 ＆ 給与引き算システム
    // =======================================================
    let transactions = [];
    let totalExpense = 0;
    let monthlyIncome = 0; // 💡 手取り金額を保存しておく変数（初期値は0円）

    // 🧱 画面の要素をすべて取得
    const kakeiboForm = document.getElementById("kakeibo-form");
    const salaryForm = document.getElementById("salary-form"); // 給料フォーム
    const totalPriceSpan = document.getElementById("total-price");
    const balancePriceSpan = document.getElementById("balance-price"); // 残金表示
    const historyList = document.getElementById("history-list");
    const emptyMessage = document.getElementById("empty-message");

    // 💰 給料入力ボタン（SET INCOME）が押された時の処理
    if (salaryForm) {
        salaryForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const salaryInput = document.getElementById("salary-amount");
            if (!salaryInput) return;

            // 入力された金額を数字に変換して保存
            monthlyIncome = parseInt(salaryInput.value) || 0;

            // 🔄 画面全体の計算をリフレッシュ（残金を再計算する）
            updateApp();
            
            // 入力欄をすっきり空っぽにする
            salaryForm.reset();
            alert(`手取り金額を ¥${monthlyIncome.toLocaleString()} に設定しました！`);
        });
    }

    // 📥 支出登録ボタン（ADD TRANSACTION）が押された時の処理
    if (kakeiboForm) {
        kakeiboForm.addEventListener("submit", function(e) {
            e.preventDefault(); 

            const amountInput = document.getElementById("amount");
            const categoryInput = document.getElementById("category");
            const dateInput = document.getElementById("date");
            const memoInput = document.getElementById("memo");

            if (!amountInput || !categoryInput || !dateInput) return;

            const amount = parseInt(amountInput.value);
            const category = categoryInput.value;
            const date = dateInput.value;
            const memo = memoInput ? (memoInput.value || "なし") : "なし";

            const newTransaction = {
                id: Date.now(), 
                amount: amount,
                category: category,
                date: date,
                memo: memo
            };
            transactions.push(newTransaction);

            updateApp();
            kakeiboForm.reset();
        });
    }

    // 🌟 画面の数値を再計算してリフレッシュする関数（まとめ役）
    function updateApp() {
        if (!totalPriceSpan || !historyList) return;

        // ① 支出の合計を計算
        totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
        totalPriceSpan.textContent = totalExpense.toLocaleString();

        // 💡 ② 【新機能】残金の計算（手取り金額 － 支出の合計）
        const remainingBalance = monthlyIncome - totalExpense;
        if (balancePriceSpan) {
            balancePriceSpan.textContent = remainingBalance.toLocaleString();
            
            // [プチ演出] もし残金がマイナス（赤字）になったら文字を赤く、黒字ならテーマ色にする
            if (remainingBalance < 0) {
                balancePriceSpan.style.color = "#ff4a4a";
                balancePriceSpan.style.textShadow = "0 0 10px rgba(255, 74, 74, 0.6)";
            } else {
                balancePriceSpan.style.color = ""; // CSSの設定（テーマ色）に戻す
                balancePriceSpan.style.textShadow = "";
            }
        }

        // ③ 履歴カードの組み立て（以下は今までと同じ）
        historyList.innerHTML = "";

        if (transactions.length === 0) {
            if (emptyMessage) historyList.appendChild(emptyMessage);
            return;
        }

        transactions.forEach(function(t) {
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
        transactions = transactions.filter(t => t.id !== id);
        updateApp();
    };
});
