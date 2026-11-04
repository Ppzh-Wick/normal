// Adapted from React Bits AnimatedContent. See docs/V7-MOTION.md and licenses/React-Bits-LICENSE.md.
// This exhibit keeps finite entrances; unused scroll-scrubbing is intentionally omitted.
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { observeEntrance } from './observeEntrance.mjs';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const WIPES = {
  up: 'linear-gradient(to top, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  down: 'linear-gradient(to bottom, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  left: 'linear-gradient(to left, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  right: 'linear-gradient(to right, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  center:
    'radial-gradient(farthest-corner at 50% 50%, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))'
};

const AnimatedContent = ({
  children,
  disabled = false,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  blur = 0,
  rotate = 0,
  tilt = 0,
  wipe = 'none',
  threshold = 0.1,
  delay = 0,
  stagger = 0,
  staggerFrom = 'start',
  trigger = 'scroll',
  once = true,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  onStart,
  onComplete,
  onDisappearanceComplete,
  className = '',
  style,
  ...props
}) => {
  const ref = useRef(null);
  const callbacksRef = useRef({ onStart, onComplete, onDisappearanceComplete });
  callbacksRef.current = { onStart, onComplete, onDisappearanceComplete };

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;

    let scroller = container || document.getElementById('snap-main-container') || null;
    if (typeof scroller === 'string') scroller = document.querySelector(scroller);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let stopEntrance = () => {};
    const ctx = gsap.context(() => {
      const targets = stagger > 0 && el.children.length ? Array.from(el.children) : [el];
      const horizontal = direction === 'horizontal';
      const axis = horizontal ? 'x' : 'y';
      const sign = reverse ? -1 : 1;
      const mask = WIPES[wipe];

      gsap.set(el, { visibility: 'visible' });

      if (reduce) {
        callbacksRef.current.onComplete?.();
        return;
      }

      const from = {
        [axis]: distance * sign,
        scale,
        opacity: animateOpacity ? initialOpacity : 1
      };
      const to = {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        ease
      };

      if (blur > 0) {
        from.filter = `blur(${blur}px)`;
        to.filter = 'blur(0px)';
      }
      if (rotate) {
        from.rotation = rotate * sign;
        to.rotation = 0;
      }
      if (tilt) {
        const tiltAxis = horizontal ? 'rotationY' : 'rotationX';
        from[tiltAxis] = horizontal ? -tilt * sign : tilt * sign;
        to[tiltAxis] = 0;
        from.transformPerspective = 900;
        to.transformPerspective = 900;
      }
      if (mask) {
        gsap.set(targets, { maskImage: mask, webkitMaskImage: mask });
        from['--ac-wipe'] = 0;
        to['--ac-wipe'] = 1;
      }
      if (stagger > 0) to.stagger = { each: stagger, from: staggerFrom };

      const settle = () => {
        gsap.set(targets, { clearProps: mask ? 'filter,transform,maskImage,webkitMaskImage' : 'filter,transform' });
      };

      const disappear = () => {
        if (disappearAfter <= 0) return;
        const out = {
          [axis]: -distance * sign,
          scale: 0.8,
          opacity: animateOpacity ? initialOpacity : 0,
          delay: disappearAfter,
          duration: disappearDuration,
          ease: disappearEase,
          onComplete: () => callbacksRef.current.onDisappearanceComplete?.()
        };
        if (blur > 0) out.filter = `blur(${blur}px)`;
        if (stagger > 0) out.stagger = { each: stagger, from: staggerFrom };
        gsap.to(targets, out);
      };

      const tl = gsap.timeline({
        paused: true,
        onStart: () => callbacksRef.current.onStart?.(),
        onComplete: () => {
          callbacksRef.current.onComplete?.();
          settle();
          if (once) disappear();
        }
      });
      tl.fromTo(targets, from, to, Math.max(delay, 0));

      if (trigger === 'mount') {
        tl.play();
        return;
      }

      stopEntrance = observeEntrance(el, {
        root: scroller,
        threshold,
        once,
        onEnter: () => tl.play(),
        onLeaveBack: () => {
          if (mask) gsap.set(targets, { maskImage: mask, webkitMaskImage: mask });
          tl.reverse();
        }
      });
    }, el);

    return () => {
      stopEntrance();
      ctx.revert();
    };
  }, [
    disabled,
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    blur,
    rotate,
    tilt,
    wipe,
    threshold,
    delay,
    stagger,
    staggerFrom,
    trigger,
    once,
    disappearAfter,
    disappearDuration,
    disappearEase
  ]);

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

export default AnimatedContent;
