/**
 * @typedef {Object} VNode
 * @property {string} tag - HTML tag name
 * @property {Object.<string, string>} [attrs] - HTML attributes
 * @property {Array<VNode|string|number>} [children] - Child nodes (can be VNodes, strings, or numbers)
 * @property {string|number|null} [key] - Optional key for reconciliation, check patchChildren()
 */

export class Dom {
    /**
     * Creates a text node with proper type conversion.
     * 
     * @param {string|number} text - The text content
     * @returns {Text} The created text node
     * 
     * @example
     * const greeting = Dom.createTextNode('Hello'); // Text node
     * const answer = Dom.createTextNode(01); // Converts numbers
     */
    static createTextNode(text) {
        return document.createTextNode(String(text));
    }

    /**
     * Creates a DOM element with specified tag, properties, and children.
     * 
     * @param {string} tag - The HTML tag name (e.g., 'div', 'span')
     * @param {{ [key: string]: any }} [props={}] - Element properties/attributes
     * @param {...(Node|string)} children - Child elements or text content
     * @returns {HTMLElement} The created DOM element
     * 
     * @example
     * const button = Dom.createElement('button', { class: 'btn' }, 'Click me');
     */
    static createElement(tag, props = {}, ...children) {
        const element = document.createElement(tag);
        Object.keys(props).forEach(key => {
            Dom.setAttribute(element, key, props[key]);
        });
        children.forEach(child => {
            Dom.appendChild(element, child);
        });
        return element;
    }

    /**
     * Sets an attribute, property, or event listener on a DOM element.
     * Handles different value types including:
     * - Event handlers (onClick, onInput)
     * - Class names (className)
     * - Style objects
     * - Native element properties
     * - Fallback to HTML attributes
     * 
     * @param {HTMLElement} element - The target DOM element
     * @param {string} key - Attribute/property name (e.g., 'id', 'onClick', 'style')
     * @param {*} value - The value to set (type depends on key)
     * @throws {Error} If element is not a valid DOM node
     * 
     * @example
     * // Set an attribute
     * Dom.setAttribute(div, 'title', 'Tooltip');
     * 
     * // Add an event listener
     * Dom.setAttribute(button, 'onClick', () => console.log('Clicked'));
     * 
     * // Apply styles
     * Dom.setAttribute(div, 'style', { color: 'red', fontSize: '16px' });
     */
    static setAttribute(element, key, value) {
        const name = element && typeof element === 'object' ? element.constructor?.name : typeof element;

        if (!(element instanceof HTMLElement)) {
            throw new Error(`Expected valid HTMLElement for setAttribute(), got ${name}`);
        }

        if (key.startsWith('on') && typeof value === "function") {
        /** @type {any} */ (element)[key.toLowerCase()] = value;
            return;
        }

        switch (key) {
            case 'className':
                element.className = value;
                break;
            case 'style':
                if (typeof value === 'object') {
                    Object.assign(element.style, value);
                }
                break;
            default:
                if (key in element) {
                /** @type {any} */ (element)[key] = value;
                } else {
                    element.setAttribute(key, value);
                }
        }
    }

