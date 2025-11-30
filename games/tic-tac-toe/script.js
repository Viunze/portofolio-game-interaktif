// games/tic-tac-toe/script.js

// Global references (akan diinisialisasi setelah autentikasi)
let db;
let myUserId;
let appId;
let gameRef;
let unsubscribe; // Untuk mematikan listener real-time

// DOM elements
const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('status-message');
const setupArea = document.getElementById('setup-area');
const statusArea = document.getElementById('status-area');
const findGameBtn = document.getElementById('find-game-btn');
const restartBtn = document.getElementById('restart-btn');
const playerNameInput = document.getElementById('player-name-input');
const mySymbolEl = document.getElementById('my-symbol');
const myNameEl = document.getElementById('my-name');
const opponentNameEl = document.getElementById('opponent-name');

// State Game Lokal
let myPlayerSymbol = null; // 'X' atau 'O'
let currentGameState = null;

// Konfigurasi Firestore
const GAMES_COLLECTION = 'games';

// --- Pola Kemenangan ---
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

/**
 * Fungsi Pengecek Kemenangan
 * @param {Array<string>} board 
 * @returns {string | null} 'X', 'O', 'DRAW', atau null (jika game masih berjalan)
 */
function checkWinner(board) {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Pemenang ('X' atau 'O')
        }
    }
    if (!board.includes("")) {
        return 'DRAW';
    }
    return null; // Game masih berjalan
}

/**
 * --- UTAMA: Sinkronisasi Tampilan dengan State Firestore ---
 * Dipanggil setiap kali ada perubahan di Firestore
 */
function updateUI(state) {
    currentGameState = state;
    const board = state.board;

    // Tampilkan Papan
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.className = 'cell'; // Reset kelas
        if (board[index]) {
            cell.classList.add(board[index]);
        }
    });

    // Tampilkan Info Pemain
    myNameEl.textContent = state.playerXId === myUserId ? state.playerXName : state.playerOName;
    opponentNameEl.textContent = state.playerXId === myUserId ? (state.playerOName || 'Menunggu...') : (state.playerXName || 'Menunggu...');

    // Tampilkan Pesan Status
    if (state.status === 'WAITING') {
        // Penting: Pastikan 'appId' didefinisikan sebelum digunakan
        const displayAppId = appId || 'App ID tidak tersedia'; 
        statusMessage.textContent = 'Menunggu Lawan... Bagikan ID Aplikasi: ' + displayAppId;
    } else if (state.status === 'READY') {
        // Tentukan giliran
        if (state.winner) {
            if (state.winner === 'DRAW') {
                statusMessage.textContent = `DRAW! Coba lagi!`;
            } else {
                statusMessage.textContent = `GAME OVER! ${state.winner} (${state.winner === myPlayerSymbol ? 'ANDA' : 'LAWAN'}) MENANG!`;
            }
            restartBtn.classList.remove('hidden');
        } else {
            // Game berjalan
            const isMyTurn = state.currentPlayer === myPlayerSymbol;
            statusMessage.textContent = isMyTurn ? 'GILIRAN ANDA!' : `Giliran Lawan (${state.currentPlayer})`;
        }
    }
}

/**
 * --- CORE: Mencari atau Membuat Game Baru ---
 */
async function findOrCreateGame() {
    // Pastikan db sudah diinisialisasi
    if (!db) {
        statusMessage.textContent = 'ERROR: Database belum terhubung. Coba restart.';
        return;
    }
    
    const playerName = playerNameInput.value.trim() || 'Anonim';
    findGameBtn.disabled = true;
    statusMessage.textContent = 'Mencari Quest Terbuka...';
    setupArea.classList.add('hidden');
    statusArea.classList.remove('hidden');

    try {
        // 1. Cek Game yang Statusnya WAITING (Hanya Player X)
        const q = query(
            // Penting: Pastikan jalur firestore sesuai dengan aturan keamanan
            collection(db, `artifacts/${appId}/public/data/${GAMES_COLLECTION}`),
            where('status', '==', 'WAITING')
        );
        const { getDocs, runTransaction, doc, collection, setDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // --- KASUS 1: MENEMUKAN GAME (Menjadi Player O) ---
            const waitingGameDoc = snapshot.docs[0];
            gameRef = waitingGameDoc.ref;
            
            // Gunakan Transaction untuk memastikan 2 player tidak join secara bersamaan
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(gameRef);
                const gameData = docSnap.data();

                if (gameData.status === 'WAITING') {
                    // Update game menjadi READY
                    const updateData = {
                        status: 'READY',
                        playerOId: myUserId,
                        playerOName: playerName,
                        currentPlayer: 'X', // X selalu mulai duluan
                        lastMoveTime: new Date()
                    };
                    transaction.update(gameRef, updateData);
                    myPlayerSymbol = 'O';
                    mySymbolEl.textContent = 'O';
                    statusMessage.textContent = 'Berhasil Bertemu! Quest Dimulai!';
                } else {
                    // Jika game sudah READY/FULL, coba cari lagi
                    throw new Error("Game sudah terisi, mencari yang lain...");
                }
            });

        } else {
            // --- KASUS 2: MEMBUAT GAME BARU (Menjadi Player X) ---
            const newGameRef = doc(collection(db, `artifacts/${appId}/public/data/${GAMES_COLLECTION}`));
            const initialGameState = {
                board: ["", "", "", "", "", "", "", "", ""],
                status: 'WAITING',
                currentPlayer: 'X',
                playerXId: myUserId,
                playerXName: playerName,
                playerOId: null,
                playerOName: null,
                winner: null,
                lastMoveTime: new Date(),
                createdAt: new Date()
            };
            await setDoc(newGameRef, initialGameState);
            gameRef = newGameRef;
            myPlayerSymbol = 'X';
            mySymbolEl.textContent = 'X';
            statusMessage.textContent = 'Menunggu Lawan...';
        }

        // 2. Start Real-time Listener
        if (gameRef) {
            startRealtimeListener();
        }

    } catch (error) {
        console.error("Matchmaking Error:", error.message);
        statusMessage.textContent = 'Gagal Mencari Lawan. Coba lagi.';
        findGameBtn.disabled = false;
        setupArea.classList.remove('hidden');
        statusArea.classList.add('hidden');
    }
}

