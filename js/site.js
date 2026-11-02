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

  /* ---------- Intro video (loads YouTube only when played) ---------- */
  $$('[data-yt]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (card.classList.contains('playing')) { return; }
      e.preventDefault();
      var id = card.getAttribute('data-yt');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      frame.title = 'TJ Interiors introductory video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      card.classList.add('playing');
      card.removeAttribute('href');
      card.setAttribute('role', 'region');
      card.setAttribute('aria-label', 'TJ Interiors introductory video');
      Array.prototype.forEach.call(card.children, function (c) { c.style.display = 'none'; });
      card.appendChild(frame);
    });
  });

  /* ---------- Multi-select chips ---------- */
  $$('[data-toggle]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var on = !chip.classList.contains('on');
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', String(on));
    });
  });

  /* ---------- Choose Trudi or Tim ---------- */
  $$('form[data-form]').forEach(function (form) {
    var people = $$('[data-person]', form);
    people.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var who = btn.getAttribute('data-person');
        people.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        $$('[data-chips]', form).forEach(function (g) {
          var visible = g.getAttribute('data-chips') === who;
          show(g, visible);
          if (!visible) {
            $$('[data-toggle]', g).forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
          }
        });
        $$('[data-if="noPerson"]', form).forEach(function (el) { show(el, false); });
        $$('[data-if="hasPerson"]', form).forEach(function (el) { show(el, true); });
        var err = form.querySelector('.person-error');
        if (err) { err.remove(); }
      });
    });
  });

  /* ---------- Appointment day and time ----------
     Hourly slots within opening hours: Mon to Fri 9am to 3pm starts,
     Sat 9:30am to 11:30am starts, closed Sunday. */
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MOL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAY_SLOTS = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'];
  var SAT_SLOTS = ['9:30am', '10:30am', '11:30am'];
  var dayLabel = function (d) { return WDL[d.getDay()] + ' ' + d.getDate() + ' ' + MOL[d.getMonth()]; };

  $$('form[data-form]').forEach(function (form) {
    var dayRow = form.querySelector('[data-days]');
    var slotGrid = form.querySelector('[data-slots]');
    if (!dayRow || !slotGrid) { return; }
    var days = [], dt = new Date();
    dt.setHours(12, 0, 0, 0);
    while (days.length < 12) {
      dt.setDate(dt.getDate() + 1);
      if (dt.getDay() !== 0) { days.push(new Date(dt.getTime())); }
    }
    form._appt = { day: null, slot: '' };

    var clearErr = function () { var e = form.querySelector('.slot-error'); if (e) { e.remove(); } };
    var pressGroup = function (group, btn) {
      $$('button', group).forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };
    var renderSlots = function (d) {
      slotGrid.innerHTML = '';
      (d.getDay() === 6 ? SAT_SLOTS : WEEKDAY_SLOTS).forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'slot'; b.textContent = s;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { form._appt.slot = s; pressGroup(slotGrid, b); clearErr(); });
        slotGrid.appendChild(b);
      });
    };
    form._resetAppt = function () {
      form._appt = { day: null, slot: '' };
      pressGroup(dayRow, null);
      slotGrid.innerHTML = '';
      $$('[data-if="hasDay"]', form).forEach(function (el) { show(el, false); });
      $$('[data-if="noDay"]', form).forEach(function (el) { show(el, true); });
    };
    days.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'day-pick';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', dayLabel(d));
      b.innerHTML = '<span class="dw">' + WD[d.getDay()] + '</span><span class="dn">' + d.getDate() + '</span><span class="dm">' + MO[d.getMonth()] + '</span>';
      b.addEventListener('click', function () {
        form._appt = { day: d, slot: '' };
        pressGroup(dayRow, b);
        renderSlots(d);
        $$('[data-if="hasDay"]', form).forEach(function (el) { show(el, true); });
        $$('[data-if="noDay"]', form).forEach(function (el) { show(el, false); });
      });
      dayRow.appendChild(b);
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
      var who = form.querySelector('[data-person].on');
      if (form.querySelector('[data-person]') && !who) {
        var err = form.querySelector('.person-error');
        if (!err) {
          err = document.createElement('p');
          err.className = 'person-error';
          err.setAttribute('role', 'alert');
          err.style.cssText = 'margin:8px 0 0;font-size:14px;color:#8A2E2E';
          err.textContent = 'Please choose Trudi or Tim so we know who to book you in with.';
          var first = form.querySelector('[data-person]');
          first.parentElement.insertAdjacentElement('afterend', err);
        }
        form.querySelector('[data-person]').focus();
        return;
      }
      var appt = form._appt;
      if (appt && (!appt.day || !appt.slot)) {
        var serr = form.querySelector('.slot-error');
        if (!serr) {
          serr = document.createElement('p');
          serr.className = 'slot-error';
          serr.setAttribute('role', 'alert');
          serr.style.cssText = 'margin:8px 0 0;font-size:14px;color:#8A2E2E';
          form.querySelector('[data-slots]').closest('fieldset').appendChild(serr);
        }
        serr.textContent = appt.day ? 'Please choose a time for your appointment.' : 'Please choose a day and time for your appointment.';
        (form.querySelector('[data-slots] button') || form.querySelector('[data-days] button')).focus();
        return;
      }
      var data = new FormData(form);
      if (who) { data.append('appointment_with', who.getAttribute('data-person')); }
      var summaryText = '';
      if (appt && appt.day) {
        data.append('appointment_day', dayLabel(appt.day));
        data.append('appointment_time', appt.slot);
        summaryText = 'Your requested appointment: ' + (who ? who.getAttribute('data-person') : 'Trudi or Tim') + ', ' + dayLabel(appt.day) + ' at ' + appt.slot + '.';
      }
      $$('[data-summary]', box).forEach(function (el) { el.textContent = summaryText; });
      data.append('appointment_type', 'Showroom appointment');
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
        $$('[data-person]', form).forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
        $$('[data-chips], [data-if="hasPerson"]', form).forEach(function (g) { show(g, false); });
        $$('[data-if="noPerson"]', form).forEach(function (g) { show(g, true); });
        if (form._resetAppt) { form._resetAppt(); }
        show(form.closest('.dcif'), true);
      }
    });
  });
})();
