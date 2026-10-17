/**
 * eKart - Product Details & Wishlist Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Image Gallery Thumbnail Switcher
  const mainImage = document.getElementById('main-product-img');
  const thumbnails = document.querySelectorAll('.gallery-thumb');

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImage) {
        mainImage.src = thumb.dataset.fullSrc || thumb.src;
      }
    });
  });

  // 2. Quantity Selector on Product Detail Page
  const qtyInput = document.getElementById('product-quantity');
  const btnQtyMinus = document.getElementById('btn-qty-minus');
  const btnQtyPlus = document.getElementById('btn-qty-plus');

  if (qtyInput && btnQtyMinus && btnQtyPlus) {
    const maxStock = parseInt(qtyInput.getAttribute('max'), 10) || 99;

    btnQtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
      }
    });

    btnQtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < maxStock) {
        qtyInput.value = val + 1;
      } else {
        showToast(`Only ${maxStock} items available in stock.`, 'warning');
      }
    });
  }

  // 3. Wishlist AJAX Toggle
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-wishlist-toggle');
    if (!btn) return;

    e.preventDefault();
    const productId = btn.dataset.productId;

    try {
      const response = await fetch('/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      if (response.status === 401 || response.redirected) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (data.success) {
        if (data.added) {
          btn.classList.add('active');
          btn.style.color = '#ef4444';
          btn.style.fill = '#ef4444';
        } else {
          btn.classList.remove('active');
          btn.style.color = '';
          btn.style.fill = '';
        }

        // Update header wishlist badge
        const badge = document.querySelector('.wishlist-badge');
        if (badge) {
          badge.textContent = data.wishlistCount;
          badge.style.display = data.wishlistCount > 0 ? 'inline-block' : 'none';
        }

        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Error updating wishlist.', 'error');
      }
    } catch (err) {
      showToast('Please sign in to save items to your wishlist.', 'info');
    }
  });

  // 4. Tab Switcher on Product Detail Page
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.target;
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
});