    /**
     * Appends one or more children to a parent DOM element.
     * Handles multiple child types:
     * - DOM Nodes (appends directly)
     * - Strings/Numbers (converts to text nodes)
     * - Arrays (flattens and appends recursively)
     * - Null/undefined values (silently skips)
     * 
     * @param {Node} parent - The target parent element
     * @param {(Node|string|number|(Node|string|number|null)[]|null)} child - Child to append
     * @throws {Error} If parent is not a valid DOM node
     * 
     * @example
     * // Append single element
     * Dom.appendChild(container, Dom.createElement('div'));
     * 
     * // Append text
     * Dom.appendChild(container, 'Hello World');
     * 
     * // Append multiple items
     * Dom.appendChild(container, [
     *   'Text node',
     *   Dom.createElement('span', {}, 'More text'),
     *   01 // Number becomes text node
     * ]);
     */
    static appendChild(parent, child) {
        const typeName = parent?.constructor?.name;
        if (!(parent instanceof Node)) {
            throw new Error(`Invalid parent element: Expected DOM Node, got ${typeName}`);
        }

        if (child == null) return;

        if (Array.isArray(child)) {
            child.forEach(c => Dom.appendChild(parent, c));
            return;
        }

        if (typeof child === 'string' || typeof child === 'number') {
            parent.appendChild(Dom.createTextNode(String(child)));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (typeof child === 'object' && 'tag' in child) {
            Dom.appendChild(parent, Dom.createFromVNode(child));
        } else {
            console.warn('Unsupported child type ignored:', child);
        }
    }

    /**
     * Converts a Virtual DOM (VDOM) node into a real DOM element.
     * Recursively processes child nodes and handles primitive values.
     * 
     * @param {VNode|string|number} vnode - The virtual node to convert.
     * @returns {Node} The created DOM element or text node.
     * @throws {Error} If vnode is invalid or missing 'tag' property.
     * 
     * @example
     * // VDOM input
     * const vnode = {
     *   tag: 'div',
     *   attrs: { class: 'container' },
     *   children: [
     *     { tag: 'p', children: ['Hello'] },
     *     'World' // Auto-converted to text node
     *   ]
     * };
     * 
     * // Usage
     * const domElement = Dom.createFromVNode(vnode);
     * Dom.appendChild(document.body, domElement);
     */
    static createFromVNode(vnode) {
        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return Dom.createTextNode(String(vnode));
        }

        // Text node handling
        if (vnode.tag === 'TEXT_NODE') {
            // Handle case where children is undefined or empty
            const textContent = Array.isArray(vnode.children) && vnode.children.length > 0
                ? vnode.children[0]
                : '';
            // Ensure we only pass string|number by converting any VNode to empty string
            const safeText = typeof textContent === 'string' || typeof textContent === 'number'
                ? textContent
                : '';
            return this.createTextNode(safeText);
        }

        if (typeof vnode !== 'object' || vnode === null || !('tag' in vnode)) {
            throw new Error('Invalid VNode: missing "tag" property');
        }

        const element = Dom.createElement(vnode.tag, vnode.attrs || {});

        if (Array.isArray(vnode.children)) {
            vnode.children.forEach(
                /** @param {VNode | string | number | null} child */
                (child) => {
                    if (child == null) return;
                    if (typeof child === 'string' || typeof child === 'number') {
                        Dom.appendChild(element, Dom.createTextNode(child));
                    } else {
                        Dom.appendChild(element, Dom.createFromVNode(child));
                    }
                });
        }

        return element;
    }

