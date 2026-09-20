// 📱 スマホ用タッチ遅延対策
document.addEventListener("touchstart", function() {}, {passive: true});

document.addEventListener("DOMContentLoaded", function() {
    
    // =======================================================
    // 📺 1. 5大メニューの画面遷移（タブ切り替え）システム
    // =======================================================
    const navItems = document.querySelectorAll(".nav-item");
    const appScreens = document.querySelectorAll(".app-screen");

    navItems.forEach(function(item) {
        item.addEventListener("click", function() {
            const targetScreenId = item.getAttribute("data-target");
            
            // 🛑 すべてのボタンと画面から光る目印（active）を一旦消す
            navItems.forEach(i => i.classList.remove("active"));
            appScreens.forEach(s => s.classList.remove("active"));
            
            // ✨ 今クリックされたメニューと画面だけをアクティブにする
            item.classList.add("active");
            const targetScreen = document.getElementById(targetScreenId);
            if (targetScreen) {
                targetScreen.classList.add("active");
            }
        });
    });

    // =======================================================
    // 💸 2. 家計簿の計算 ＆ 履歴追加システム
    // =======================================================
    // 📁 入力された支出データを一時的に溜めておく配列（倉庫）
    let transactions = [];
    let totalExpense = 0;

    // 🧱 画面の要素（フォームや合計金額の欄）を取得
    const kakeiboForm = document.getElementById("kakeibo-form");
    const totalPriceSpan = document.getElementById("total-price");
    const historyList = document.getElementById("history-list");
    const emptyMessage = document.getElementById("empty-message");

    // 📥 登録ボタン（ADD TRANSACTION）が押された時の処理
    if (kakeiboForm) {
        kakeiboForm.addEventListener("submit", function(e) {
            e.preventDefault(); // 💡 画面が勝手にリロードされるのを防ぐプロの技

            // ✍️ 入力された値を取得
            const amount = parseInt(document.getElementById("amount").value);
            const category = document.getElementById("category").value;
            const date = document.getElementById("date").value;
            const memo = document.getElementById("memo").value || "なし"; // 空欄なら「なし」

            // 📦 データを1つのオブジェクト（塊）にして配列に保存
            const newTransaction = {
                id: Date.now(), // 💡 削除するときに識別するためのユニークなID
                amount: amount,
                category: category,
                date: date,
                memo: memo
            };
            transactions.push(newTransaction);

            // 🔄 画面の更新（合計金額の再計算 ＋ 履歴リストの表示）
            updateApp();

            // 🧹 次に入力しやすいようにフォームを空っぽにする
            kakeiboForm.reset();
        });
    }

    // 🌟 画面の数値を再計算してリフレッシュする関数（まとめ役）
    function updateApp() {
        // ① 合計金額の計算
        totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
        totalPriceSpan.textContent = totalExpense.toLocaleString(); // 💡 「1,000」のようにカンマを入れる

        // ② 履歴リスト（LOG画面）の中身を一回クリアにする
        historyList.innerHTML = "";

        // もし履歴が空っぽなら「履歴はありません」を表示
        if (transactions.length === 0) {
            historyList.appendChild(emptyMessage);
            return;
        }

        // 📋 配列のデータを一つずつサイバー風カード（div）に組み立てて画面に並べる
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

    // ❌ 3. 履歴を消去する機能（グローバルに公開）
    window.deleteTransaction = function(id) {
        // 💡 削除ボタンが押されたID以外のデータだけを残す（＝指定されたIDを消す）
        transactions = transactions.filter(t => t.id !== id);
        updateApp(); // 画面を再計算してリフレッシュ
    };
});
