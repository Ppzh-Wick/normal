/*! Adapted from React Bits BorderGlow — Copyright (c) 2026 David Haz.
    MIT + Commons Clause; see ../../licenses/React-Bits-BorderGlow-LICENSE.md.
    Preserves the original edge/angle math, mesh gradients and glow colors.
    Adds semantic elements, existing-surface support, focus feedback and cleanup. */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import './BorderGlow.css';

const POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const KEYS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
const DEFAULT_COLORS = ['#c084fc', '#f472b6', '#38bdf8'];

// All cards share one pair of global reset listeners.
const pointerResets = new Set();
const resetAllPointers = () => pointerResets.forEach(reset => reset());
const resetHiddenPointers = () => { if (document.hidden) resetAllPointers(); };
function subscribeReset(reset) {
  if (!pointerResets.size) {
    window.addEventListener('blur', resetAllPointers);
    document.addEventListener('visibilitychange', resetHiddenPointers);
  }
  pointerResets.add(reset);
  return () => {
    pointerResets.delete(reset);
    reset();
    if (!pointerResets.size) {
      window.removeEventListener('blur', resetAllPointers);
      document.removeEventListener('visibilitychange', resetHiddenPointers);
    }
  };
}

function glowVariables(glowColor, intensity, colors) {
  const match = glowColor.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
  const [h, s, l] = match ? match.slice(1).map(Number) : [40, 80, 80];
  const vars = {};
  [100, 60, 50, 40, 30, 20, 10].forEach((opacity, index) => {
    const suffix = index ? `-${opacity}` : '';
    vars[`--glow-color${suffix}`] = `hsl(${h}deg ${s}% ${l}% / ${Math.min(opacity * intensity, 100)}%)`;
  });
  const palette = colors.length ? colors : DEFAULT_COLORS;
  POSITIONS.forEach((position, index) => {
    vars[`--gradient-${KEYS[index]}`] = `radial-gradient(at ${position}, ${palette[Math.min(COLOR_MAP[index], palette.length - 1)]} 0px, transparent 50%)`;
  });
  vars['--gradient-base'] = `linear-gradient(${palette[0]} 0 100%)`;
  return vars;
}

export default function BorderGlow({
  as: Element = 'div',
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 32,
  glowRadius = 44,
  glowIntensity = 1.3,
  coneSpread = 25,
  animated = false,
  colors = DEFAULT_COLORS,
  fillOpacity = 0.5,
  preserveSurface = false,
  lightSurface = false,
  disabled = false,
  style,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  onFocusCapture,
  onBlurCapture,
  ...props
}) {
  const cardRef = useRef(null);
  const frameRef = useRef(0);
  const positionRef = useRef(null);
  const colorsStyle = useMemo(() => glowVariables(glowColor, glowIntensity, colors), [glowColor, glowIntensity, colors]);
  const resetPointer = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    cardRef.current?.style.setProperty('--edge-proximity', '0');
  }, []);

  const updatePointer = useCallback((event) => {
    onPointerMove?.(event);
    if (disabled || event.pointerType === 'touch') return;
    positionRef.current = { x: event.clientX, y: event.clientY };
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const card = cardRef.current;
      if (!card || !positionRef.current) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = positionRef.current.x - rect.left - rect.width / 2;
      const dy = positionRef.current.y - rect.top - rect.height / 2;
      // Same normalized distance and cursor angle as the official component.
      const edge = Math.min(Math.max(Math.abs(dx) / (rect.width / 2), Math.abs(dy) / (rect.height / 2)), 1);
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
      card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3));
      card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    });
  }, [disabled, onPointerMove]);

  useEffect(() => {
    if (disabled) return undefined;
    return subscribeReset(resetPointer);
  }, [disabled, resetPointer]);

  useEffect(() => {
    if (disabled) resetPointer();
    const card = cardRef.current;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!animated || disabled || reducedMotion.matches || !card) return;
    let frame = 0;
    const start = performance.now();
    const stop = () => {
      cancelAnimationFrame(frame);
      card.removeAttribute('data-glow-sweep');
      resetPointer();
    };
    const tick = (now) => {
      const progress = Math.min((now - start) / 4000, 1);
      card.setAttribute('data-glow-sweep', '');
      card.style.setProperty('--cursor-angle', `${110 + 355 * progress}deg`);
      card.style.setProperty('--edge-proximity', `${100 * Math.min(progress * 8, 1, (1 - progress) * 4)}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else stop();
    };
    frame = requestAnimationFrame(tick);
    reducedMotion.addEventListener('change', stop);
    card.addEventListener('pointerenter', stop, { once: true });
    return () => {
      stop();
      reducedMotion.removeEventListener('change', stop);
      card.removeEventListener('pointerenter', stop);
    };
  }, [animated, disabled, resetPointer]);

  return (
    <Element
      {...props}
      ref={cardRef}
      className={`border-glow-card ${className}`}
      data-glow-disabled={disabled || undefined}
      data-glow-light={lightSurface || undefined}
      data-preserve-surface={preserveSurface || undefined}
      style={{
        '--card-bg': backgroundColor,
        '--edge-sensitivity': edgeSensitivity,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--cone-spread': coneSpread,
        '--fill-opacity': fillOpacity,
        ...colorsStyle,
        borderRadius,
        ...style,
      }}
      onPointerMove={updatePointer}
      onPointerLeave={(event) => { resetPointer(); onPointerLeave?.(event); }}
      onPointerCancel={(event) => { resetPointer(); onPointerCancel?.(event); }}
      onFocusCapture={(event) => {
        if (event.target.matches(':focus-visible')) event.currentTarget.setAttribute('data-glow-focus', '');
        onFocusCapture?.(event);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('data-glow-focus');
        onBlurCapture?.(event);
      }}
    >
      {children}
      <span className="border-glow-decoration border-glow-tint" aria-hidden="true" />
      <span className="border-glow-decoration border-glow-ring" aria-hidden="true" />
      <span className="border-glow-decoration border-glow-aura" aria-hidden="true" />
    </Element>
  );
}
