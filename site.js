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

  /* ── Cookie consent (Google Consent Mode v2) ──
     Default is denied, including before a choice. The Google tag may still
     send cookieless pings while analytics storage is denied. Analytics
     cookies are written only after Accept. This block only updates that
     stored choice; it does not turn the cookieless pings on or off. */
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

/* First-touch visit data for every form on this site.
   sessionStorage is per tab and is cleared when the tab closes. It is not a
   cookie and it is not sent to Google with the page view. Hidden fields are
   filled when the page loads and refreshed again on submit. The first
   non-empty value for each campaign field is kept, so a later page cannot
   replace it with a blank or a different campaign. The landing page and the
   original document.referrer are recorded once, on the first page of the
   visit. Declining analytics cookies does not clear this; it is part of the
   message they choose to send. */
(function () {
  'use strict';

  var KEY = 'asf_attribution';
  var CAMPAIGN_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'ttclid', 'msclkid'
  ];
  var FIELD_NAMES = CAMPAIGN_KEYS.concat(['landing_page', 'page_url', 'referrer']);
  var memory = null;

  function clean(value) {
    if (typeof value !== 'string') {
      if (value == null) return '';
      value = String(value);
    }
    return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800);
  }

  function pageUrl() {
    return window.location.origin + window.location.pathname + window.location.search;
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return memory;
  }

  function save(data) {
    memory = data;
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function capture() {
    var prev = load() || {};
    var data = {};
    CAMPAIGN_KEYS.forEach(function (key) {
      data[key] = clean(prev[key]);
    });
    var params = new URLSearchParams(window.location.search);
    CAMPAIGN_KEYS.forEach(function (key) {
      var incoming = clean(params.get(key));
      if (incoming && !data[key]) data[key] = incoming;
    });
    if (clean(prev.landing_page)) {
      data.landing_page = clean(prev.landing_page);
      data.referrer = clean(prev.referrer);
    } else {
      data.landing_page = clean(pageUrl());
      data.referrer = clean(document.referrer);
    }
    save(data);
    return data;
  }

  function fillForm(form) {
    if (!form || !form.querySelector) return;
    var data = capture();
    FIELD_NAMES.forEach(function (name) {
      var input = form.querySelector('input[data-asf-attribution="' + name + '"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.setAttribute('data-asf-attribution', name);
        input.tabIndex = -1;
        input.setAttribute('autocomplete', 'off');
        form.appendChild(input);
      }
      var value = name === 'page_url' ? clean(pageUrl()) : clean(data[name]);
      input.value = value;
      input.defaultValue = value;
    });
  }

  function fillAll() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) fillForm(forms[i]);
  }

  /* form_name plus the three campaign fields only. No names, emails, or answers. */
  window.asfTrack = function (eventName, formName, form) {
    try {
      function read(name) {
        var input = form && form.querySelector
          ? form.querySelector('input[data-asf-attribution="' + name + '"]')
          : null;
        return input ? clean(input.value) : '';
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        form_name: formName,
        utm_source: read('utm_source'),
        utm_medium: read('utm_medium'),
        utm_campaign: read('utm_campaign')
      });
    } catch (e) {}
  };

  function mailchimpJsonp(form) {
    return new Promise(function (resolve, reject) {
      var cbName = 'asfMc' + Math.random().toString(36).slice(2, 10);
      var endpoint = String(form.action || '').replace('/subscribe/post?', '/subscribe/post-json?');
      if (endpoint.indexOf('/subscribe/post-json?') === -1) {
        reject(new Error('endpoint'));
        return;
      }
      var params = new URLSearchParams(new FormData(form));
      params.set('c', cbName);
      var script = document.createElement('script');
      var settled = false;
      function finish(ok, value) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
        if (ok) resolve(value || {});
        else reject(value);
      }
      var timer = window.setTimeout(function () { finish(false, new Error('timeout')); }, 10000);
      window[cbName] = function (resp) { finish(true, resp); };
      script.onerror = function () { finish(false, new Error('network')); };
      script.async = true;
      script.src = endpoint + '&' + params.toString();
      document.head.appendChild(script);
    });
  }

  /* Mailchimp prefixes field errors with "0 - " or "1 - ". Show the sentence
     after that prefix. Already-subscribed stays a short friendly line and
     never repeats the address Mailchimp echoes back. Nothing here is sent
     to dataLayer. */
  function newsletterErrorMessage(resp) {
    var raw = resp && resp.msg != null ? String(resp.msg) : '';
    if (/already subscribed/i.test(raw)) {
      return "You're already on the list. You're all set.";
    }
    var text = raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&apos;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\d+\s*-\s*/, '');
    if (/already subscribed/i.test(text)) {
      return "You're already on the list. You're all set.";
    }
    if (text) return text;
    return "Please check your first name and email, then try again.";
  }

  function bindNewsletter(form) {
    if (!form || form.getAttribute('data-asf-newsletter') === '1') return;
    if (String(form.action || '').indexOf('list-manage.com') === -1) return;
    form.setAttribute('data-asf-newsletter', '1');

    var status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.insertAdjacentElement('afterend', status);

    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : 'Subscribe';

    form.addEventListener('submit', function (e) {
      /* Second click after a network failure uses the original Mailchimp tab.
         That tab does not report success back, so no sign_up event is sent. */
      if (form.getAttribute('data-asf-native') === '1') {
        form.removeAttribute('data-asf-native');
        return;
      }
      e.preventDefault();
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }
      status.className = 'form-status';
      status.textContent = '';

      mailchimpJsonp(form).then(function (resp) {
        var ok = resp && String(resp.result).toLowerCase() === 'success';
        if (ok) {
          window.asfTrack('sign_up', 'newsletter', form);
          status.textContent = 'Thanks! Please check your inbox to confirm.';
          status.className = 'form-status show';
          form.hidden = true;
          return;
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = label;
        }
        status.textContent = newsletterErrorMessage(resp);
        status.className = 'form-status show error';
      }).catch(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = label;
        }
        form.setAttribute('data-asf-native', '1');
        status.textContent = "I couldn't reach the list just now. Please press Subscribe once more.";
        status.className = 'form-status show error';
      });
    });
  }

  function start() {
    fillAll();
    var newsletters = document.querySelectorAll('form.newsletter-form');
    for (var n = 0; n < newsletters.length; n++) bindNewsletter(newsletters[n]);
  }

  try {
    capture();
    document.addEventListener('submit', function (e) {
      try {
        var form = e.target;
        if (!form || String(form.tagName).toLowerCase() !== 'form') return;
        fillForm(form);
      } catch (err) {}
    }, true);
    document.addEventListener('reset', function (e) {
      var form = e.target;
      if (!form || String(form.tagName).toLowerCase() !== 'form') return;
      window.setTimeout(function () {
        try { fillForm(form); } catch (err) {}
      }, 0);
    }, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  } catch (e) {}
})();
