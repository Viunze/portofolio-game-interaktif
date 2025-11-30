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
    updateProgressBar();
    
    // ------------------------------------------
    // --- Logika untuk Kartu Proyek & Modal ---
    // ------------------------------------------
    
    const projectCards = document.querySelectorAll('.project-card');
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-description');
    const modalTech = document.getElementById('modal-tech-list');
    const modalLink = document.getElementById('modal-play-link');

    // Data proyek (Simulasi Database Kecil)
    const projectsData = {
        'tictactoe': {
            title: "Tic-Tac-Toe Classic",
            description: "A simple implementation of the classic Noughts and Crosses game. This project focused on building solid game logic and state management using pure JavaScript.",
            tech: ["HTML5", "CSS3", "Vanilla JavaScript", "DOM Manipulation"],
            link: "games/tic-tac-toe/index.html"
        },
        'flappybird': {
            title: "Flappy Bird Clone (Canvas)",
            description: "Recreation of the famous Flappy Bird. This advanced project utilized the HTML Canvas API to handle 2D graphics, collision detection, and basic physics simulation.",
            tech: ["HTML5", "CSS3", "Vanilla JavaScript", "Canvas API", "Basic Physics"],
            link: "#" // Link sementara, kamu bisa buat gamenya nanti
        }
    };

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectName = card.getAttribute('data-project');
            const data = projectsData[projectName];

            if (data) {
                // Isi Konten Modal
                modalTitle.textContent = data.title;
                modalDesc.textContent = data.description;
                modalLink.href = data.link;

                // Isi List Teknologi
                modalTech.innerHTML = '';
                data.tech.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    modalTech.appendChild(li);
                });

                // Tampilkan Modal
                modal.style.display = 'block';
            }
        });
    });

    // Event untuk menutup Modal saat tombol 'X' diklik
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Event untuk menutup Modal saat mengklik di luar area konten
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

});
