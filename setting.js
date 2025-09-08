document.addEventListener('DOMContentLoaded', () => {

    // Function to load content from a file
    async function loadContent(file, targetElementId) {
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

    // Load content for each section
    loadContent('./content/intro.html', 'intro-section');
    loadContent('./content/accordion1.html', 'accordion-content-1');
    loadContent('./content/accordion2.html', 'accordion-content-2');
    loadContent('./content/accordion3.html', 'accordion-content-3');
	loadContent('./content/accordion4.html', 'accordion-content-4');
	loadContent('./content/accordion5.html', 'accordion-content-5');
	loadContent('./content/accordion6.html', 'accordion-content-6');


    // Accordion functionality
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        const accordionHeader = accordion.querySelector('.accordion-header');
        if (accordionHeader) {
            accordionHeader.addEventListener('click', () => {
                accordion.classList.toggle('active');
            });
        }
    });

    // Back to home button functionality
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = 'Home.html';
        });
    }
});