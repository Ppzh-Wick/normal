/**
 * A bounded, decorative selection score. No RAF, timers or retained fill layers.
 * Historical content, focus and native dialog state never depend on this score.
 */
export function createRelationEcho() {
  let generation = 0;
  let running = [];
  let currentRoot = null;

  function cancel() {
    generation += 1;
    const old = running;
    running = [];
    currentRoot?.removeAttribute('data-relation-echo');
    currentRoot = null;
    for (const animation of old) {
      try { animation.cancel(); } catch { /* A detached target is already still. */ }
    }
  }

  function play({root, sheet, desktop = true, list = false, reduced = false, hidden = false} = {}) {
    cancel();
    if (!root || reduced || hidden) return 0;
    const owner = generation;
    const score = [];
    if (desktop && !list) {
      score.push([
        root.querySelector('[data-echo-part="line"]'),
        [
          {strokeDashoffset: '1', opacity: 0},
          {offset: .12, opacity: 1},
          {offset: .76, strokeDashoffset: '0', opacity: 1},
          {strokeDashoffset: '0', opacity: 0}
        ],
        {duration: 620, easing: 'cubic-bezier(.22,.72,.2,1)'}
      ]);
      score.push([
        root.querySelector('[data-echo-part="halo"]'),
        [
          {transform: 'scale(.92)', opacity: 0},
          {offset: .24, opacity: .72},
          {transform: 'scale(1.28)', opacity: 0}
        ],
        {duration: 680, delay: 40, easing: 'cubic-bezier(.16,.7,.2,1)'}
      ]);
      score.push([
        root.querySelector('[data-echo-part="thread"]'),
        [{strokeDashoffset: '1', opacity: .15}, {strokeDashoffset: '0', opacity: 1}],
        {duration: 360, delay: 220, easing: 'cubic-bezier(.22,.72,.2,1)'}
      ]);
    }
    score.push([
      sheet?.querySelector('[data-echo-part="sheet"]'),
      desktop ? [
        {transform: 'perspective(1200px) translateX(12px) rotateY(-6deg)', opacity: .68},
        {transform: 'perspective(1200px) translateX(0) rotateY(0)', opacity: 1}
      ] : [{opacity: .82}, {opacity: 1}],
      {duration: desktop ? 460 : 140, delay: desktop ? 100 : 0, easing: 'cubic-bezier(.16,.74,.2,1)'}
    ]);
    currentRoot = root;
    for (const [target, frames, timing] of score) {
      if (typeof target?.animate !== 'function') continue;
      let animation;
      try { animation = target.animate(frames, {...timing, iterations: 1, fill: 'backwards'}); }
      catch { continue; } // Unsupported animation must leave all reading usable.
      running.push(animation);
      const settle = () => {
        if (owner !== generation) return;
        running = running.filter(item => item !== animation);
        try { animation.cancel(); } catch { /* Release any finished effect. */ }
        if (!running.length) {
          currentRoot?.removeAttribute('data-relation-echo');
          currentRoot = null;
        }
      };
      Promise.resolve(animation.finished).then(settle, settle);
    }
    if (running.length) root.setAttribute('data-relation-echo', 'running');
    else currentRoot = null;
    return running.length;
  }

  return {play, cancel};
}
