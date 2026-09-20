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
    // 💸 3. 家計簿の月別管理 ＆ 自動セーブ（LocalStorage）システム
    // =======================================================
    // 💾 ブラウザのセーブデータから過去の記録を読み込む。無ければ空っぽの配列を作る。
    let transactions = JSON.parse(localStorage.getItem("kakeibo-transactions")) || [];
    let monthlyIncome = parseInt(localStorage.getItem("kakeibo-income")) || 0; 
    
    // ⏰ 初期表示する月を「現在の年月（例: 2026-09）」に自動セットする
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    let selectedYearMonth = currentYearMonth;

    // 🧱 画面の要素を取得
    const kakeiboForm = document.getElementById("kakeibo-form");
    const salaryForm = document.getElementById("salary-form");
    const salaryAmountInput = document.getElementById("salary-amount");
    const totalPriceSpan = document.getElementById("total-price");
    const balancePriceSpan = document.getElementById("balance-price");
    const historyList = document.getElementById("history-list");
    const emptyMessage = document.getElementById("empty-message");
    const monthFilter = document.getElementById("month-filter");

    // ⏰ 最初から日付入力欄に「今日の日付」を自動で入れてあげる優しい配慮
    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = today.toISOString().substring(0, 10);
    }

    // 💰 給料設定の処理（自動セーブ対応）
    if (salaryForm) {
        // 給与入力欄に前回設定した手取りを最初から表示しておく
        if (salaryAmountInput && monthlyIncome > 0) {
            salaryAmountInput.value = monthlyIncome;
        }

        salaryForm.addEventListener("submit", function(e) {
            e.preventDefault();
            if (!salaryAmountInput) return;

            monthlyIncome = parseInt(salaryAmountInput.value) || 0;
            
            // 💾 ローカルストレージに手取りを永続保存！
            localStorage.setItem("kakeibo-income", monthlyIncome);

            updateApp();
            alert(`毎月の手取り金額を ¥${monthlyIncome.toLocaleString()} に保存しました！`);
        });
    }

    // 📥 支出登録の処理（自動セーブ＆月スタンプ対応）
    if (kakeiboForm) {
        kakeiboForm.addEventListener("submit", function(e) {
            e.preventDefault(); 

            const amountInput = document.getElementById("amount");
            const categoryInput = document.getElementById("category");
            const memoInput = document.getElementById("memo");

            if (!amountInput || !categoryInput || !dateInput) return;

            const amount = parseInt(amountInput.value);
            const category = categoryInput.value;
            const fullDate = dateInput.value; // 例: "2026-09-20"
            const memo = memoInput ? (memoInput.value || "なし") : "なし";

            // 💡 日付の文字の頭から7文字を切り取って「月スタンプ」を作る（例: "2026-09"）
            const yearMonthStamp = fullDate.substring(0, 7);

            const newTransaction = {
                id: Date.now(), 
                amount: amount,
                category: category,
                date: fullDate,
                yearMonth: yearMonthStamp, // 💡 これがフォルダ分けの鍵になります！
                memo: memo
            };
            transactions.push(newTransaction);

            // 💾 ローカルストレージに家計簿データを永永保存！
            localStorage.setItem("kakeibo-transactions", JSON.stringify(transactions));

            // 今入力したデータの月に自動で表示を切り替える
            selectedYearMonth = yearMonthStamp;

            updateApp();
            
            // 次の入力のために金額とメモだけ消す（日付とカテゴリーは連続入力しやすいように残す）
            amountInput.value = "";
            if (memoInput) memoInput.value = "";
        });
    }

    // 🔄 ドロップダウンメニュー（月選択）が切り替わった時の処理
    if (monthFilter) {
        monthFilter.addEventListener("change", function() {
            selectedYearMonth = monthFilter.value;
            updateApp();
        });
    }

    // 🌟 月別メニューの選択肢を自動生成する関数
    function updateMonthOptions() {
        if (!monthFilter) return;

        // 📁 今まで登録したデータから「存在する年月」を重複なしで集める
        const months = new Set();
        months.add(currentYearMonth); // 今月は必ず選択肢に入れる
        transactions.forEach(t => {
            if (t.yearMonth) months.add(t.yearMonth);
        });

        // 集めた月を配列にして並び替える（新しい月が上）
        const sortedMonths = Array.from(months).sort().reverse();

        // 選択肢のHTMLを組み立てる
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

    // 🌟 画面の数値を再計算してリフレッシュする関数（まとめ役）
    function updateApp() {
        // 月のドロップダウンメニューの選択肢を最新にする
        updateMonthOptions();

        // 💡 【重要】「現在選択されている月」のデータだけをフィルターにかけて抽出する！
        const filteredTransactions = transactions.filter(t => t.yearMonth === selectedYearMonth);

        // ① 選択された月だけの支出合計を計算
        const selectedMonthTotal = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
        if (totalPriceSpan) {
            totalPriceSpan.textContent = selectedMonthTotal.toLocaleString();
        }

        // ② 残金の計算（手取り － 選択された月の支出合計）
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

        // ③ 選択された月だけの履歴カードを表示する
        if (!historyList) return;
        historyList.innerHTML = "";

        if (filteredTransactions.length === 0) {
            if (emptyMessage) historyList.appendChild(emptyMessage);
            return;
        }

        // 新しい日付の記録が上に並ぶように逆順でループ
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
