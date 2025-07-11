export class State {
  /**
   * Initialize the State with optional initial state.
   * @param {Object} [initialState={}] - Initial state object (will be merged with persisted state)
  */
  constructor(initialState = {}) {
    /**
     * @private Internal state (prefix _ denotes private convention)
    */
    this._state = initialState;

    /**
     * @private Set of listener functions to notify on state changes
     */
    this._listeners = new Set();

    /**
     * @private Automatically load any persisted state from localStorage
     */
    this._hydrate();
  }

  /**
   * Hydrates state from localStorage.
   * Merges any saved state with initial state.
   */
  _hydrate() {
    console.log("Hydrating state from localStorage...");

    const saved = localStorage.getItem('state');
    if (saved) {
      // Parse and merge with initial state (saved state takes precedence)
      this._state = { ...this._state, ...JSON.parse(saved) };
    }
  }

  /**
   * Updates state and persists changes.
   * @param {Object} newState - Partial state update (shallow merge)
   * @example
   * state.setState({ user: { name: 'Alice' } });
   */
  setState(newState) {
    // Shallow merge new state (doesn't handle nested objects)
    this._state = { ...this._state, ...newState };
    console.log("Setting new state:", this._state);

    // Persist entire state to localStorage
    localStorage.setItem('state', JSON.stringify(this._state));

    // Notify all subscribed listeners
    this._listeners.forEach(listener => listener(this._state));
  }

  /**
   * Returns current state (immutable copy).
   * @returns {Object} Deep copy of current state
   * @example
   * const current = state.getState();
   */
  getState() {
    // Return copy to prevent external mutations
    console.log("Getting current state:", this._state);
    return { ...this._state };
  }

  /**
   * Subscribes to state changes.
   * @param {Function} listener - Callback that receives new state
   * @returns {Function} Unsubscribe function
   * @example
   * const unsubscribe = state.subscribe((state) => {
   *   console.log('State changed:', state);
   * });
   * 
   * // Later...
   * unsubscribe();
   */
  subscribe(listener) {
    this._listeners.add(listener);
    console.log("Subscribing", this._listeners.size);

    // Return cleanup function that removes this listener
    return () => this._listeners.delete(listener);
  }
}
