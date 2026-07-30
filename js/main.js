/* Fact Insure — site interactions */
(function () {
  "use strict";

  // Mobile nav toggle
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Header shadow on scroll
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Reviews slider
  var slider = document.getElementById("reviewSlider");
  if (slider) {
    var cards = Array.prototype.slice.call(slider.children);
    var dotsWrap = document.getElementById("reviewDots");
    var prevBtn = document.getElementById("reviewPrev");
    var nextBtn = document.getElementById("reviewNext");
    var goToCard = function (i) {
      slider.scrollTo({ left: cards[i].offsetLeft - slider.offsetLeft, behavior: "smooth" });
    };

    var dots = cards.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to review " + (i + 1));
      b.addEventListener("click", function () { goToCard(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    var visibleCount = function () {
      var w = window.innerWidth;
      if (w >= 1000) return 3;
      if (w >= 700) return 2;
      return 1;
    };

    var closestIndex = function () {
      var left = slider.scrollLeft;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var dist = Math.abs(c.offsetLeft - slider.offsetLeft - left);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    };

    var updateUI = function () {
      var idx = closestIndex();
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      var maxScroll = slider.scrollWidth - slider.clientWidth - 2;
      prevBtn.disabled = slider.scrollLeft <= 0;
      nextBtn.disabled = slider.scrollLeft >= maxScroll;
    };

    var scrollByCards = function (dir) {
      var n = visibleCount();
      var idx = closestIndex();
      var target = Math.max(0, Math.min(cards.length - 1, idx + dir * n));
      goToCard(target);
    };

    prevBtn.addEventListener("click", function () { scrollByCards(-1); });
    nextBtn.addEventListener("click", function () { scrollByCards(1); });

    var scrollTicking = false;
    slider.addEventListener("scroll", function () {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () { updateUI(); scrollTicking = false; });
    }, { passive: true });

    window.addEventListener("resize", updateUI);
    updateUI();

    // Auto-advance one-by-one; pause on hover/focus/hidden tab; respect reduced motion
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var autoTimer = null;
    var stopAuto = function () { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
    var advance = function () {
      var maxScroll = slider.scrollWidth - slider.clientWidth - 2;
      if (slider.scrollLeft >= maxScroll) { goToCard(0); }
      else { goToCard(Math.min(cards.length - 1, closestIndex() + 1)); }
    };
    var startAuto = function () {
      if (reduceMotion || cards.length <= visibleCount()) return;
      stopAuto();
      autoTimer = setInterval(advance, 4000);
    };
    var wrap = slider.closest(".review-slider-wrap") || slider;
    wrap.addEventListener("pointerenter", stopAuto);
    wrap.addEventListener("pointerleave", startAuto);
    wrap.addEventListener("focusin", stopAuto);
    wrap.addEventListener("focusout", startAuto);
    prevBtn.addEventListener("click", startAuto);
    nextBtn.addEventListener("click", startAuto);
    dots.forEach(function (d) { d.addEventListener("click", startAuto); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stopAuto(); } else { startAuto(); }
    });
    startAuto();
  }

  // Document accordion (dropdown) — smooth animated open/close
  var docItems = document.querySelectorAll(".doc-accordion .doc-item");
  docItems.forEach(function (item) {
    var summary = item.querySelector(".doc-summary");
    var panel = item.querySelector(".doc-panel");
    if (!summary || !panel) return;
    if (item.open) panel.style.maxHeight = "none";

    summary.addEventListener("click", function (e) {
      e.preventDefault();
      if (item.open) {
        // closing
        panel.style.maxHeight = panel.scrollHeight + "px";
        requestAnimationFrame(function () { panel.style.maxHeight = "0px"; });
        var onClose = function () {
          item.open = false;
          panel.style.maxHeight = "";
          panel.removeEventListener("transitionend", onClose);
        };
        panel.addEventListener("transitionend", onClose);
      } else {
        // opening
        item.open = true;
        panel.style.maxHeight = "0px";
        requestAnimationFrame(function () {
          panel.style.maxHeight = panel.scrollHeight + "px";
        });
        var onOpen = function () {
          panel.style.maxHeight = "none";
          panel.removeEventListener("transitionend", onOpen);
        };
        panel.addEventListener("transitionend", onOpen);
      }
    });
  });

  // Current year in footer
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // Contact form -> opens email client with prefilled message (no backend needed)
  var form = document.getElementById("contactForm");
  if (form) {
    var fieldOf = function (n) { return form.querySelector('[name="' + n + '"]'); };

    var showError = function (n, msg) {
      var el = fieldOf(n);
      if (!el) return;
      el.classList.add("is-invalid");
      el.setAttribute("aria-invalid", "true");
      var err = el.parentNode.querySelector(".field-error");
      if (!err) {
        err = document.createElement("span");
        err.className = "field-error";
        el.parentNode.appendChild(err);
      }
      err.textContent = msg;
    };

    var clearError = function (n) {
      var el = fieldOf(n);
      if (!el) return;
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
      var err = el.parentNode.querySelector(".field-error");
      if (err) err.remove();
    };

    // Indian mobile: 10 digits starting 6-9. Tolerates spaces, +91 and 0 prefixes.
    var normalisePhone = function (raw) {
      var d = raw.replace(/\D/g, "");
      if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
      else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
      return d;
    };

    ["name", "phone", "email"].forEach(function (n) {
      var el = fieldOf(n);
      if (el) el.addEventListener("input", function () { clearError(n); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var get = function (n) {
        var el = fieldOf(n);
        return el ? el.value.trim() : "";
      };
      var name = get("name"), phone = get("phone"), email = get("email"),
          type = get("type"), message = get("message");

      var firstBad = null;
      var fail = function (n, msg) { showError(n, msg); if (!firstBad) firstBad = fieldOf(n); };

      if (name.length < 2 || !/[a-zA-Zऀ-ॿ]/.test(name)) {
        fail("name", "Please enter your name.");
      } else clearError("name");

      var digits = normalisePhone(phone);
      if (!digits) fail("phone", "Please enter your mobile number.");
      else if (digits.length !== 10) fail("phone", "Enter a valid 10-digit mobile number.");
      else if (!/^[6-9]/.test(digits)) fail("phone", "Indian mobile numbers start with 6, 7, 8 or 9.");
      else clearError("phone");

      // Email is optional, but must be a real address when provided.
      if (email && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
        fail("email", "Enter a valid email address, e.g. name@example.com");
      } else clearError("email");

      var status = document.getElementById("formStatus");
      if (firstBad) {
        if (status) {
          status.textContent = "Please correct the highlighted fields and try again.";
          status.style.color = "#c0392b";
        }
        firstBad.focus();
        return;
      }

      phone = digits;
      var subject = "Insurance enquiry from " + (name || "website visitor");
      var body =
        "Name: " + name + "\n" +
        "Phone: " + phone + "\n" +
        "Email: " + email + "\n" +
        "Insurance type: " + (type || "—") + "\n\n" +
        "Message:\n" + message + "\n";
      var mailto = "mailto:factinsure@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      window.location.href = mailto;

      if (status) {
        status.textContent =
          "Your email app should now open with the details ready to send. If it doesn't, please call us or write to factinsure@gmail.com.";
        status.style.color = "var(--orange-600)";
      }
    });
  }

  // Hero quote form — tap a cover, drop two details, straight into WhatsApp
  var hq = document.getElementById("heroQuote");
  if (hq) {
    var hqName = document.getElementById("hqName");
    var hqPhone = document.getElementById("hqPhone");
    var hqBar = document.getElementById("hqBar");
    var hqLabel = document.getElementById("hqSubmitText");
    var chips = Array.prototype.slice.call(hq.querySelectorAll(".hq-chip"));
    var cover = "";

    var hqDigits = function (raw) {
      var d = raw.replace(/\D/g, "");
      if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
      else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
      return d;
    };

    var hqProgress = function () {
      var done = 0;
      if (cover) done++;
      if (hqName.value.trim().length >= 2) done++;
      if (hqDigits(hqPhone.value).length === 10) done++;
      hqBar.style.width = (done / 3 * 100) + "%";
    };

    var hqFail = function (el, msg) {
      el.classList.add("is-invalid");
      var e = el.parentNode.querySelector(".hq-err");
      if (!e) {
        e = document.createElement("span");
        e.className = "hq-err";
        el.parentNode.appendChild(e);
      }
      e.textContent = msg;
    };

    var hqOk = function (el) {
      el.classList.remove("is-invalid");
      var e = el.parentNode.querySelector(".hq-err");
      if (e) e.remove();
    };

    // "Life & Term" -> "Life", "Business / Liability" -> "Business"; vague picks stay generic
    var hqLabelText = function () {
      if (!cover || /^Not sure/.test(cover)) return "Get my free quote";
      return "Get my " + cover.split(/ [&\/] /)[0] + " quote";
    };

    var hqSelect = document.getElementById("hqCover");

    // Chips are shortcuts to the popular covers; the select carries the full list.
    // Keep them in sync so only one choice is ever active.
    var hqPaint = function () {
      chips.forEach(function (x) {
        var on = x.getAttribute("data-cover") === cover;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (hqSelect) {
        hqSelect.value = cover;
        // a cover picked via chip isn't always in the list, so confirm it stuck
        if (hqSelect.value !== cover) hqSelect.value = "";
        hqSelect.classList.toggle("has-value", !!hqSelect.value);
      }
      hqLabel.textContent = hqLabelText();
      hqProgress();
    };

    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", "false");
      c.addEventListener("click", function () {
        var wasOn = c.classList.contains("is-on");
        cover = wasOn ? "" : c.getAttribute("data-cover");
        hqPaint();
      });
    });

    if (hqSelect) {
      hqSelect.addEventListener("change", function () {
        cover = hqSelect.value;
        hqPaint();
      });
    }

    // The full list stays tucked away until asked for, so the chips read as one clean choice
    var hqMoreBtn = document.getElementById("hqMoreBtn");
    var hqMore = document.getElementById("hqMore");
    if (hqMoreBtn && hqMore) {
      hqMoreBtn.addEventListener("click", function () {
        hqMore.hidden = false;
        hqMoreBtn.hidden = true;
        hqMoreBtn.setAttribute("aria-expanded", "true");
        if (hqSelect) hqSelect.focus();
      });
    }

    [hqName, hqPhone].forEach(function (el) {
      el.addEventListener("input", function () { hqOk(el); hqProgress(); });
    });

    hq.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;

      var nm = hqName.value.trim();
      if (nm.length < 2 || !/[a-zA-Zऀ-ॿ]/.test(nm)) {
        hqFail(hqName, "Please enter your name.");
        bad = bad || hqName;
      } else hqOk(hqName);

      var d = hqDigits(hqPhone.value);
      if (!d) { hqFail(hqPhone, "Please enter your mobile number."); bad = bad || hqPhone; }
      else if (d.length !== 10) { hqFail(hqPhone, "Enter a valid 10-digit mobile number."); bad = bad || hqPhone; }
      else if (!/^[6-9]/.test(d)) { hqFail(hqPhone, "Indian mobile numbers start with 6, 7, 8 or 9."); bad = bad || hqPhone; }
      else hqOk(hqPhone);

      if (bad) { bad.focus(); return; }

      var msg = "Hi Fact Insure, I'd like a free quote.\n\n" +
        "Name: " + nm + "\n" +
        "Mobile: " + d + "\n" +
        "Cover needed: " + (cover || "Not sure — please advise");
      window.open("https://wa.me/919606712138?text=" + encodeURIComponent(msg), "_blank", "noopener");

      hqBar.style.width = "100%";
      hqLabel.textContent = "Opening WhatsApp…";
      setTimeout(function () { hqLabel.textContent = hqLabelText(); }, 2500);
    });

    hqProgress();
  }

  // Custom cursor — dot + trailing ring (desktop, fine pointer, motion allowed)
  var finePointer = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var reduceMo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (finePointer && !reduceMo) {
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-custom-cursor");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var place = function (el, x, y) {
      el.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%)";
    };

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      place(dot, mx, my);
      document.body.classList.remove("cursor-out");
    });
    document.addEventListener("mouseleave", function () { document.body.classList.add("cursor-out"); });
    document.addEventListener("mouseenter", function () { document.body.classList.remove("cursor-out"); });

    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      place(ring, rx, ry);
      requestAnimationFrame(loop);
    })();

    var interactive = "a,button,.btn,input,textarea,select,summary,[role=button],.slider-btn,.slider-dots button,.jump-nav a,.card--link,.wa-float,.wa-link";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(interactive)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(interactive)) document.body.classList.remove("cursor-hover");
    });
    document.addEventListener("mousedown", function () { document.body.classList.add("cursor-down"); });
    document.addEventListener("mouseup", function () { document.body.classList.remove("cursor-down"); });
  }
})();
