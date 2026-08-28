// Toast: HeroUI's toast.css styling (see input.css's
// @heroui/styles/components/toast.css import), driven server-side via
// HX-Trigger (see internal/shared/htmx.Toast) instead of the React
// toast()/Toast.Provider API this port doesn't have. Class names and
// data-slots match the CSS exactly so it looks like the real component.
//
// Stacking: only the most recent toast (data-frontmost="true") is
// interactive; earlier ones sit behind it, height-clamped to its height via
// --front-height (per toast.css's own `.toast:not([data-frontmost]) {
// height: var(--front-height) }` rule) so a taller queued toast doesn't
// blow out the region's layout. Dismissing the frontmost promotes the next
// one. document.startViewTransition (when supported) is what actually
// drives toast.css's slide-in/out keyframes on ::view-transition-*(.toast-*).
(function () {
  var DURATION = 5000;
  var MAX_QUEUED = 3;
  var STACK_OFFSET = 10; // px pushed up per layer behind the frontmost
  var STACK_SCALE = 0.05; // scale reduction per layer behind the frontmost
  var idCounter = 0;
  var transitionPending = false;

  function region() {
    return document.getElementById("toast-region");
  }

  function toasts() {
    var host = region();
    return host ? Array.prototype.slice.call(host.querySelectorAll(".toast")) : [];
  }

  function syncStack() {
    var host = region();
    var list = toasts();
    if (!host || list.length === 0) return;

    // Last child = most recently appended = frontmost. Toasts behind it are
    // pushed up and scaled down a little per layer so they visibly peek out
    // from underneath (toast.css itself only defines the frontmost/queued
    // states — not this offset — so it's a reasonable approximation).
    var front = list[list.length - 1];
    for (var i = list.length - 1; i >= 0; i--) {
      var t = list[i];
      var depth = Math.min(list.length - 1 - i, 2);
      if (t === front) {
        t.style.transform = "";
        t.setAttribute("data-frontmost", "true");
      } else {
        t.removeAttribute("data-frontmost");
        t.style.transform = "translateY(" + -(depth * STACK_OFFSET) + "px) scale(" + (1 - depth * STACK_SCALE) + ")";
      }
    }
    host.style.setProperty("--front-height", front.offsetHeight + "px");

    // Cap the queue: hide (then drop) anything past MAX_QUEUED so a burst of
    // toasts doesn't pile up invisibly forever.
    var overflow = list.length - MAX_QUEUED;
    for (var j = 0; j < overflow; j++) remove(list[j]);
  }

  // Guards against overlapping document.startViewTransition calls (the
  // browser would otherwise skip the in-flight one's animation) by simply
  // not animating a change that arrives while one is still running — still
  // correct, just an instant update instead of a transition that would've
  // been cut short anyway.
  function withTransition(fn) {
    if (!document.startViewTransition || transitionPending) {
      fn();
      return;
    }
    transitionPending = true;
    var transition = document.startViewTransition(fn);
    transition.finished.catch(function () {}).then(function () {
      transitionPending = false;
    });
  }

  // Guards against double-dismissal (auto-dismiss racing a manual close
  // click) with a plain JS flag rather than a DOM attribute: setting an
  // attribute here would land in the view transition's "old" snapshot if
  // it's also styled in CSS (data-hidden used to be exactly that — see
  // toast.css's `.toast[data-hidden="true"] { opacity: 0 }` — which made
  // the old snapshot already invisible before the exit animation could
  // capture it, so toasts vanished instantly instead of sliding out).
  function remove(el) {
    if (!el || el._dismissing) return;
    el._dismissing = true;
    withTransition(function () {
      el.remove();
      syncStack();
    });
  }

  function closeIconSVG() {
    return (
      '<svg data-slot="close-button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M3.47 3.47a.75.75 0 0 1 1.06 0L8 6.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L9.06 8l3.47 3.47a.75.75 0 1 1-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L6.94 8 3.47 4.53a.75.75 0 0 1 0-1.06Z"></path>' +
      "</svg>"
    );
  }

  function defaultIconSVG(status) {
    var body;
    switch (status) {
      case "success":
        body = '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>';
        break;
      case "warning":
        body =
          '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>';
        break;
      case "danger":
        body = '<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>';
        break;
      default:
        body = '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>';
    }
    return (
      '<svg data-slot="toast-default-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body +
      "</svg>"
    );
  }

  function show(detail) {
    var host = region();
    if (!host || !detail || !detail.title) return;

    var variant = detail.variant && detail.variant !== "default" ? detail.variant : "";

    var el = document.createElement("div");
    el.className = "toast toast--bottom-end" + (variant ? " toast--" + variant : "");
    el.setAttribute("data-slot", "toast");
    el.setAttribute("role", "status");
    // toast.css sets view-transition-class: toast-bottom on this element,
    // but a view-transition-class only takes effect on an element that is
    // ALSO its own named transition group — without a unique
    // view-transition-name here, the browser never captures this toast
    // individually and the ::view-transition-*(.toast-bottom) keyframes in
    // toast.css never run (this was the enter/exit animation bug).
    el.style.viewTransitionName = "toast-" + ++idCounter;

    var indicator = document.createElement("div");
    indicator.className = "toast__indicator";
    indicator.setAttribute("data-slot", "toast-indicator");
    indicator.innerHTML = defaultIconSVG(variant);
    el.appendChild(indicator);

    var content = document.createElement("div");
    content.className = "toast__content";
    content.setAttribute("data-slot", "toast-content");

    var title = document.createElement("p");
    title.className = "toast__title";
    title.setAttribute("data-slot", "toast-title");
    title.textContent = detail.title;
    content.appendChild(title);

    if (detail.description) {
      var desc = document.createElement("p");
      desc.className = "toast__description";
      desc.setAttribute("data-slot", "toast-description");
      desc.textContent = detail.description;
      content.appendChild(desc);
    }
    el.appendChild(content);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "toast__close-button close-button close-button--default";
    close.setAttribute("data-slot", "toast-close-button");
    close.setAttribute("aria-label", "Kapat");
    close.innerHTML = closeIconSVG();
    close.addEventListener("click", function () {
      remove(el);
    });
    el.appendChild(close);

    withTransition(function () {
      host.appendChild(el);
      syncStack();
    });

    setTimeout(function () {
      remove(el);
    }, DURATION);
  }

  document.addEventListener("toast", function (e) {
    show(e.detail);
  });
})();
