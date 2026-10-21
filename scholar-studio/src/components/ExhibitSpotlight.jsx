/*! Adapted from React Bits SpotlightCard — Copyright (c) 2026 David Haz.
 * MIT + Commons Clause; see public/licenses/React-Bits-Backgrounds-LICENSE.md.
 * Source: https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/SpotlightCard/SpotlightCard.jsx
 * Uses its local pointer coordinates and focus illumination, with a fixed
 * copper light texture, event-driven frames, and no ambient animation.
 */
import React, { useEffect, useRef } from 'react';
import './ExhibitSpotlight.css';

export default function ExhibitSpotlight({ children, className = '', as: Tag = 'div', ...rest }) {
  const rootRef = useRef(null);
  const lightRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const light = lightRef.current;
    if (!root || !light) return undefined;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let pointer = null;
    let keyboardFocus = false;
    let alive = true;

    const cancelFrame = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const reset = () => {
      cancelFrame();
      pointer = null;
      keyboardFocus = false;
      root.removeAttribute('data-exhibit-light');
    };

    const canTrack = () => alive && !document.hidden && finePointer.matches && !reducedMotion.matches;

    const positionLight = (x, y) => {
      // The gradient is painted once; pointer updates only translate this layer.
      light.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const illuminateFocus = () => {
      positionLight(root.clientWidth / 2, root.clientHeight / 2);
      root.setAttribute('data-exhibit-light', 'focus');
    };

    const onPointerMove = event => {
      if (!canTrack() || event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!canTrack() || !pointer) return;
        const rect = root.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (pointer.x - rect.left) * (root.clientWidth / rect.width);
        const y = (pointer.y - rect.top) * (root.clientHeight / rect.height);
        positionLight(x, y);
        root.setAttribute('data-exhibit-light', 'pointer');
      });
    };

    const onPointerLeave = () => {
      cancelFrame();
      pointer = null;
      if (keyboardFocus && !document.hidden && !reducedMotion.matches) illuminateFocus();
      else root.removeAttribute('data-exhibit-light');
    };

    const onFocusIn = event => {
      keyboardFocus = event.target instanceof Element && event.target.matches(':focus-visible');
      if (!keyboardFocus || document.hidden || reducedMotion.matches) return;
      cancelFrame();
      pointer = null;
      illuminateFocus();
    };

    const onFocusOut = event => {
      if (root.contains(event.relatedTarget)) return;
      keyboardFocus = false;
      if (!pointer) root.removeAttribute('data-exhibit-light');
    };

    const onVisibilityChange = () => {
      if (document.hidden) reset();
    };

    root.addEventListener('pointerenter', onPointerMove, { passive: true });
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('pointercancel', onPointerLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    finePointer.addEventListener('change', reset);
    reducedMotion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      alive = false;
      reset();
      root.removeEventListener('pointerenter', onPointerMove);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointercancel', onPointerLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      finePointer.removeEventListener('change', reset);
      reducedMotion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [Tag]);

  return (
    <Tag {...rest} ref={rootRef} className={`exhibit-spotlight${className ? ` ${className}` : ''}`}>
      {children}
      <span ref={lightRef} className="exhibit-spotlight__light" aria-hidden="true" />
    </Tag>
  );
}
