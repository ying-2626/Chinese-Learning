class LoveModule {
    constructor() {
        this.container = document.getElementById('love');
        this.images = [
            'img/love放图1.png',
            'img/love放图2.png'
        ];
        this.currentIndex = 0;
        this.intervalId = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.startCarousel();
    }

    render() {
        this.container.innerHTML = `
            <div class="love-header">
                <h2>用户反馈</h2>
            </div>
            <div class="carousel-container">
                <div class="carousel-wrapper">
                    ${this.images.map((src, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                            <img src="${src}" alt="User Feedback ${index + 1}">
                        </div>
                    `).join('')}
                </div>
                <button class="carousel-btn prev">&lt;</button>
                <button class="carousel-btn next">&gt;</button>
                <div class="carousel-indicators">
                    ${this.images.map((_, index) => `
                        <span class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bindEvents() {
        const prevBtn = this.container.querySelector('.prev');
        const nextBtn = this.container.querySelector('.next');
        const indicators = this.container.querySelectorAll('.indicator');
        const wrapper = this.container.querySelector('.carousel-container');

        prevBtn.addEventListener('click', () => {
            this.prevSlide();
            this.resetInterval();
        });

        nextBtn.addEventListener('click', () => {
            this.nextSlide();
            this.resetInterval();
        });

        indicators.forEach(ind => {
            ind.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
                this.resetInterval();
            });
        });

        // Pause on hover
        wrapper.addEventListener('mouseenter', () => this.stopCarousel());
        wrapper.addEventListener('mouseleave', () => this.startCarousel());
    }

    goToSlide(index) {
        const slides = this.container.querySelectorAll('.carousel-slide');
        const indicators = this.container.querySelectorAll('.indicator');

        slides[this.currentIndex].classList.remove('active');
        indicators[this.currentIndex].classList.remove('active');

        this.currentIndex = index;

        slides[this.currentIndex].classList.add('active');
        indicators[this.currentIndex].classList.add('active');
    }

    nextSlide() {
        let newIndex = (this.currentIndex + 1) % this.images.length;
        this.goToSlide(newIndex);
    }

    prevSlide() {
        let newIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.goToSlide(newIndex);
    }

    startCarousel() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            this.nextSlide();
        }, 3000); // Change every 3 seconds
    }

    stopCarousel() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    resetInterval() {
        this.stopCarousel();
        this.startCarousel();
    }
}
