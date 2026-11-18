/** One owner for document snapshots. Callbacks must commit synchronously. */
export function createTransitionCoordinator(getDocument = () => document) {
  let generation = 0;
  let current = null;

  function clearMetadata(entry) {
    if (entry.id !== generation) return;
    const dataset = entry.document?.documentElement?.dataset;
    if (dataset) {
      delete dataset.transitionKind;
      delete dataset.navDirection;
    }
  }

  function cancelEntry(entry) {
    if (!entry || entry.id !== generation) return;
    clearMetadata(entry);
    generation += 1;
    current = null;
    entry.cancelled = true;
    entry.resolveCommitted(false);
    entry.resolveFinished(false);
    try { entry.native?.skipTransition(); } catch { /* A completed snapshot needs no cleanup. */ }
    try { entry.onCancel?.(); } catch { /* Cancellation must never strand the next owner. */ }
  }

  function cancelPendingTransition() {
    if (current) cancelEntry(current);
    else generation += 1; // Also invalidate a focus RAF queued after completion.
  }

  function runTransition({kind, direction, animate = true, update, onCancel} = {}) {
    cancelPendingTransition();
    const doc = getDocument();
    const entry = {id: ++generation, document: doc, native: null, onCancel, cancelled: false, didCommit: false};
    const committed = new Promise(resolve => { entry.resolveCommitted = resolve; });
    const finished = new Promise(resolve => { entry.resolveFinished = resolve; });
    const isCurrent = () => !entry.cancelled && entry.id === generation;
    const handle = {committed, finished, isCurrent, cancel: () => cancelEntry(entry)};
    current = entry;

    const dataset = doc?.documentElement?.dataset;
    if (dataset) {
      if (kind) dataset.transitionKind = kind;
      else delete dataset.transitionKind;
      if (direction) dataset.navDirection = direction;
      else delete dataset.navDirection;
    }

    const commit = () => {
      if (!isCurrent()) { entry.resolveCommitted(false); return; }
      try {
        const result = update?.();
        entry.didCommit = result !== false;
        entry.resolveCommitted(entry.didCommit && isCurrent());
      } catch {
        entry.resolveCommitted(false);
        // The caller receives a safe result. Native promises remain handled below.
        entry.didCommit = false;
      }
    };
    const finish = () => {
      const succeeded = entry.didCommit && isCurrent();
      if (isCurrent()) {
        clearMetadata(entry);
        if (current === entry) current = null;
      }
      entry.resolveCommitted(succeeded);
      entry.resolveFinished(succeeded);
    };

    if (animate && typeof doc?.startViewTransition === 'function') {
      try {
        entry.native = doc.startViewTransition(commit);
        // All promises are independently observable and can reject on a skip.
        Promise.resolve(entry.native.ready).catch(() => {});
        Promise.resolve(entry.native.updateCallbackDone).catch(() => { entry.resolveCommitted(false); });
        Promise.resolve(entry.native.finished).then(finish, finish);
      } catch {
        if (!entry.didCommit) commit();
        finish();
      }
    } else {
      commit();
      finish();
    }
    return handle;
  }

  return {runTransition, cancelPendingTransition};
}

const coordinator = createTransitionCoordinator();
export const runTransition = options => coordinator.runTransition(options);
export const cancelPendingTransition = () => coordinator.cancelPendingTransition();
