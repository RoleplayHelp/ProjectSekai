document.addEventListener('DOMContentLoaded', () => {

    /**
     * =============================
     * Service: ContentLoader
     * =============================
     * Chịu trách nhiệm tải nội dung HTML từ file và inject vào target
     */
    class ContentLoader {
        async load(file, targetElementId) {
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`Failed to load ${file}: ${response.statusText}`);
                }
                const content = await response.text();
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.innerHTML = content;
                } else {
                    console.error(`Target element with id "${targetElementId}" not found.`);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    /**
     * =============================
     * Component: Accordion
     * =============================
     * Quản lý mở/đóng 1 accordion
     */
    class Accordion {
        constructor(rootElement) {
            this.root = rootElement;
            this.header = this.root.querySelector('.accordion-header');
            this.content = this.root.querySelector('.accordion-content');
            this._init();
        }

        _init() {
            this.header.addEventListener('click', () => this.toggle());
        }

        open() {
            this.root.classList.add('active');
            this.content.style.maxHeight = this.content.scrollHeight + "px";
        }

        close() {
            this.root.classList.remove('active');
            this.content.style.maxHeight = null;
        }

        toggle() {
            if (this.root.classList.contains('active')) {
                this.close();
            } else {
                this.open();
            }
        }
    }

    /**
     * =============================
     * Component: AccordionManager
     * =============================
     * Quản lý danh sách accordion (theo dạng mở nhiều hoặc chỉ 1)
     */
    class AccordionManager {
        constructor(selector, singleOpen = false) {
            this.accordions = Array.from(document.querySelectorAll(selector)).map(
                el => new Accordion(el)
            );
            this.singleOpen = singleOpen;

            if (this.singleOpen) {
                this._applySingleOpen();
            }
        }

        _applySingleOpen() {
            this.accordions.forEach(acc => {
                const originalToggle = acc.toggle.bind(acc);
                acc.toggle = () => {
                    this.accordions.forEach(a => a.close());
                    originalToggle();
                };
            });
        }
    }

    /**
     * =============================
     * Component: Navigation
     * =============================
     * Quản lý các hành động liên quan đến điều hướng
     */
    class Navigation {
        static backToHome(buttonId, targetUrl) {
            const btn = document.getElementById(buttonId);
            if (btn) {
                btn.addEventListener('click', () => {
                    window.location.href = targetUrl;
                });
            }
        }
    }

    /**
     * =============================
     * App khởi tạo
     * =============================
     */
    class App {
        constructor() {
            this.contentLoader = new ContentLoader();
        }

        async init() {
            // Load nội dung động
            await this._loadContents();

            // Khởi tạo accordion (true = chỉ mở 1 accordion)
            new AccordionManager('.accordion', false);

            // Back to home
            Navigation.backToHome('backToHomeBtn', 'Home.html');
        }

        async _loadContents() {
            const sections = [
                { file: './content/intro.html', target: 'intro-section' },
                { file: './content/accordion1.html', target: 'accordion-content-1' },
                { file: './content/accordion2.html', target: 'accordion-content-2' },
                { file: './content/accordion3.html', target: 'accordion-content-3' },
                { file: './content/accordion4.html', target: 'accordion-content-4' },
                { file: './content/accordion5.html', target: 'accordion-content-5' },
                { file: './content/accordion6.html', target: 'accordion-content-6' }
            ];

            for (const section of sections) {
                await this.contentLoader.load(section.file, section.target);
            }
        }
    }

    // Start App
    const app = new App();
    app.init();
});