    /**
     * Clears and renders a DOM element into a container.
     * Safely replaces all existing content in the container.
     *
     * @param {Element} element - The DOM element to render (must be a valid Element)
     * @param {Element} container - The target container (must be a valid Element)
     * @returns {Element} The rendered element for chaining
     * @throws {Error} If container or element is invalid
     * 
     * @example
     * // Basic usage
     * const app = document.getElementById('app');
     * const root = Dom.createElement('div', { id: 'root' });
     * Dom.render(root, app);
     * 
     * @example
     * // Chaining
     * Dom.render(
     *   Dom.createElement('h1', {}, 'Hello'),
     *   document.body
     * ).classList.add('fade-in');
     */
    static render(
        /** @type {Element} */ element,
        /** @type {Element} */ container
    ) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Container must be a DOM Element');
        }
        if (!(element instanceof HTMLElement)) {
            throw new Error(`Invalid element: Expected DOM Element, got ${Object.prototype.toString.call(element)}`);
        }

        container.innerHTML = '';
        container.appendChild(element);
        return element;
    }

    /**
     * Chainable version of render() that returns an interface with DOM methods.
     * Allows fluent-style operations after rendering, in a consistent behavior.
     * 
     * @param {HTMLElement} element - DOM element to render
     * @param {HTMLElement} container - Target container element
     * @returns {{
     *   element: HTMLElement,
     *   set: (key: string, value: any) => any,
     *   addChildren: (children: any[] | Node) => any,
     *   on: (event: string, handler: EventListener) => any
     * }}
     * 
     * @example
     * // Fluent chaining
     * Dom.renderChainable(Dom.createElement('div'), appContainer)
     *   .set('id', 'main-card')
     *   .addChildren([
     *     Dom.createElement('h3', {}, 'Title'),
     *     'Description text'
     *   ])
     *   .on('click', handleInteraction);
     * 
     * @example
     * // Single operation
     * const { element } = Dom.renderChainable(modal, document.body);
     * element.focus(); // Access raw DOM node when needed
     */
    static renderChainable(element, container) {
        /** @type {HTMLElement} */
        const renderedElement = /** @type {HTMLElement} */ (this.render(element, container));

        const chainable = {
            element: renderedElement,
            set: (/** @type {string} */ key, /** @type {any} */ value) => {
                this.setAttribute(renderedElement, key, value);
                return chainable;
            },
            addChildren: (/** @type {any[] | Node} */ children) => {
                this.appendChild(renderedElement, children);
                return chainable;
            },
            on: (/** @type {string} */ event, /** @type {EventListener} */ handler) => {
                this.setAttribute(renderedElement, `on${event}`, handler);
                return chainable;
            }
        };
        return chainable;
    }

    /**
     * Creates a Virtual DOM node (VNode) with specified tag, attributes, and children.
     * 
     * @param {string} tag - The HTML tag name (e.g., 'div', 'span')
     * @param {Record<string, any>} [attrs={}] - Element attributes/properties (e.g., { id: 'app', onClick: handler })
     * @param {(Array<any>|Node|string)} [children=[]] - Child elements or text content
     * @returns {{
     *   tag: string,
     *   attrs: Record<string, any>,
     *   children: Array<any>,
     *   key: string|null
     * }}
     * 
     * @example
     * // Simple element
     * const vnode = Dom.h('div', { id: 'container' }, 'Hello');
     * 
     * @example
     * // With children
     * Dom.h('ul', {}, [
     *   Dom.h('li', {}, 'Item 1'),
     *   Dom.h('li', {}, 'Item 2')
     * ]);
     */
    static h(tag, attrs = {}, children = []) {
        return {
            tag,
            attrs,
            children: Array.isArray(children) ? children : [children],
            key: attrs.key || null
        };
    }

    /**
     * Efficiently patches the DOM by comparing old and new Virtual DOM nodes.
     * Performs minimal updates to match the new structure.
     * 
     * @param {Node} parent - The parent DOM element
     * @param {VNode|null} newVNode - The new VNode to render
     * @param {VNode|null} oldVNode - The previous VNode for comparison
     * @param {number} [index=0] - Child position index
     * 
     * @example
     * // Basic usage
     * Dom.patch(container, newVTree, oldVTree);
     */
    static patch(parent, newVNode, oldVNode, index = 0) {
        // Handle null/undefined cases
        if (!oldVNode && !newVNode) return;

        // Case 1: New node added
        if (!oldVNode) {
            const newNode = this.createFromVNode(/** @type {VNode} */(newVNode));
            if (parent.childNodes[index]) {
                parent.insertBefore(newNode, parent.childNodes[index]);
            } else {
                parent.appendChild(newNode);
            }
            return;
        }

        // Case 2: Node removed
        if (!newVNode && oldVNode) {
            const nodeToRemove = parent.childNodes[index];
            if (nodeToRemove) {
                parent.removeChild(nodeToRemove);
            }
            return;
        }

        // Case 3: Nodes are different
        if (newVNode && oldVNode && this.hasChanged(newVNode, oldVNode)) {
            const nodeToReplace = parent.childNodes[index];
            if (nodeToReplace) {
                parent.replaceChild(this.createFromVNode(newVNode), nodeToReplace);
            }
            return;
        }

        // Case 4: Same node type
        if (newVNode && oldVNode && newVNode.tag) {
            const element = parent.childNodes[index];
            if (element instanceof HTMLElement) {
                this.updateAttributes(element, newVNode.attrs || {}, oldVNode.attrs || {});

                // Filter to only valid children (VNodes, strings, numbers)
                const newChildren = (newVNode.children || []).filter(c =>
                    typeof c === 'object' || typeof c === 'string' || typeof c === 'number'
                );
                const oldChildren = (oldVNode.children || []).filter(c =>
                    typeof c === 'object' || typeof c === 'string' || typeof c === 'number'
                );

                this.patchChildren(element, newChildren, oldChildren);
            }
        }
    }

    /**
     * Determines if two VNodes are different and require DOM updates.
     * Compares types, tags, and keys for efficient change detection.
     * 
     * @param {VNode|string|number|null} node1 - First VNode to compare
     * @param {VNode|string|number|null} node2 - Second VNode to compare
     * @returns {boolean} True if nodes are significantly different
     * 
     * @example
     * const needsUpdate = Dom.hasChanged(newNode, oldNode);
     */
    static hasChanged(node1, node2) {
        // Different types
        if (typeof node1 !== typeof node2) return true;

        // Primitive values
        if (typeof node1 === 'string' || typeof node1 === 'number') {
            return String(node1) !== String(node2);
        }

        // Handle TEXT_NODE cases
        if ((node1 && typeof node1 === 'object' && node1.tag === 'TEXT_NODE') ||
            (node2 && typeof node2 === 'object' && node2.tag === 'TEXT_NODE')) {
            const text1 = (node1 && typeof node1 === 'object' && node1.tag === 'TEXT_NODE')
                ? node1.children?.[0] ?? ''
                : '';
            const text2 = (node2 && typeof node2 === 'object' && node2.tag === 'TEXT_NODE')
                ? node2.children?.[0] ?? ''
                : '';
            return String(text1) !== String(text2);
        }

        // Null checks (important!)
        if (node1 == null || node2 == null) return true;

        // At this point, node1 and node2 are assumed to be VNodes
        /** @type {VNode} */
        const vnode1 = /** @type {VNode} */ (node1);
        /** @type {VNode} */
        const vnode2 = /** @type {VNode} */ (node2);

        // Different tags
        if (vnode1.tag !== vnode2.tag) return true;

        // Different keys
        if (vnode1.attrs?.key !== undefined && vnode2.attrs?.key !== undefined) {
            return vnode1.attrs.key !== vnode2.attrs.key;
        }

        return false;
    }

    /**
     * Updates DOM element attributes by comparing old and new attribute sets.
     * Only modifies attributes that actually changed.
     * 
     * @param {HTMLElement} element - The target DOM element
     * @param {Object<string, any>} newAttrs - New attributes to apply
     * @param {Object<string, any>} oldAttrs - Previous attributes for comparison
     * 
     * @example
     * Dom.updateAttributes(el, { class: 'active' }, { class: '' });
     */
    static updateAttributes(element, newAttrs, oldAttrs) {
        // Remove old attributes that are no longer present
        Object.keys(oldAttrs).forEach(key => {
            if (!(key in newAttrs)) {
                if (key === 'className') {
                    element.className = '';
                }
                else if (key === 'checked' || key === 'disabled' || key === 'selected') {
                    // Cast element as any to bypass type errors for dynamic property access
                    /** @type {any} */
                    const elAny = element;
                    elAny[key] = false;
                }
                else if (key.startsWith('on')) {
                    /** @type {any} */
                    const elAny = element;
                    elAny[key.toLowerCase()] = null;
                }
                else {
                    element.removeAttribute(key);
                }
            }
        });

        // Set new/changed attributes
        Object.entries(newAttrs).forEach(([key, value]) => {
            if (oldAttrs[key] !== value) {
                this.setAttribute(element, key, value);
            }
        });
    }

    /**
     * Recursively updates child nodes by comparing old and new VNode children.
     * Handles additions, removals, and updates with minimal DOM operations.
     * 
     * @param {HTMLElement} parent - The parent DOM element
     * @param {Array<VNode|string|number>} newChildren - Array of new child VNodes
     * @param {Array<VNode|string|number>} oldChildren - Array of previous child VNodes
     * @throws Will fallback to full re-render if errors occur
     * 
     * @example
     * Dom.patchChildren(ulElement, newItems, oldItems);
     */
    static patchChildren(parent, newChildren, oldChildren) {
        try {
            console.group('Diffing children');
            console.log('Old children:', oldChildren);
            console.log('New children:', newChildren);

            /**
             * Normalize children to handle text nodes consistently
             * @param {VNode|string|number|null|undefined} child
             * @returns {VNode} - Never returns null (converts null to empty text node)
             */
            const normalizeChild = (child) => {
                if (child == null) {
                    return {
                        tag: 'TEXT_NODE',
                        children: [''],
                        key: null
                    };
                }
                if (typeof child === 'string' || typeof child === 'number') {
                    return {
                        tag: 'TEXT_NODE',
                        children: [String(child)],
                        key: null
                    };
                }
                return child;
            };

            const normalizedNew = newChildren.map(normalizeChild).filter(Boolean);
            const normalizedOld = oldChildren.map(normalizeChild).filter(Boolean);

            // Fast path for empty cases
            if (normalizedNew.length === 0) {
                parent.innerHTML = '';
                console.groupEnd();
                return;
            }

            // Remove excess old children
            while (parent.childNodes.length > normalizedNew.length) {
                const lastChild = parent.lastChild;
                if (lastChild) parent.removeChild(lastChild);
            }

            // Diff each child
            for (let i = 0; i < normalizedNew.length; i++) {
                const newChild = normalizedNew[i];
                const oldChild = normalizedOld[i];
                const domNode = parent.childNodes[i];

                // Case 1: New node needs to be added
                if (!domNode) {
                    parent.appendChild(this.createFromVNode(newChild));
                    continue;
                }

                // Case 2: Nodes are different (including text changes)
                if (!oldChild || this.hasChanged(newChild, oldChild)) {
                    parent.replaceChild(
                        this.createFromVNode(newChild),
                        domNode
                    );
                    continue;
                }

                // Case 3: Same node type - update attributes and children
                if (newChild.tag === 'TEXT_NODE') {
                    // Text nodes are already handled by hasChanged
                    continue;
                }

                // Handle element nodes with children
                if (domNode instanceof HTMLElement) {
                    this.updateAttributes(
                        domNode,
                        newChild.attrs || {},
                        oldChild.attrs || {}
                    );

                    // Recursively diff children (including text nodes)
                    const newChildNodes = (newChild.children || []).map(normalizeChild).filter(Boolean);
                    const oldChildNodes = (oldChild.children || []).map(normalizeChild).filter(Boolean);
                    this.patchChildren(domNode, newChildNodes, oldChildNodes);
                }
            }

            console.groupEnd();
        } catch (error) {
            console.error('Diffing error:', error);
            // Fallback to full re-render
            parent.innerHTML = '';
            newChildren.forEach(child => {
                if (child != null) {
                    parent.appendChild(this.createFromVNode(child));
                }
            });
        }
    }

    /**
     * Efficiently renders a VNode tree with smart diffing against previous version.
     * Automatically handles initial render and subsequent updates.
     * 
     * @param {HTMLElement} container - The target DOM container
     * @param {VNode} newVTree - The complete new VNode tree
     * @param {VNode|null} [oldVTree=null] - Previous VNode tree for diffing
     * 
     * @example
     * // Initial render
     * Dom.renderWithDiff(app, vtree);
     * 
     * @example
     * // Subsequent update
     * Dom.renderWithDiff(app, newVtree, oldVtree);
     */
    static renderWithDiff(container, newVTree, oldVTree = null) {
        if (!oldVTree) {
            // Initial render
            if (container instanceof HTMLElement) {
                container.innerHTML = '';
            }
            if (newVTree) {
                container.appendChild(this.createFromVNode(newVTree));
            }
        } else {
            // Efficient update using diffing
            this.patch(container, newVTree, oldVTree, 0);
        }
    }
}
