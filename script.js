'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // F5 Refresh handler
    history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'instant' });
            location.reload();
        }
    });

    // Utilities
    const $ = (sel, el = document) => el.querySelector(sel);
    const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
    const throttle = (fn, wait) => {
        let time = Date.now();
        return (...args) => {
            if ((time + wait - Date.now()) < 0) {
                fn(...args);
                time = Date.now();
            }
        };
    };

    // Canvas Particles (performance optimized)
    const initCanvas = () => {
        const canvas = $('#network-canvas');
        if (!canvas || !matchMedia('(pointer: fine)').matches) {
            if (canvas) canvas.style.display = 'none';
            return;
        }

        const ctx = canvas.getContext('2d', { alpha: false });
        const particles = [];
        let animationId, lastTime = 0;
        const isMobile = innerWidth < 768;
        const CONFIG = { count: isMobile ? 30 : 60, connect: 120, mouse: 150 };
        const mouse = { x: null, y: null, last: 0 };

        const resize = () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
        };

        addEventListener('resize', throttle(resize, 200));
        addEventListener('mousemove', throttle((e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.last = Date.now();
        }, 50), { passive: true });
        
        addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
        resize();

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.r = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
                
                const now = Date.now();
                if (mouse.x !== null && now - mouse.last < 100) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < CONFIG.mouse && dist > 0) {
                        const force = (CONFIG.mouse - dist) / CONFIG.mouse;
                        this.x -= (dx / dist) * force * 0.5;
                        this.y -= (dy / dist) * force * 0.5;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(39, 108, 245, 0.6)';
                ctx.fill();
            }
        }

        for (let i = 0; i < CONFIG.count; i++) particles.push(new Particle());
        
        const animate = (time) => {
            animationId = requestAnimationFrame(animate);
            if (time - lastTime < 33) return; // 30fps cap
            lastTime = time;
            
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => { p.update(); p.draw(); });
            
            ctx.lineWidth = 1;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < CONFIG.connect) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(39, 108, 245, ${0.15 * (1 - dist / CONFIG.connect)})`;
                        ctx.stroke();
                    }
                }
            }
        };

        animate(0);
        document.addEventListener('visibilitychange', () => {
            cancelAnimationFrame(animationId);
            if (!document.hidden) animate(0);
        });
    };

    // Copy link
    $('#copyBtn')?.addEventListener('click', async () => {
        const toast = $('#toast');
        const text = $('#copy-text');
        try {
            await navigator.clipboard.writeText("https://discord.gg/Kk66QYd8");
            toast?.classList.add('show');
            if (text) text.textContent = "Скопировано!";
            setTimeout(() => {
                toast?.classList.remove('show');
                if (text) text.textContent = "Копировать ссылку";
            }, 2000);
        } catch (err) { console.error(err); }
    });

    // Mobile menu
    const initMenu = () => {
        const btn = $('#mobileMenuBtn');
        const nav = $('#navLinks');
        if (!btn || !nav) return;

        const toggle = () => {
            const active = nav.classList.toggle('active');
            btn.setAttribute('aria-expanded', active);
            btn.querySelector('i').className = active ? 'fas fa-times' : 'fas fa-bars';
        };

        btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && nav.classList.contains('active')) toggle();
        });
        $$('.nav-link', nav).forEach(a => a.addEventListener('click', () => {
            if (nav.classList.contains('active')) toggle();
        }));
    };

    // Smooth scroll
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            $(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Reveal animation (optimized single observer)
    const initReveal = () => {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        $$('.glass-card, .role-item').forEach(el => obs.observe(el));
    };

    // Rules Slider (optimized)
    const initSlider = () => {
        const slider = $('#rulesSlider');
        if (!slider) return;

        const slides = $$('.rule-slide', slider);
        const dotsContainer = $('.slider-dots', slider);
        const prevBtn = $('.prev', slider);
        const nextBtn = $('.next', slider);
        const counter = $('.current', slider);
        const total = slides.length;
        let current = 0;

        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = `dot${i >= 6 ? ' strict-dot' : ''}${i === 0 ? ' active' : ''}`;
            dot.ariaLabel = `Слайд ${i + 1}`;
            dot.onclick = () => goTo(i);
            dotsContainer.appendChild(dot);
        });

        const dots = $$('.dot', slider);

        const goTo = (idx) => {
            idx = (idx + total) % total;
            if (idx === current) return;
            
            slides[current].classList.remove('active');
            dots[current].classList.remove('active');
            
            current = idx;
            
            slides[current].classList.add('active');
            dots[current].classList.add('active');
            if (counter) {
                counter.textContent = String(current + 1).padStart(2, '0');
                counter.classList.toggle('strict-count', current >= 6);
            }
        };

        nextBtn?.addEventListener('click', () => goTo(current + 1));
        prevBtn?.addEventListener('click', () => goTo(current - 1));

        // Touch swipe
        let startX = 0;
        slider.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX, { passive: true });
        slider.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
        }, { passive: true });

        // Keyboard navigation
        slider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') goTo(current - 1);
            if (e.key === 'ArrowRight') goTo(current + 1);
        });
    };

    // Initialize all
    initCanvas();
    initMenu();
    initReveal();
    initSlider();
});