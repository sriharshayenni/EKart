/**
 * eKart - Main Interactive Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Password Visibility Toggle
  const passwordToggles = document.querySelectorAll('.password-toggle-btn');
  passwordToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && (input.type === 'password' || input.type === 'text')) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword
          ? `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`
          : `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
      }
    });
  });

  // 2. Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const categoriesBar = document.querySelector('.categories-bar');
  if (mobileMenuBtn && categoriesBar) {
    mobileMenuBtn.addEventListener('click', () => {
      categoriesBar.classList.toggle('active');
    });
  }

  // 3. Mobile Filter Drawer Toggle (Product listing page)
  const mobileFilterBtn = document.querySelector('.mobile-filter-btn');
  const filterSidebar = document.querySelector('.filter-sidebar');
  const closeFilterBtn = document.querySelector('.close-filter-btn');
  if (mobileFilterBtn && filterSidebar) {
    mobileFilterBtn.addEventListener('click', () => {
      filterSidebar.classList.add('mobile-open');
    });
  }
  if (closeFilterBtn && filterSidebar) {
    closeFilterBtn.addEventListener('click', () => {
      filterSidebar.classList.remove('mobile-open');
    });
  }

  // 4. Newsletter AJAX Subscription
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.newsletter-input');
      const email = input.value.trim();
      if (!email) return;

      try {
        const response = await fetch('/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        showToast(data.message, data.success ? 'success' : 'error');
        if (data.success) {
          input.value = '';
        }
      } catch (err) {
        showToast('Subscription request could not be processed.', 'error');
      }
    });
  }

  // 5. Image Fallback Helper
  const allImages = document.querySelectorAll('img');
  allImages.forEach(img => {
    img.addEventListener('error', function() {
      if (!this.getAttribute('data-fallback-tried')) {
        this.setAttribute('data-fallback-tried', 'true');
        this.src = '/images/placeholder.svg';
      }
    });
  });
});

/**
 * Global Toast Notification Generator
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none; border:none; color:inherit; cursor:pointer; font-size:1.1rem; padding:0 4px;" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.showToast = showToast;
