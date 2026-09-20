document.addEventListener("touchstart", function () { }, { passive: true });

window.addEventListener("DOMContentLoaded", function () {
    const navItems = document.querySelectorAll(".nav-item");
    const appScreens = document.querySelectorAll(".app-screen");

    if (navItems.length > 0 && appScreens.length > 0) {
        navItems.forEach(function (item) {
            item.addEventListener("click", function () {
                const targetId = item.getAttribute("data-target");
                navItems.forEach(function (i) { i.classList.remove("active"); });
                appScreens.forEach(function (s) { s.classList.remove("active"); });
                item.classList.add("active");
                const targetScreen = document.getElementById(targetId);
                if (targetScreen) { targetScreen.classList.add("active"); }
            });
        });
    }

    const themeButtons = document.querySelectorAll(".theme-btn");
    const themeStyles = {
        cyber: { "--bg-main": "#121214", "--bg-card": "#1a1a1e", "--bg-input": "#0d0d0f", "--text-main": "#e2e8f0", "--text-muted": "#64748b", "--accent-cyan": "#00f5ff", "--accent-green": "#39ff14", "--btn-gradient": "linear-gradient(135deg, #00f5ff 0%, #0055ff 100%)", "--border-color": "#2d2d34", "--header-border": "transparent" },
        cafe: { "--bg-main": "#231f1b", "--bg-card": "#2d2722", "--bg-input": "#1c1815", "--text-main": "#f5f0eb", "--text-muted": "#8c7e74", "--accent-cyan": "#c7a17a", "--accent-green": "#d4af37", "--btn-gradient": "linear-gradient(135deg, #c7a17a 0%, #8a6543 100%)", "--border-color": "#423a33", "--header-border": "#c7a17a" },
        pop: { "--bg-main": "#26131c", "--bg-card": "#361b27", "--bg-input": "#1a0b12", "--text-main": "#fff0f5", "--text-muted": "#a67c90", "--accent-cyan": "#ff6b8b", "--accent-green": "#ffde4d", "--btn-gradient": "linear-gradient(135deg, #ff6b8b 0%, #ff477e 100%)", "--border-color": "#4d2839", "--header-border": "#ff6b8b" },
        light: { "--bg-main": "#f8fafc", "--bg-card": "#ffffff", "--bg-input": "#f1f5f9", "--text-main": "#0f172a", "--text-muted": "#64748b", "--accent-cyan": "#3b82f6", "--accent-green": "#10b981", "--btn-gradient": "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", "--border-color": "#e2e2f0", "--header-border": "#0f172a" }
    };

    themeButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const theme = btn.getAttribute("data-theme");
            applyTheme(theme);
            localStorage.setItem("saved-theme", theme);
        });
    });

    function applyTheme(name) {
        const colors = themeStyles[name];
        if (!colors) return;
        document.body.className = "theme-" + name;
        Object.keys(colors).forEach(function (k) { document.documentElement.style.setProperty(k, Reflect.get(colors, k)); });
    }

    const savedTheme = localStorage.getItem("saved-theme") || "cyber";
    applyTheme(savedTheme);
    let transactions = JSON.parse(localStorage.getItem("kakeibo-transactions")) || new Array();
    let monthlyIncome = parseInt(localStorage.getItem("kakeibo-income")) || 0;
    const today = new Date();
    const currentYearMonth = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
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

    if (dateInput) { dateInput.value = today.toISOString().substring(0, 10); }

    if (salaryForm) {
        if (salaryAmountInput && monthlyIncome > 0) { salaryAmountInput.value = monthlyIncome; }
        salaryForm.addEventListener("submit", function (e) {
            e.preventDefault();
            monthlyIncome = parseInt(salaryAmountInput.value) || 0;
            localStorage.setItem("kakeibo-income", monthlyIncome);
            updateApp();
            alert("毎月の手取り金額を保存しました！");
        });
    }

    if (kakeiboForm) {
        kakeiboForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const amountInput = document.getElementById("amount");
            const categoryInput = document.getElementById("category");
            const memoInput = document.getElementById("memo");
            if (!amountInput || !categoryInput || !dateInput) return;
            const fullDate = dateInput.value;
            const yearMonthStamp = fullDate.substring(0, 7);
            transactions.push({ id: Date.now(), amount: parseInt(amountInput.value), category: categoryInput.value, date: fullDate, yearMonth: yearMonthStamp, memo: memoInput.value || "なし" });
            localStorage.setItem("kakeibo-transactions", JSON.stringify(transactions));
            selectedYearMonth = yearMonthStamp;
            updateApp();
            amountInput.value = "";
            if (memoInput) memoInput.value = "";
        });
    }

    if (monthFilter) { monthFilter.addEventListener("change", function () { selectedYearMonth = monthFilter.value; updateApp(); }); }

    function updateMonthOptions() {
        if (!monthFilter) return;
        const months = new Set(); months.add(currentYearMonth);
        transactions.forEach(function (t) { if (t.yearMonth) months.add(t.yearMonth); });
        monthFilter.innerHTML = "";
        Array.from(months).sort().reverse().forEach(function (m) {
            const option = document.createElement("option");
            option.value = m; option.textContent = m.substring(0, 4) + "年" + m.substring(5, 7) + "月";
            if (m === selectedYearMonth) { option.selected = true; }
            monthFilter.appendChild(option);
        });
    }
    function updateApp() {
        updateMonthOptions();
        const filtered = new Array();
        for (let i = 0; i < transactions.length; i++) { if (transactions[i].yearMonth === selectedYearMonth) { filtered.push(transactions[i]); } }
        let total = 0;
        for (let j = 0; j < filtered.length; j++) { total += filtered[j].amount; }
        if (totalPriceSpan) { totalPriceSpan.textContent = total.toLocaleString(); }
        if (balancePriceSpan) {
            const remain = monthlyIncome - total; balancePriceSpan.textContent = remain.toLocaleString();
            if (remain < 0) { balancePriceSpan.style.color = "#ff4a4a"; balancePriceSpan.style.textShadow = "0 0 10px rgba(255,74,74,0.6)"; }
            else { balancePriceSpan.style.color = ""; balancePriceSpan.style.textShadow = ""; }
        }
        if (!historyList) return; historyList.innerHTML = "";
        if (filtered.length === 0) { if (emptyMessage) historyList.appendChild(emptyMessage); return; }
        filtered.slice().reverse().forEach(function (t) {
            const card = document.createElement("div"); card.className = "kakeibo-card";
            const left = document.createElement("div"); left.className = "card-left";
            const c = document.createElement("span"); c.className = "card-category"; c.textContent = t.category;
            const m = document.createElement("span"); m.className = "card-memo"; m.textContent = t.memo;
            const d = document.createElement("span"); d.className = "card-date"; d.textContent = t.date;
            left.appendChild(c); left.appendChild(m); left.appendChild(d);
            const right = document.createElement("div"); right.className = "card-right";
            const a = document.createElement("span"); a.className = "card-amount"; a.textContent = "¥" + t.amount.toLocaleString();
            const b = document.createElement("button"); b.className = "delete-btn"; b.textContent = "❌";
            b.addEventListener("click", function () { deleteTransaction(t.id); });
            right.appendChild(a); right.appendChild(b); card.appendChild(left); card.appendChild(right); historyList.appendChild(card);
        });
    }

    function deleteTransaction(id) {
        if (!confirm("この記録を削除してもよろしいですか？")) return;
        const next = new Array();
        for (let i = 0; i < transactions.length; i++) { if (transactions[i].id !== id) { next.push(transactions[i]); } }
        transactions = next; localStorage.setItem("kakeibo-transactions", JSON.stringify(transactions)); updateApp();
    }

    const fortunePool = new Array();
    fortunePool.push({ name: "超大吉：今日は最強の節約運！物欲を完全シャットアウト！", rare: true });
    fortunePool.push({ name: "大吉：ゲーム運アップ！無料で狙いのキャラが出るかも？", rare: true });
    fortunePool.push({ name: "吉：おやつを1つ我慢すると、将来大きなご褒美が待っている日。", rare: false });
    fortunePool.push({ name: "中吉：好きな音楽を聴きながら家計簿をつけるとサクサク進む日。", rare: false });
    fortunePool.push({ name: "小吉：日用品のストックをチェックすると無駄買いが防げる日。", rare: false });
    fortunePool.push({ name: "凶：コンビニのレジ横の誘惑に注意！真っ直ぐ帰るのが吉。", rare: false });
    fortunePool.push({ name: "大凶：生きて今日を乗り越えられることを願う", rare: false });

    const luxuryPool = new Array();
    luxuryPool.push({ name: "ディナー：今夜は奮発して美味しいお肉を食べに行こう！", rare: true });
    luxuryPool.push({ name: "晩酌：お酒しか勝たんよなぁ！", rare: true });
    luxuryPool.push({ name: "映画三昧：ポップコーンを買って、映画をサブスクで爆破視聴！", rare: false });
    luxuryPool.push({ name: "ご褒美スイーツ：ちょっと高めのケーキ屋さんで贅沢デザート！", rare: false });
    luxuryPool.push({ name: "カフェ：お気に入りのカフェで一番高いドリンクを注文！", rare: false });

    const japanHolidays = new Set();
    const hData = new Array();
    hData.push("2026-01-01"); hData.push("2026-01-12"); hData.push("2026-02-11"); hData.push("2026-02-23");
    hData.push("2026-03-20"); hData.push("2026-04-29"); hData.push("2026-05-03"); hData.push("2026-05-04");
    hData.push("2026-05-05"); hData.push("2026-05-06"); hData.push("2026-07-20"); hData.push("2026-08-11");
    hData.push("2026-09-21"); hData.push("2026-09-22"); hData.push("2026-09-23"); hData.push("2026-10-12");
    hData.push("2026-11-03"); hData.push("2026-11-23"); hData.push("2027-01-01"); hData.push("2027-01-11");
    hData.push("2027-02-11"); hData.push("2027-02-23"); hData.push("2027-03-21"); hData.push("2027-03-22");
    hData.push("2027-04-29"); hData.push("2027-05-03"); hData.push("2027-05-04"); hData.push("2027-05-05");
    hData.push("2027-05-06"); hData.push("2027-07-19"); hData.push("2027-08-11"); hData.push("2027-09-20");
    hData.push("2027-09-23"); hData.push("2027-10-11"); hData.push("2027-11-03"); hData.push("2027-11-23");
    for (let x = 0; x < hData.length; x++) { japanHolidays.add(hData[x]); }

    const gachaBtn = document.getElementById("gacha-btn");
    const gachaResult = document.getElementById("gacha-result");
    const gachaTabButtons = document.querySelectorAll(".gacha-tab-btn");
    const holidaySelect1 = document.getElementById("holiday-select-1");
    const holidaySelect2 = document.getElementById("holiday-select-2");
    let activeGachaType = "fortune";

    if (holidaySelect1 && holidaySelect2) {
        const savedH1 = localStorage.getItem("kakeibo-holiday-1");
        const savedH2 = localStorage.getItem("kakeibo-holiday-2");
        if (savedH1 !== null) { holidaySelect1.value = savedH1; } else { holidaySelect1.value = "6"; localStorage.setItem("kakeibo-holiday-1", "6"); }
        if (savedH2 !== null) { holidaySelect2.value = savedH2; } else { holidaySelect2.value = "0"; localStorage.setItem("kakeibo-holiday-2", "0"); }

        const onHolidayChange = function () {
            localStorage.setItem("kakeibo-holiday-1", holidaySelect1.value);
            localStorage.setItem("kakeibo-holiday-2", holidaySelect2.value);
            alert("プチ贅沢ガチャの解放休日を更新しました！");
            resetGachaDisplay();
        };
        holidaySelect1.addEventListener("change", onHolidayChange);
        holidaySelect2.addEventListener("change", onHolidayChange);
    }

    gachaTabButtons.forEach(function (tab) {
        tab.addEventListener("click", function () {
            gachaTabButtons.forEach(function (b) { b.classList.remove("active"); }); tab.classList.add("active");
            activeGachaType = tab.getAttribute("data-gacha"); resetGachaDisplay();
        });
    });

    function getGachaDateId() {
        const now = new Date(); const hour = now.getHours(); const tempDate = new Date(now);
        if (hour < 4) { tempDate.setDate(tempDate.getDate() - 1); }
        return tempDate.getFullYear() + "-" + String(tempDate.getMonth() + 1).padStart(2, '0') + "-" + String(tempDate.getDate()).padStart(2, '0');
    }

    function isTodayGachaDay() {
        const currentDayId = getGachaDateId();
        if (japanHolidays.has(currentDayId)) { return true; }
        const currentDayOfWeek = new Date().getDay();
        const h1 = parseInt(localStorage.getItem("kakeibo-holiday-1")) || 6;
        const h2 = parseInt(localStorage.getItem("kakeibo-holiday-2")) || 0;
        return (currentDayOfWeek === h1 || currentDayOfWeek === h2);
    }

    function resetGachaDisplay() {
        if (!gachaResult) return; gachaResult.className = "";
        const currentDayId = getGachaDateId();

        if (activeGachaType === "fortune") {
            const lastDraw = localStorage.getItem("kakeibo-last-fortune-date");
            if (lastDraw === currentDayId) { gachaResult.textContent = "本日の占いは終了しました！明日の朝4時以降にまた引けます！"; }
            else { gachaResult.textContent = "今日の運勢を占おう！ボタンを押してね！"; }
        }
        else {
            if (isTodayGachaDay()) {
                const lastLuxuryDraw = localStorage.getItem("kakeibo-last-luxury-date");
                if (lastLuxuryDraw === currentDayId) { gachaResult.textContent = "本日のプチ贅沢ガチャは使用済みです！次の休日か祝日までロックされます！"; }
                else { gachaResult.textContent = "休日・祝日限定！プチ贅沢ガチャが解放されました！ボタンを押してね！"; }
            } else {
                gachaResult.textContent = "現在ロック中。あなたが設定した休日2日、または世間の祝日だけ引ける特別なご褒美です！";
            }
        }
    }

    if (gachaBtn && gachaResult) {
        gachaBtn.addEventListener("click", function () {
            const currentDayId = getGachaDateId();

            if (activeGachaType === "fortune") {
                const lastDraw = localStorage.getItem("kakeibo-last-fortune-date");
                if (lastDraw === currentDayId) { alert("占いは1日1回限定です！朝4時を過ぎるまでお待ちください！"); return; }
            }
            if (activeGachaType === "luxury") {
                if (!isTodayGachaDay()) { alert("まだ引けません！設定した休日か祝日まで我慢しましょう！"); return; }
                const lastLuxuryDraw = localStorage.getItem("kakeibo-last-luxury-date");
                if (lastLuxuryDraw === currentDayId) { alert("プチ贅沢ガチャは1日1回限定です！次の休日か祝日をお楽しみに！"); return; }
            }

            gachaBtn.disabled = true; gachaResult.textContent = "抽選中"; gachaResult.className = ""; gachaBtn.classList.add("btn-shake");

            setTimeout(function () {
                gachaBtn.classList.remove("btn-shake"); let pool = fortunePool; if (activeGachaType === "luxury") { pool = luxuryPool; }
                const idx = Math.floor(Math.random() * pool.length); const item = pool.slice(idx, idx + 1).pop();
                gachaResult.textContent = item.name;

                if (activeGachaType === "fortune") { localStorage.setItem("kakeibo-last-fortune-date", currentDayId); }
                if (activeGachaType === "luxury") { localStorage.setItem("kakeibo-last-luxury-date", currentDayId); }

                if (item.rare) { gachaResult.className = "rare-effect"; document.body.classList.add("screen-flash"); setTimeout(function () { document.body.classList.remove("screen-flash"); }, 400); }
                else { gachaResult.className = ""; }
                gachaBtn.disabled = false;
            }, 1000);
        });
    }

    updateApp();
});
