import {useEffect, useRef} from 'react';
import {createRelationEcho} from './relationEcho.mjs';

/** One score per selection, never on hover, zoom, resize or return from a tab. */
export function useRelationEcho({rootRef, detailRef, selectedId, selectionNonce, active, desktop, list}) {
  const controller = useRef(null);
  const played = useRef(null);
  if (!controller.current) controller.current = createRelationEcho();

  useEffect(() => {
    const root = rootRef.current;
    const motion = matchMedia('(prefers-reduced-motion:reduce)');
    const stop = () => controller.current.cancel();
    const visibility = () => { if (document.hidden) stop(); };
    const preference = () => { if (motion.matches) stop(); };
    root?.addEventListener('pointerdown', stop, {passive: true});
    root?.addEventListener('wheel', stop, {passive: true});
    root?.addEventListener('keydown', stop);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    return () => {
      stop();
      root?.removeEventListener('pointerdown', stop);
      root?.removeEventListener('wheel', stop);
      root?.removeEventListener('keydown', stop);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
    };
  }, [rootRef]);

  useEffect(() => {
    if (!selectedId) {
      played.current = null;
      controller.current.cancel();
      return;
    }
    if (!active) {
      controller.current.cancel();
      return;
    }
    const token = JSON.stringify([selectedId, selectionNonce ?? null]);
    if (played.current === token) return;
    played.current = token;
    controller.current.play({
      root: rootRef.current,
      sheet: detailRef.current,
      desktop,
      list,
      reduced: matchMedia('(prefers-reduced-motion:reduce)').matches,
      hidden: document.hidden
    });
    return () => controller.current.cancel();
  }, [selectedId, selectionNonce, active, desktop, list, rootRef, detailRef]);
}
