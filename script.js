/* =========================================
   PS5LUXE — Luxury Rental Website
   script.js
   ========================================= */

/* --- NAV SCROLL EFFECT --- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 40
    ? 'rgba(11,13,16,0.98)'
    : 'rgba(11,13,16,0.92)';
});

/* --- HAMBURGER MENU --- */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* --- PRICING CARD → PREFILL FORM --- */
document.querySelectorAll('[data-plan]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const plan = btn.getAttribute('data-plan');
    const select = document.getElementById('plan');
    if (select) {
      select.value = plan;
      // Trigger cost preview update
      select.dispatchEvent(new Event('change'));
    }
  });
});

/* --- COST PREVIEW --- */
const prices = { 'Standard - ₹199/hr': 199, 'Pro - ₹499/hr': 499, 'Elite - ₹999/hr': 999 };
const planSelect = document.getElementById('plan');
const hoursSelect = document.getElementById('hours');
const costPreview = document.getElementById('costPreview');
const costAmount = document.getElementById('costAmount');

function updateCost() {
  const plan = planSelect.value;
  const hrs = parseInt(hoursSelect.value);
  if (plan && hrs && prices[plan]) {
    const total = prices[plan] * hrs;
    costAmount.textContent = '₹' + total.toFixed(2);
    costPreview.style.display = 'flex';
  } else {
    costPreview.style.display = 'none';
  }
}
planSelect.addEventListener('change', updateCost);
hoursSelect.addEventListener('change', updateCost);

/* --- SET MIN DATE TO TODAY --- */
const dateInput = document.getElementById('date');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

/* --- FORM VALIDATION & SUBMIT --- */
const bookingForm = document.getElementById('bookingForm');
const modal = document.getElementById('successModal');
const modalSummary = document.getElementById('modalSummary');
const modalClose = document.getElementById('modalClose');

function showError(fieldId, errId, msg) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);
  if (field) field.classList.add('error');
  if (err) err.textContent = msg;
}
function clearError(fieldId, errId) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);
  if (field) field.classList.remove('error');
  if (err) err.textContent = '';
}

// Live clear on input
['fname','phone','email','plan','address','date','time','hours','id'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => clearError(id, id + 'Err'));
  if (el) el.addEventListener('change', () => clearError(id, id + 'Err'));
});

function validateForm() {
  let valid = true;

  const fname = document.getElementById('fname').value.trim();
  if (!fname) { showError('fname','fnameErr','Full name is required.'); valid = false; }
  else clearError('fname','fnameErr');

  const phone = document.getElementById('phone').value.trim();
  const phoneRe = /^[\+]?[\d\s\-\(\)]{7,15}$/;
  if (!phone) { showError('phone','phoneErr','Phone number is required.'); valid = false; }
  else if (!phoneRe.test(phone)) { showError('phone','phoneErr','Enter a valid phone number.'); valid = false; }
  else clearError('phone','phoneErr');

  const email = document.getElementById('email').value.trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) { showError('email','emailErr','Email is required.'); valid = false; }
  else if (!emailRe.test(email)) { showError('email','emailErr','Enter a valid email address.'); valid = false; }
  else clearError('email','emailErr');

  const plan = document.getElementById('plan').value;
  if (!plan) { showError('plan','planErr','Please select a package.'); valid = false; }
  else clearError('plan','planErr');

  const address = document.getElementById('address').value.trim();
  if (!address) { showError('address','addressErr','Delivery address is required.'); valid = false; }
  else clearError('address','addressErr');

  const date = document.getElementById('date').value;
  if (!date) { showError('date','dateErr','Delivery date is required.'); valid = false; }
  else clearError('date','dateErr');

  const time = document.getElementById('time').value;
  if (!time) { showError('time','timeErr','Delivery time is required.'); valid = false; }
  else clearError('time','timeErr');

  const hours = document.getElementById('hours').value;
  if (!hours) { showError('hours','hoursErr','Rental duration is required.'); valid = false; }
  else clearError('hours','hoursErr');

  const idNo = document.getElementById('id').value.trim();
  if (!idNo) { showError('id','idErr','ID number is required.'); valid = false; }
  else clearError('id','idErr');

  return valid;
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Check if user is authenticated
  if (!bookingForm.dataset.authenticated || bookingForm.dataset.authenticated === 'false') {
    alert('Please login first to book a rental.');
    window.location.href = '/auth/login';
    return;
  }

  if (!validateForm()) return;

  const fname   = document.getElementById('fname').value.trim();
  const email   = document.getElementById('email').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const plan    = document.getElementById('plan').value;
  const address = document.getElementById('address').value.trim();
  const date    = document.getElementById('date').value;
  const time    = document.getElementById('time').value;
  const hours   = document.getElementById('hours').value;
  const idNo    = document.getElementById('id').value.trim();
  const notes   = document.getElementById('notes').value.trim();

  const pricePerHr = prices[plan] || 0;
  const total = pricePerHr * parseInt(hours);

  // Format date
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Format time
  const [h, m] = time.split(':');
  const hr = parseInt(h);
  const formattedTime = (hr > 12 ? hr - 12 : hr || 12) + ':' + m + (hr >= 12 ? ' PM' : ' AM');

  const submitBtn = bookingForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Processing...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: fname,
        email: email,
        phone: phone,
        serviceType: plan,
        bookingDate: date,
        bookingTime: time,
        duration: hours,
        notes: `Address: ${address} | ID: ${idNo} | Notes: ${notes}`
      })
    });

    if (!response.ok) throw new Error('Failed to save booking');

    modalSummary.innerHTML =
      `Hi <strong>${fname}</strong>! Your <strong>${plan}</strong> rental has been booked.<br>` +
      `Delivery to <em>${address}</em> on <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong>.<br>` +
      `Duration: <strong>${hours} hour${hours > 1 ? 's' : ''}</strong> &mdash; Estimated Total: <strong style="color:#C9A24A">₹${total.toFixed(2)}</strong>`;

    modal.classList.add('open');
    bookingForm.reset();
    costPreview.style.display = 'none';
  } catch (err) {
    console.error(err);
    alert('There was an error saving your booking. Please try again.');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

/* --- CLOSE MODAL --- */
modalClose.addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('open'); });

