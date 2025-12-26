// ============================================
// RECORDINGS PAGE
// ============================================

// Sample recordings data (in production, load from backend/JSON)
const recordingsData = [
    {
        id: 1,
        title: 'Islamic Principles of Success',
        description: 'Learn the Islamic approach to achieving success in life and the hereafter',
        category: 'lectures',
        videoId: 'jVU55qYcNmY',
        thumbnail: 'https://img.youtube.com/vi/jVU55qYcNmY/maxresdefault.jpg',
        duration: 3600,
        date: '2024-12-20',
        views: 15420
    },
    {
        id: 2,
        title: 'Stories of the Prophets',
        description: 'Beautiful stories from the lives of the prophets for children',
        category: 'kids',
        videoId: '_rNHdujZ3do',
        thumbnail: 'https://img.youtube.com/vi/_rNHdujZ3do/maxresdefault.jpg',
        duration: 1800,
        date: '2024-12-19',
        views: 8900
    },
    {
        id: 3,
        title: 'The Golden Age of Islam',
        description: 'Documentary exploring the golden age of Islamic civilization',
        category: 'documentaries',
        videoId: 'WJXPMxOdIXQ',
        thumbnail: 'https://img.youtube.com/vi/WJXPMxOdIXQ/maxresdefault.jpg',
        duration: 5400,
        date: '2024-12-18',
        views: 22100
    },
    {
        id: 4,
        title: 'Live Eid Celebration 2024',
        description: 'Complete coverage of Eid celebration and prayers',
        category: 'events',
        videoId: 'mM4GUgz8KSI',
        thumbnail: 'https://img.youtube.com/vi/mM4GUgz8KSI/maxresdefault.jpg',
        duration: 7200,
        date: '2024-06-15',
        views: 45600
    }
];

class RecordingsManager {
    constructor() {
        this.recordings = recordingsData;
        this.filteredRecordings = [...this.recordings];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.modalPlayer = null;
        this.init();
    }

    /**
     * Initialize recordings page
     */
    init() {
        this.renderRecordings();
        this.initSearch();
        this.initFilters();
        this.initModal();
    }

    /**
     * Render recordings grid
     */
    renderRecordings() {
        const grid = document.getElementById('recordingsGrid');
        if (!grid) return;

        // Clear loading spinner
        grid.innerHTML = '';

        if (this.filteredRecordings.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <h3>No recordings found</h3>
                    <p>Try adjusting your search or filter</p>
                </div>
            `;
            return;
        }

        this.filteredRecordings.forEach(recording => {
            const card = this.createRecordingCard(recording);
            grid.appendChild(card);
        });
    }

    /**
     * Create recording card element
     */
    createRecordingCard(recording) {
        const card = document.createElement('div');
        card.className = 'recording-card';
        card.dataset.id = recording.id;

        card.innerHTML = `
            <div class="recording-card__thumbnail">
                <img src="${recording.thumbnail}" alt="${recording.title}" loading="lazy">
                <span class="recording-card__duration">${Utils.formatDuration(recording.duration)}</span>
            </div>
            <div class="recording-card__content">
                <span class="recording-card__category">${recording.category}</span>
                <h3 class="recording-card__title">${recording.title}</h3>
                <p class="recording-card__description">${recording.description}</p>
                <div class="recording-card__meta">
                    <span>${Utils.formatDate(recording.date)}</span>
                    <span>${recording.views.toLocaleString()} views</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            this.openModal(recording);
        });

        return card;
    }

    /**
     * Initialize search functionality
     */
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const debouncedSearch = Utils.debounce((query) => {
            this.searchQuery = query.toLowerCase();
            this.applyFilters();
        }, 300);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }

    /**
     * Initialize category filters
     */
    initFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                filterTabs.forEach(t => t.classList.remove('filter-tab--active'));
                tab.classList.add('filter-tab--active');

                // Update filter
                this.currentCategory = tab.dataset.category;
                this.applyFilters();
            });
        });
    }

    /**
     * Apply search and category filters
     */
    applyFilters() {
        this.filteredRecordings = this.recordings.filter(recording => {
            const matchesCategory = this.currentCategory === 'all' || recording.category === this.currentCategory;
            const matchesSearch = !this.searchQuery || 
                recording.title.toLowerCase().includes(this.searchQuery) ||
                recording.description.toLowerCase().includes(this.searchQuery);

            return matchesCategory && matchesSearch;
        });

        this.renderRecordings();
    }

    /**
     * Initialize modal
     */
    initModal() {
        const modal = document.getElementById('videoModal');
        const closeBtn = document.getElementById('closeModal');
        const backdrop = document.getElementById('modalBackdrop');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                this.closeModal();
            }
        });
    }

    /**
     * Open video modal
     */
    openModal(recording) {
        const modal = document.getElementById('videoModal');
        if (!modal) return;

        // Update modal content
        document.getElementById('modalTitle').textContent = recording.title;
        document.getElementById('modalCategory').textContent = recording.category;
        document.getElementById('modalDuration').textContent = Utils.formatDuration(recording.duration);
        document.getElementById('modalDate').textContent = Utils.formatDate(recording.date);
        document.getElementById('modalDescription').textContent = recording.description;

        // Show modal
        modal.style.display = 'flex';

        // Initialize player
        this.initModalPlayer(recording.videoId);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close video modal
     */
    closeModal() {
        const modal = document.getElementById('videoModal');
        if (!modal) return;

        modal.style.display = 'none';

        // Destroy player
        if (this.modalPlayer) {
            this.modalPlayer.destroy();
            this.modalPlayer = null;
        }

        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Initialize modal player
     */
    initModalPlayer(videoId) {
        if (typeof YT === 'undefined') return;

        this.modalPlayer = new YT.Player('modalPlayer', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('recordings.html')) {
        window.recordingsManager = new RecordingsManager();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecordingsManager;
}
