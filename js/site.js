/* TJ Interiors — site behaviour (no dependencies) */
(function () {
  'use strict';
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function show(el, on) { if (el) { el.hidden = !on; } }

  /* ---------- Mobile menu ---------- */
  $$('[data-action="menu"]').forEach(function (btn) {
    var scope = btn.closest('header') || document;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $$('[data-if="open"],[data-if="menuOpen"]', scope).forEach(function (el) { show(el, open); });
      $$('[data-if="closed"],[data-if="menuClosed"]', scope).forEach(function (el) { show(el, !open); });
    });
  });

  /* ---------- Hero slider ---------- */
  var slides = $$('.hero .slide');
  if (slides.length) {
    var index = 0, timer = null, playing = true, DELAY = 6000;
    var dots = $$('[data-go]');
    var counter = document.querySelector('[data-counter]');
    var playBtn = document.querySelector('[data-action="play"]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    var go = function (n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('on', k === index);
        s.setAttribute('aria-hidden', String(k !== index));
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('on', k === index);
        d.setAttribute('aria-current', String(k === index));
      });
      if (counter) { counter.textContent = pad(index + 1) + ' / ' + pad(slides.length); }
    };
    var restart = function () {
      clearInterval(timer);
      if (playing) { timer = setInterval(function () { go(index + 1); }, DELAY); }
    };
    var setPlaying = function (p) {
      playing = p;
      if (playBtn) {
        playBtn.setAttribute('aria-label', p ? 'Pause slideshow' : 'Play slideshow');
        show(playBtn.querySelector('[data-if="playing"]'), p);
        show(playBtn.querySelector('[data-if="paused"]'), !p);
      }
      restart();
    };

    dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.getAttribute('data-go')); restart(); }); });
    $$('[data-action="prev"]').forEach(function (b) { b.addEventListener('click', function () { go(index - 1); restart(); }); });
    $$('[data-action="next"]').forEach(function (b) { b.addEventListener('click', function () { go(index + 1); restart(); }); });
    if (playBtn) { playBtn.addEventListener('click', function () { setPlaying(!playing); }); }

    // Swipe on touch screens
    var hero = document.querySelector('.hero'), startX = null;
    if (hero) {
      hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      hero.addEventListener('touchend', function (e) {
        if (startX === null) { return; }
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); restart(); }
        startX = null;
      });
    }
    // Pause while the tab is hidden
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearInterval(timer); } else { restart(); }
    });

    setPlaying(!reduce);
  }

  /* ---------- Multi-select chips ---------- */
  $$('[data-toggle]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var on = !chip.classList.contains('on');
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', String(on));
    });
  });

  /* ---------- Showroom / home visit choice ---------- */
  var locs = $$('[data-loc]');
  locs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      locs.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      var home = btn.getAttribute('data-loc') === 'Home visit';
      $$('[data-if="atHome"]').forEach(function (el) { show(el, home); });
    });
  });

  /* ---------- Gallery filter ---------- */
  var filters = $$('[data-filter]');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-filter');
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('.gitem[data-cat]').forEach(function (fig) {
        fig.classList.toggle('hide', cat !== 'all' && fig.getAttribute('data-cat') !== cat);
      });
    });
  });

  /* ---------- Enquiry forms ----------
     Forms post to Formspree (free). Replace YOUR_FORM_ID in each form's
     action with your own form ID from https://formspree.io to receive emails. */
  $$('form[data-form]').forEach(function (form) {
    var wrap = form.closest('.dcif');
    var box = wrap ? wrap.parentElement : form.parentElement;
    var thanks = box.querySelector('[data-if="sent"]');
    var submitBtn = form.querySelector('[type="submit"]');

    var done = function () { show(wrap, false); show(thanks, true); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var picked = $$('[data-toggle].on', form).map(function (c) { return c.getAttribute('data-toggle'); });
      if (picked.length) { data.append('interested_in', picked.join(', ')); }
      var loc = form.querySelector('[data-loc].on');
      if (loc) { data.append('meeting_place', loc.getAttribute('data-loc')); }

      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        // Not connected yet — show the thank-you message so the page can be previewed.
        console.warn('TJ Interiors: form not connected. Add your Formspree ID to the form action.');
        done();
        return;
      }
      if (submitBtn) { submitBtn.disabled = true; }
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) { throw new Error('Request failed'); }
          done();
        })
        .catch(function () {
          var msg = form.querySelector('.form-error');
          if (!msg) {
            msg = document.createElement('p');
            msg.className = 'form-error small';
            msg.setAttribute('role', 'alert');
            msg.style.cssText = 'margin:0;color:#8A2E2E';
            form.appendChild(msg);
          }
          msg.textContent = 'Sorry, something went wrong. Please call us on 01243 967739 or email tjinteriors@hotmail.co.uk.';
        })
        .then(function () { if (submitBtn) { submitBtn.disabled = false; } });
    });
  });

  $$('[data-action="reset"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var thanks = btn.closest('.dcif');
      var box = thanks ? thanks.parentElement : document;
      var form = box.querySelector('form[data-form]');
      show(thanks, false);
      if (form) {
        form.reset();
        $$('[data-toggle]', form).forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        show(form.closest('.dcif'), true);
      }
    });
  });
})();
