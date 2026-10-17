(function () {
  'use strict';
  var ERROR_HTML = 'Something went wrong sending your message. Please try again, or email me directly at ' +
    '<a href="mailto:alexandrasommfit@gmail.com">alexandrasommfit@gmail.com</a>.';

  /* ── Contact form ── */
  var contact = document.getElementById('contact-form');
  if (contact) {
    var cStatus = document.getElementById('contact-status');
    var cBtn = contact.querySelector('.btn-submit');
    var cLabel = cBtn.textContent;

    contact.addEventListener('submit', async function (e) {
      e.preventDefault();
      cStatus.className = 'form-status';
      cStatus.textContent = '';

      var data = new FormData(contact);
      var firstName = data.get('first_name') || '';
      var lastName = data.get('last_name') || '';
      var email = data.get('email') || '';
      var subject = data.get('subject') || '';

      cBtn.disabled = true;
      cBtn.textContent = 'Sending…';
      try {
        var res = await fetch(contact.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Request failed');

        contact.reset();
        cBtn.disabled = false;
        cBtn.textContent = cLabel;

        if (subject === 'Coaching Inquiry') {
          // Only coaching inquiries continue to the onboarding questionnaire.
          cStatus.textContent = 'Thanks! One more step…';
          cStatus.className = 'form-status show';
          var params = new URLSearchParams({ first_name: firstName, last_name: lastName, email: email });
          setTimeout(function () { window.location.href = '/get-started?' + params.toString(); }, 1000);
        } else {
          cStatus.textContent = "Thanks! I'll be in touch soon ✦";
          cStatus.className = 'form-status show';
        }
      } catch (err) {
        cBtn.disabled = false;
        cBtn.textContent = cLabel;
        cStatus.innerHTML = ERROR_HTML;
        cStatus.className = 'form-status show error';
      }
    });
  }

  /* ── Get Started (onboarding) form ── */
  var gs = document.getElementById('get-started-form');
  if (gs) {
    var thankYou = document.getElementById('thank-you');
    var statusError = document.getElementById('form-status-error');
    var servicesError = document.getElementById('services-error');
    var subjectInput = document.getElementById('og-subject');
    var firstNameInput = gs.querySelector('[name="first_name"]');
    var lastNameInput = gs.querySelector('[name="last_name"]');
    var gBtn = gs.querySelector('.btn-submit');
    var gLabel = gBtn.textContent;

    var params2 = new URLSearchParams(window.location.search);
    ['first_name', 'last_name', 'email'].forEach(function (key) {
      var val = params2.get(key);
      var input = gs.querySelector('[name="' + key + '"]');
      if (val && input) input.value = val;
    });

    function updateSubject() {
      var full = ((firstNameInput.value || '').trim() + ' ' + (lastNameInput.value || '').trim()).trim();
      subjectInput.value = full ? 'Onboarding Questions — ' + full : 'Onboarding Questions — New submission';
    }

    gs.addEventListener('submit', async function (e) {
      e.preventDefault();
      statusError.classList.remove('show');
      servicesError.classList.remove('show');

      if (!gs.checkValidity()) { gs.reportValidity(); return; }

      if (!gs.querySelector('input[name="services[]"]:checked')) {
        servicesError.classList.add('show');
        var firstService = gs.querySelector('input[name="services[]"]');
        firstService.focus();
        firstService.scrollIntoView({ block: 'center' });
        return;
      }

      updateSubject();
      var data = new FormData(gs);
      data.set('consent_timestamp', new Date().toISOString());
      data.set('consent_policy_version', '2026-10-17');

      gBtn.disabled = true;
      gBtn.textContent = 'Sending…';
      try {
        var res = await fetch(gs.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Form submission failed');
        gs.style.display = 'none';
        thankYou.style.display = 'block';
        thankYou.setAttribute('tabindex', '-1');
        thankYou.focus();
        thankYou.scrollIntoView({ block: 'start' });
      } catch (err) {
        gBtn.disabled = false;
        gBtn.textContent = gLabel;
        statusError.classList.add('show');
        statusError.scrollIntoView({ block: 'center' });
      }
    });
  }
})();
