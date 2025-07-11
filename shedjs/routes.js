export class Route {
    constructor() {
        /**
         * Registry of route paths and their associated action handlers.
         * @type {Object.<string, Function>}
         * @example { '/about': showAboutPage }
         * @private
         */
        this._routes = {};
    }

    /**
    * Registers a route path with its corresponding action handler.
    * @param {string} path - Route path (should start with '/')
    * @param {Function} action - Callback to execute when route is activated
    */
    addRoute(path, action) {
        this._routes[path] = action; // Register the route and its handler
    }

    /**
     * Programmatically navigates to a specified route.
     * Updates URL hash and triggers route rendering.
     * @param {string} path - Target route path
     */
    navigate(path) {
        window.location.hash = path; // Change the URL hash
        this._renderRoute(path); // Load the corresponding route
    }

    /**
     * Initializes the router and sets up hash change listeners.
     * - Renders current route on startup (defaults to '/' if no hash is present)
     * - Listens for back/forward navigation via hash changes
     */
    init(path = '/') {
        // Use window.location.hash to determine the initial path, default to '/'
        path = window.location.hash.slice(1) || path;
        console.log(path);

        this._renderRoute(path);
        // Listen for changes in the hash (back/forward navigation)
        window.addEventListener("hashchange", () => {
            // window.onhashchange = () => { // Inline assignment
            this._renderRoute(window.location.hash.slice(1));
        });
    }

    /**
     * Executes the handler for a given route path.
     * @param {string} path - Route path to render
     * @throws {Error} When attempting to render an unregistered route
     * @private
     */
    _renderRoute(path) {
        const route = this._routes[path];
        if (route) {
            route(); // Execute the associated action for the route
        } else {
            console.error(`Route not found: ${path}`);
        }
    }
}
