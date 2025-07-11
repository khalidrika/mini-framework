/**
 * @callback EventCallback
 * @param {globalThis.Event} e
 * @param {Element | Window} el
 * @returns {void}
 */

/**
 * @typedef {Object} EventHandler
 * @property {number} id
 * @property {string} event
 * @property {string} selector
 * @property {EventCallback} callback
 * @property {Map<Element, EventListener>} domListeners
 * @property {EventListener|null} windowListener
 */

import { FrameworkError } from "./errors.js"

export class Event {
    constructor() {
        /**
         * @type {EventHandler[]}
         * @private 
         */
        this._handlers = [];

        /**
         * Tracks elements that already have event listeners
         * Uses WeakMap to avoid memory leaks and provide stable references
         * Format: WeakMap<Element, Set<EventType>>
         * @private
         */
        this._processedItems = new WeakMap();

        /**
         * Standard DOM events bound to individual elements
         * @private
         */
        this._domEvents = [
            'click', 'dblclick', 'input', 'keydown', 'scroll',
            'mouseover', 'mouseout', 'change', 'submit',
            'keypress', 'keyup', 'blur', 'focus'
        ];

        /**
         * Global events bound to window/document
         * @private
         */
        this._winOrDocEvents = [
            'resize', 'load', 'unload', 'beforeunload',
            'hashchange', 'popstate', 'DOMContentLoaded'
        ];

        /**
         * Combined list of all supported event types
         * @private
         */
        this._supportedEvents = [...this._domEvents, ...this._winOrDocEvents];

        /**
         * Flag to prevent duplicate initialization
         * @private
         */
        this._initialized = false;

        /**
         * MutationObserver instance for cleanup
         * @private
         */
        this._observer = null;

        /**
         * Initializes the event system:
         * Apply existing handlers to current DOM elements
         * Set up MutationObserver to handle future DOM changes
         * Set _initialized = true to prevent re-running
         * @private
         */
        this._initEventSystem();
    }

    /**
     * Registers a new event handler
     * @param {string} event
     * @param {string} selector
     * @param {EventCallback} callback
     * @returns {number}
     */
    onEvent(event, selector, callback) {
        if (!this._supportedEvents.includes(event)) {
            throw new FrameworkError(
                'EVENT',
                'UNSUPPORTED_EVENT',
                `Event "${event}" is not supported`,
                { supportedEvents: this._supportedEvents }
            );
        }

        if (typeof callback !== 'function') {
            throw new FrameworkError(
                'EVENT',
                'INVALID_CALLBACK',
                'Callback must be a function',
                { received: typeof callback }
            );
        }

        const id = this._handlers.length;
        const handler = {
            id,
            event,
            selector,
            callback,
            domListeners: new Map(), // Must be Map, not WeakMap
            windowListener: null, // Must match the type (null is now allowed)
        };

        this._handlers.push(handler);
        this._applyEventHandler(handler);

        return id;
    }

    /**
     * Removes an event handler by ID with proper DOM cleanup
     * @param {number} handlerId - The ID returned by onEvent()
     * @returns {boolean} True if handler was found and removed
     */
    removeEvent(handlerId) {
        const index = this._handlers.findIndex(h => h.id === handlerId);
        if (index === -1) return false;

        const handler = this._handlers[index];

        // Proper cleanup of DOM listeners
        this._cleanupHandler(handler);

        this._handlers.splice(index, 1);
        return true;
    }

    /**
     * Clean up all event handlers and observers
     * Call this when destroying an event system instance
     * Mainly for complex apps that dynamically create/remove event systems
     */
    destroy() {
        // Remove all handlers
        this._handlers.forEach(handler => this._cleanupHandler(handler));
        this._handlers = [];

        // Disconnect mutation observer
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        this._processedItems = new WeakMap();
        this._initialized = false;

        console.log('Event system destroyed');
    }

    /**
     * Clean up all DOM listeners for a specific handler
     * @private
     * @param {EventHandler} handler
     */
    _cleanupHandler(handler) {
        // Window listener cleanup
        if (handler.windowListener && typeof handler.windowListener === 'function') {
            try {
                window.removeEventListener(
                    handler.event,
                    handler.windowListener
                );
            } catch (e) {
                console.warn(`Failed to remove window listener for ${handler.event}`, e);
            }
        }

        // DOM listeners cleanup
        handler.domListeners.forEach((listener, element) => {
            if (typeof listener === 'function') {
                try {
                    element.removeEventListener(handler.event, listener);
                } catch (e) {
                    console.warn(`Failed to remove DOM listener for ${handler.event}`, e);
                }
            }
        });
        handler.domListeners.clear();
    }

    /**
     * Applies an event handler to matching elements with proper listener storage
     * @private
     * @param {EventHandler} handler
     */
    _applyEventHandler(handler) {
        const { event, selector, callback } = handler;

        // Handle window/document events
        if (this._winOrDocEvents.includes(event) && (selector === 'window' || selector === 'document')) {
            /** @type {EventListener} */
            const winListener = (e /** @type {globalThis.Event} */) => callback(e, window);
            handler.windowListener = winListener;
            window.addEventListener(event, winListener);
            return;
        }

        try {
            const elements = document.querySelectorAll(selector);

            elements.forEach(el => {
                // Use WeakMap for stable element tracking
                if (!this._processedItems.has(el)) {
                    this._processedItems.set(el, new Set());
                }

                const elementEvents = this._processedItems.get(el);

                // Check if this specific handler already has a listener on this element
                if (handler.domListeners.has(el)) return;

                // Only add if this event type hasn't been processed for this element by ANY handler
                if (!elementEvents.has(event)) {
                    elementEvents.add(event);

                    /** @type {EventListener} */
                    const domListener = (e) => {
                        // Execute ALL handlers that match this event and element
                        this._handlers.forEach(h => {
                            // Only execute if handler still exists and matches
                            if (h.event === event && el.matches(h.selector)) {
                                h.callback(e, el);
                            }
                        });
                    };

                    // Store the listener for cleanup
                    handler.domListeners.set(el, domListener);

                    // Cast to EventListener to avoid overload errors
                    el.addEventListener(event, /** @type {EventListener} */(domListener));
                }
            });
        } catch (error) {
            console.error(`Error applying event handler: ${error}`);
        }
    }

    /**
     * Processes existing elements and sets up an
     * observer for new elements added to the DOM
     * @private
     */
    _initEventSystem() {
        if (this._initialized) {
            console.warn('[Framework] Event system already initialized');
            return;
        }

        // Apply existing handlers
        this._handlers.forEach(handler => this._applyEventHandler(handler));

        // Set up mutation observer
        this._observer = new MutationObserver((mutations) => {
            let shouldReapply = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldReapply = true;
                }
            });

            if (shouldReapply) {
                this._handlers.forEach(handler => {
                    if (!this._winOrDocEvents.includes(handler.event) &&
                        handler.selector !== 'window' &&
                        handler.selector !== 'document') {
                        this._applyEventHandler(handler);
                    }
                });
            }
        });

        if (document.body) {
            this._observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                // window.onload = () => { // Inline fallback (less ideal)
                if (this._observer && document.body) {
                    this._observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            });
        }

        this._initialized = true;
        console.log('Event system initialized');
    }
}