/* --- AUTH STATE --- */
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authName = document.getElementById('authName');
const dashboardBtn = document.getElementById('dashboardBtn');

async function refreshAuthState() {
  try {
    const response = await fetch('/api/session');
    const data = await response.json();
    const authenticated = data.authenticated === true;

    // Mark booking form with auth status
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.dataset.authenticated = authenticated;
    }

    if (authenticated) {
      loginBtn?.classList.add('hidden');
      logoutBtn?.classList.remove('hidden');
      if (dashboardBtn) {
        dashboardBtn.classList.remove('hidden');
        if (data.user?.email === 'gamaa.rental@gmail.com') {
          dashboardBtn.href = '/admin';
          dashboardBtn.textContent = 'Admin Portal';
          dashboardBtn.classList.add('btn--gold');
          dashboardBtn.classList.remove('btn--ghost');
        }
      }
      authName && (authName.textContent = `Logged in as ${data.user?.name || data.user?.email || 'user'}`);
      
      // Auto-fill booking form details
      const fnameInput = document.getElementById('fname');
      const emailInput = document.getElementById('email');
      if (fnameInput && !fnameInput.value) fnameInput.value = data.user?.name || '';
      if (emailInput && !emailInput.value) emailInput.value = data.user?.email || '';
    } else {
      loginBtn?.classList.remove('hidden');
      logoutBtn?.classList.add('hidden');
      dashboardBtn?.classList.add('hidden');
      authName && (authName.textContent = '');
    }
  } catch (err) {
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    dashboardBtn?.classList.add('hidden');
    authName && (authName.textContent = '');
  }
}

window.addEventListener('load', refreshAuthState);

/* --- FAQ ACCORDION --- */
document.querySelectorAll('.faq').forEach(faq => {
  faq.querySelector('.faq__q').addEventListener('click', () => {
    const isOpen = faq.getAttribute('data-open') === 'true';
    // Close all
    document.querySelectorAll('.faq').forEach(f => f.setAttribute('data-open', 'false'));
    // Toggle clicked
    faq.setAttribute('data-open', isOpen ? 'false' : 'true');
  });
});

/* --- SMOOTH ACTIVE NAV --- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? '#C9A24A' : '';
  });
}, { passive: true });

/* --- SCROLL REVEAL (lightweight) --- */
const reveals = document.querySelectorAll('.pricing-card, .step, .testimonial, .faq');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = entry.target.style.transform.replace('translateY(30px)', 'translateY(0)');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  const base = getComputedStyle(el).transform;
  el.style.transform = (base === 'none' ? '' : base + ' ') + 'translateY(30px)';
  observer.observe(el);
});
