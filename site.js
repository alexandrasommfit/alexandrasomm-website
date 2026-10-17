(function () {
  'use strict';

  /* ── Mobile menu ── */
  var menuBtn = document.querySelector('.hamburger');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ── Footer year ── */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ── FAQ: one open at a time ── */
  var faqs = document.querySelectorAll('details.faq-item');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d && o.open) o.removeAttribute('open'); });
    });
  });

  /* ── Cookie consent (Google Consent Mode v2; analytics only after opt-in) ── */
  var KEY = 'asf_consent';
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function update(granted) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    }
  }
  function clearAnalyticsCookies() {
    var host = location.hostname;
    var bits = host.split('.');
    var domains = [host, '.' + host];
    if (bits.length > 2) domains.push('.' + bits.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid' || name.indexOf('_gat') === 0) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
        });
      }
    });
  }

  var banner = document.createElement('div');
  banner.className = 'consent-banner';
  banner.id = 'consent-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.hidden = true;
  banner.innerHTML =
    '<p>I use cookies for anonymous site analytics (Google Analytics) to understand how this site is used. ' +
    'The site works the same either way. <a href="/privacy#cookies">Learn more</a></p>' +
    '<div class="consent-actions">' +
    '<button type="button" class="consent-btn" data-consent="granted">Accept</button>' +
    '<button type="button" class="consent-btn secondary" data-consent="denied">Decline</button>' +
    '</div>';
  document.body.appendChild(banner);

  banner.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]');
    if (!b) return;
    var granted = b.getAttribute('data-consent') === 'granted';
    write(granted ? 'granted' : 'denied');
    update(granted);
    if (!granted) clearAnalyticsCookies();
    banner.hidden = true;
    var opener = document.getElementById('cookie-settings');
    if (opener) opener.focus();
  });

  if (!read()) banner.hidden = false;

  var settings = document.getElementById('cookie-settings');
  if (settings) {
    settings.addEventListener('click', function () {
      banner.hidden = false;
      var first = banner.querySelector('button');
      if (first) first.focus();
    });
  }
})();
