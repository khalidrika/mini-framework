// framework/core.js

export const h = (tag, attrs = {}, children = []) => {
  return {
    tag,
    attrs,
    children: Array.isArray(children) ? children : [children],
  };
};

export const createDOM = (vnode) => {
  if (typeof vnode === 'string') return document.createTextNode(vnode);

  const el = document.createElement(vnode.tag);

  for (const [key, value] of Object.entries(vnode.attrs)) {
    el.setAttribute(key, value);
  }

  vnode.children.forEach(child => {
    el.appendChild(createDOM(child));
  });

  return el;
};

let currentVNode = null;
let rootElement = null;

export const render = (vnode, container) => {
  if (!currentVNode) {
    const dom = createDOM(vnode);
    container.innerHTML = '';
    container.appendChild(dom);
    rootElement = container;
  } else {
    // We'll add diffing/patching later
  }
  currentVNode = vnode;
};
