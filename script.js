/* Elia Ora Studio — shared behaviour */
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Cart (localStorage-backed) ---------- */
  var CART_KEY = 'eos_cart';

  function readCart() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function writeCart(items) {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
  }

  function formatPKR(amount) {
    return 'PKR ' + Number(amount).toLocaleString('en-PK');
  }

  function addToCart(item) {
    var items = readCart();
    var existing = items.find(function (i) { return i.id === item.id; });
    if (existing) { existing.qty += 1; } else { items.push({ id: item.id, name: item.name, price: item.price, qty: 1 }); }
    writeCart(items);
    renderCart();
  }

  function removeFromCart(id) {
    var items = readCart().filter(function (i) { return i.id !== id; });
    writeCart(items);
    renderCart();
  }

  function cartCount(items) {
    return items.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function cartTotal(items) {
    return items.reduce(function (sum, i) { return sum + i.qty * i.price; }, 0);
  }

  function renderCart() {
    var items = readCart();
    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = cartCount(items);
    });

    var list = document.querySelector('.cart-items');
    var subtotalEl = document.querySelector('.cart-subtotal-amount');
    if (!list) return;

    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<p class="cart-empty">Your cart is currently empty.</p>';
    } else {
      items.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'cart-line';
        row.innerHTML =
          '<div class="cart-line-thumb">E·O</div>' +
          '<div><div class="cart-line-name">' + item.name + '</div>' +
          '<div class="cart-line-price">' + item.qty + ' &times; ' + formatPKR(item.price) + '</div></div>' +
          '<button class="cart-line-remove" type="button" data-remove="' + item.id + '">Remove</button>';
        list.appendChild(row);
      });
    }
    if (subtotalEl) subtotalEl.textContent = formatPKR(cartTotal(items));

    list.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () { removeFromCart(btn.getAttribute('data-remove')); });
    });
  }

  function openCart() {
    document.querySelector('.cart-overlay').classList.add('is-open');
    document.querySelector('.cart-drawer').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    document.querySelector('.cart-overlay').classList.remove('is-open');
    document.querySelector('.cart-drawer').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-cart-open]').forEach(function (btn) {
    btn.addEventListener('click', openCart);
  });
  document.querySelectorAll('[data-cart-close]').forEach(function (btn) {
    btn.addEventListener('click', closeCart);
  });
  var overlay = document.querySelector('.cart-overlay');
  if (overlay) overlay.addEventListener('click', closeCart);

  document.querySelectorAll('.add-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addToCart({
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        price: parseFloat(btn.getAttribute('data-price'))
      });
      btn.classList.add('added');
      var original = btn.textContent;
      btn.textContent = 'Added';
      setTimeout(function () { btn.classList.remove('added'); btn.textContent = original; }, 1400);
      openCart();
    });
  });

  renderCart();

  /* ---------- Shop filters ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('[data-category]');
  var resultCount = document.querySelector('.result-count');

  function applyFilter(category) {
    var visible = 0;
    cards.forEach(function (card) {
      var match = category === 'all' || card.getAttribute('data-category') === category;
      card.style.display = match ? '' : 'none';
      if (match) visible += 1;
    });
    if (resultCount) resultCount.textContent = visible + (visible === 1 ? ' piece' : ' pieces');
  }

  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        applyFilter(btn.getAttribute('data-filter'));
      });
    });
    applyFilter('all');
  }

  /* ---------- Contact form (static-site friendly) ---------- */
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var success = document.querySelector('.form-success');
      if (success) success.classList.add('is-visible');
      contactForm.reset();
    });
  }

  /* ---------- Track order (demo lookup) ---------- */
  var trackForm = document.querySelector('.track-form');
  if (trackForm) {
    var demoOrders = {
      'EOS1001': { status: 'In Transit', steps: ['Order Confirmed', 'In Production', 'Dispatched', 'In Transit', 'Delivered'], current: 3 },
      'EOS1002': { status: 'Delivered', steps: ['Order Confirmed', 'In Production', 'Dispatched', 'In Transit', 'Delivered'], current: 4 },
      'EOS1003': { status: 'In Production', steps: ['Order Confirmed', 'In Production', 'Dispatched', 'In Transit', 'Delivered'], current: 1 }
    };

    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var idInput = document.getElementById('order-id');
      var id = (idInput.value || '').trim().toUpperCase();
      var result = document.querySelector('.track-result');
      var errorEl = document.querySelector('.track-error');
      var order = demoOrders[id];

      if (!order) {
        errorEl.textContent = 'We couldn\u2019t find an order with that reference. Please check the ID and try again, or reach us at hello@eliaora.studio.';
        errorEl.classList.add('is-visible');
        result.classList.remove('is-visible');
        return;
      }

      errorEl.classList.remove('is-visible');
      document.querySelector('.status-text').textContent = order.status;
      var stepsEl = document.querySelector('.track-steps');
      stepsEl.innerHTML = '';
      order.steps.forEach(function (label, i) {
        var li = document.createElement('li');
        if (i <= order.current) li.classList.add('done');
        li.innerHTML = '<span class="step-dot"></span><span><span class="step-label">' + label + '</span></span>';
        stepsEl.appendChild(li);
      });
      result.classList.add('is-visible');
    });
  }
})();
