import { useNavigate } from "react-router-dom";

function setNativeValue(el, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
  const prototype = Object.getPrototypeOf(el);
  const protoValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (valueSetter) {
    valueSetter.call(el, value);
  } else if (protoValueSetter) {
    protoValueSetter.call(el, value);
  } else {
    el.value = value;
  }
}

export function executeAction(action, navigate) {
  if (!action || !action.type) return;

  function findElementByIdInsensitive(id) {
    if (!id) return null;
    // try exact first
    let el = document.getElementById(id);
    if (el) return el;
    const lower = id.toLowerCase();
    const all = document.querySelectorAll('[id]');
    for (const node of all) {
      if (node.id && node.id.toLowerCase() === lower) return node;
    }
    // try replacing common separators
    const alt = lower.replace(/[-_\s]+/g, '');
    for (const node of all) {
      if (node.id && node.id.toLowerCase().replace(/[-_\s]+/g, '') === alt) return node;
    }
    return null;
  }

  function findElementByTarget(target) {
    if (!target) return null;
    // try id and insensitive id first
    let el = document.getElementById(target);
    if (el) return el;
    el = findElementByIdInsensitive(target);
    if (el) return el;

    // try exact name attribute
    el = document.querySelector(`[name="${target}"]`);
    if (el) return el;

    // try to match by attributes and visible text (placeholder, aria-label, id, name, textContent)
    const lowTarget = target.toLowerCase();
    const candidates = Array.from(document.querySelectorAll('input,textarea,select,button,a,[role="button"]'));
    for (const node of candidates) {
      const attrs = [node.id, node.name, node.placeholder, node.getAttribute('aria-label'), node.textContent].filter(Boolean).join(' ').toLowerCase();
      if (attrs.includes(lowTarget)) return node;
    }

    // try labels matching text and resolving via for="id"
    const labels = Array.from(document.getElementsByTagName('label'));
    for (const lab of labels) {
      if (lab.textContent && lab.textContent.toLowerCase().includes(lowTarget)) {
        const fid = lab.getAttribute('for');
        if (fid) {
          const node = document.getElementById(fid);
          if (node) return node;
        }
      }
    }

    return null;
  }

  switch (action.type) {
    case "navigate":
      navigate(action.target);
      break;

    case "click": {
      let el = findElementByTarget(action.target);
      if (el) {
        el.focus();
        el.click();
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
      break;
    }

    case "focus": {
      const el = document.getElementById(action.target);
      if (el) el.focus();
      break;
    }

    case "input": {
      let el = findElementByTarget(action.target);
      if (!el) return;

      el.focus();
      setNativeValue(el, action.value || "");
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      break;
    }

    case "scroll":
      window.scrollBy({
        top: action.value === "down" ? 300 : -300,
        behavior: "smooth"
      });
      break;

    case "zoom":
      document.body.style.zoom = action.value === "in" ? "110%" : "90%";
      break;

    case "refresh":
      window.location.reload();
      break;

    default:
      console.warn("Unknown action:", action);
  }
}