/**
 * Memulai listener onSnapshot untuk sinkronisasi real-time
 */
async function startRealtimeListener() {
    if (unsubscribe) {
        unsubscribe(); // Hentikan listener lama jika ada
    }
    
    // Import onSnapshot
    const { onSnapshot } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

    unsubscribe = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
            const state = doc.data();
            updateUI(state);
        } else {
            // Game telah dihapus atau berakhir
            statusMessage.textContent = 'Game Selesai atau Dibatalkan. Mulai Quest Baru.';
            restartBtn.classList.remove('hidden');
            if (unsubscribe) unsubscribe();
        }
    }, (error) => {
        console.error("Firestore Listener Error:", error);
        statusMessage.textContent = 'Koneksi Terputus. Coba restart game.';
    });
}

/**
 * Menangani Klik Sel di Papan
 */
async function handleCellClick(event) {
    if (!currentGameState || currentGameState.status !== 'READY' || currentGameState.winner) return;

    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));
    const board = [...currentGameState.board];

    // Cek apakah giliran saya dan sel kosong
    const isMyTurn = currentGameState.currentPlayer === myPlayerSymbol;
    if (!isMyTurn || board[clickedCellIndex] !== "") {
        console.log("Bukan giliran Anda atau sel sudah terisi.");
        return;
    }

    // Lakukan Perubahan Lokal
    board[clickedCellIndex] = myPlayerSymbol;
    const newWinner = checkWinner(board);
    
    // Siapkan data untuk di-update ke Firestore
    const updateData = {
        board: board,
        lastMoveTime: new Date()
    };
    
    if (newWinner) {
        // Game Selesai
        updateData.winner = newWinner;
        updateData.status = 'FINISHED';
    } else {
        // Ganti Giliran
        updateData.currentPlayer = myPlayerSymbol === 'X' ? 'O' : 'X';
    }

    // Update Firestore
    try {
        const { updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        await updateDoc(gameRef, updateData);
    } catch (error) {
        console.error("Error updating board:", error);
        // Tampilkan pesan error jika update gagal
        statusMessage.textContent = 'Gagal mengirim langkah. Coba lagi.';
    }
}

// --- INISIALISASI & Event Listeners ---
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
findGameBtn.addEventListener('click', findOrCreateGame);
restartBtn.addEventListener('click', () => {
    // Reset UI dan Logika
    if (unsubscribe) unsubscribe();
    myPlayerSymbol = null;
    currentGameState = null;
    setupArea.classList.remove('hidden');
    statusArea.classList.add('hidden');
    restartBtn.classList.add('hidden');
    statusMessage.textContent = 'Siap untuk Quest Baru.';
    playerNameInput.value = '';
});

/**
 * Fungsi inisialisasi yang dipanggil dari index.html setelah autentikasi
 * @param {object} firestoreInstance - Instansi Firestore
 * @param {string} userId - ID unik pengguna
 * @param {string} appIdVal - ID Aplikasi Canvas
 */
window.initMultiplayerGame = (firestoreInstance, userId, appIdVal) => {
    db = firestoreInstance;
    myUserId = userId;
    appId = appIdVal;
    statusMessage.textContent = 'Koneksi Berhasil. Masukkan Nama Anda!';
};


// PENTING: Panggil fungsi autentikasi setelah semua fungsi dan DOM siap
window.addEventListener('load', () => {
    if (typeof window.authenticateUser === 'function') {
        // Panggil autentikasi, dan berikan initMultiplayerGame sebagai callback
        window.authenticateUser(window.initMultiplayerGame);
    } else {
        console.error("Error: Fungsi authenticateUser dari Firebase tidak ditemukan.");
        document.getElementById('status-message').textContent = "ERROR: Kesalahan inisialisasi Firebase.";
    }
});
