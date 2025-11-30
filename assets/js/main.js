// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('progress-bar');

    function updateProgressBar() {
        // Hitung seberapa jauh user sudah scroll dari total ketinggian yang bisa di-scroll
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = window.scrollY;

        // Persentase scroll
        const scrollPercent = (scrolled / scrollHeight) * 100;

        // Update lebar EXP Bar
        if (progressBar) {
            progressBar.style.width = scrollPercent + '%';
        }
    }

    // Event listener untuk memanggil fungsi saat window di-scroll
    window.addEventListener('scroll', updateProgressBar);
    
    // Panggil sekali saat load untuk setting awal
    updateProgressBar();
    
    // --- Logika untuk Kartu Proyek (Opsional: Modal) ---
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectName = card.getAttribute('data-project');
            
            // Di sini kamu bisa membuat fungsi untuk menampilkan MODAL
            // atau langsung mengarahkan ke halaman game:
            
            if (projectName === 'tictactoe') {
                window.location.href = 'games/tic-tac-toe/index.html';
            } else if (projectName === 'flappybird') {
                window.location.href = 'games/flappy-clone/index.html';
            }
            
            console.log(`Card clicked: ${projectName}. Redirecting to game...`);
        });
    });
});
