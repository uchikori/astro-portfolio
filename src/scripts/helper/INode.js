/**
 * DOM操作ヘルパー
 */
const INode = {
  qs(selector, scope) {
    return (scope || document).querySelector(selector);
  },
  qsAll(selector, scope) {
    const els = (scope || document).querySelectorAll(selector);
    return Array.from(els);
  },
  htmlToEl(htmlStr) {
    const div = document.createElement("div");
    div.innerHTML = htmlStr;
    return div.firstElementChild;
  },
  isElement(target) {
    return target instanceof Element;
  },
  getElement(elementOrSelector) {
    return this.isElement(elementOrSelector)
      ? elementOrSelector
      : this.qs(elementOrSelector);
  },
  getRect(el) {
    el = this.getElement(el);
    return el.getBoundingClientRect();
  },
  getDS(elementOrSelector, key) {
    const el = this.getElement(elementOrSelector);
    return el.dataset?.[key];
  },
  hasDS(el, key) {
    el = this.getElement(el);
    return key in el?.dataset;
  },
};

export { INode };
