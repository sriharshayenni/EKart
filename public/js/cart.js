/**
 * eKart - Shopping Cart Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Update header cart badge
  function updateCartBadge(count) {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // 1. AJAX Add to Cart buttons
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-add-cart-ajax');
    if (!btn) return;

    e.preventDefault();
    const productId = btn.dataset.productId;
    const quantityInput = document.getElementById('product-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="loading-spinner"></span> Adding...`;

    try {
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message, 'success');
        if (data.cartCount !== undefined) {
          updateCartBadge(data.cartCount);
        }
      } else {
        showToast(data.message || 'Could not add to cart.', 'error');
      }
    } catch (err) {
      showToast('Network error adding product to cart.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // 2. Quantity adjustment in Cart page
  const cartTable = document.querySelector('.cart-items-table');
  if (cartTable) {
    // Quantity Increment / Decrement
    cartTable.addEventListener('click', async (e) => {
      const qtyBtn = e.target.closest('.btn-qty-update');
      if (!qtyBtn) return;

      const itemId = qtyBtn.dataset.itemId;
      const input = document.getElementById(`qty-${itemId}`);
      if (!input) return;

      let currentVal = parseInt(input.value, 10);
      const isIncrement = qtyBtn.dataset.action === 'increase';
      const newVal = isIncrement ? currentVal + 1 : currentVal - 1;

      if (newVal < 1) return; // Use delete button to remove

      await updateCartQuantity(itemId, newVal);
    });

    // Direct input change
    cartTable.addEventListener('change', async (e) => {
      if (e.target.classList.contains('cart-qty-input')) {
        const itemId = e.target.dataset.itemId;
        const val = parseInt(e.target.value, 10);
        if (val >= 1) {
          await updateCartQuantity(itemId, val);
        }
      }
    });

    // Remove Item button (AJAX)
    cartTable.addEventListener('click', async (e) => {
      const removeBtn = e.target.closest('.btn-remove-item');
      if (!removeBtn) return;

      e.preventDefault();
      const itemId = removeBtn.dataset.itemId;
      if (!confirm('Remove this item from your shopping cart?')) return;

      try {
        const response = await fetch('/cart/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ itemId })
        });
        const data = await response.json();

        if (data.success) {
          const row = document.getElementById(`cart-row-${itemId}`);
          if (row) row.remove();

          updateCartBadge(data.cartCount);
          showToast(data.message, 'success');

          // If cart now empty, reload to show empty state
          if (data.cartCount === 0) {
            window.location.reload();
          } else {
            // Refresh totals by fetching or reloading
            window.location.reload();
          }
        }
      } catch (err) {
        showToast('Error removing item from cart.', 'error');
      }
    });
  }

  async function updateCartQuantity(itemId, quantity) {
    const input = document.getElementById(`qty-${itemId}`);
    if (input) input.disabled = true;

    try {
      const response = await fetch('/cart/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ itemId, quantity })
      });

      const data = await response.json();

      if (data.success) {
        if (input) {
          input.value = quantity;
          input.disabled = false;
        }

        // Update item line subtotal
        const lineSubtotalElem = document.getElementById(`subtotal-${itemId}`);
        if (lineSubtotalElem && data.itemSubtotal !== undefined) {
          lineSubtotalElem.textContent = `₹${data.itemSubtotal.toLocaleString()}`;
        }

        // Update summary values
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryShipping = document.getElementById('summary-shipping');
        const summaryTax = document.getElementById('summary-tax');
        const summaryTotal = document.getElementById('summary-total');

        if (summarySubtotal) summarySubtotal.textContent = `₹${data.subtotal.toLocaleString()}`;
        if (summaryShipping) summaryShipping.textContent = data.shippingFee === 0 ? 'FREE' : `₹${data.shippingFee}`;
        if (summaryTax) summaryTax.textContent = `₹${data.tax.toLocaleString()}`;
        if (summaryTotal) summaryTotal.textContent = `₹${data.total.toLocaleString()}`;

        updateCartBadge(data.cartCount);
      } else {
        showToast(data.message || 'Could not update quantity.', 'error');
        if (input) input.disabled = false;
      }
    } catch (err) {
      showToast('Network error updating cart.', 'error');
      if (input) input.disabled = false;
    }
  }
});
