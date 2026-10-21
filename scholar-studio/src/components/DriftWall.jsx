// Adapted from React Bits DriftWall, DavidHDev/react-bits @ e12c221.
// Copyright (c) 2026 David Haz. MIT + Commons Clause.
// License distributed with the site at public/licenses/react-bits-drift-wall-LICENSE.md.
// Original source and license: inputs/react-bits-drift-wall/.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './DriftWall.css';

const DEFAULT_ITEMS = Array.from({ length: 15 }, (_, i) => {
  const ids = [1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110, 133, 164];
  return {
    image: `https://picsum.photos/id/${ids[i % ids.length]}/600/400`,
    title: `Tile ${i + 1}`,
    href: undefined
  };
});

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

const DriftWall = ({
  items = DEFAULT_ITEMS,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  parallax = 0.6,
  pauseOnHover = false,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  grayscale = false,
  overlayColor = '#060010',
  className = '',
  paused = false,
  keyboardNavigation = true,
  onSelect,
  showTitles = true,
  imageFit = 'contain',
  imagePosition = 'center',
  ariaLabel = '校史人物流动画廊',
  style
}) => {
  const containerRef = useRef(null);
  const planeRef = useRef(null);
  const trackRefs = useRef([]);
  const rafRef = useRef(null);

  const offsetsRef = useRef([]);
  const velocitiesRef = useRef([]);
  const hoveredColRef = useRef(-1);
  const wallHoveredRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef(null);

  const [containerHeight, setContainerHeight] = useState(600);
  const [activeId, setActiveId] = useState(null);
  const activeIdRef = useRef(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const running = !paused && !reduced && inView && pageVisible && !keyboardFocus;

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = e => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0);
    });
    observer.observe(container);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const columnItems = useMemo(() => {
    const count = Math.max(1, Math.min(Math.floor(columns) || 1, items.length || 1));
    const cols = Array.from({ length: count }, () => []);
    items.forEach((item, index) => cols[index % count].push({ item, index }));
    return cols;
  }, [items, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 600);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  useLayoutEffect(() => {
    // Filtering reuses tile positions, so the previous occupant's hover must not
    // freeze a different person. Removed focused nodes do not always emit blur.
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    pointerDampedRef.current = { x: 0, y: 0 };
    setActiveId(null);
    setKeyboardFocus(Boolean(containerRef.current?.contains(document.activeElement)));
  }, [columnItems, reduced, keyboardNavigation]);

  useEffect(() => {
    if (inView && pageVisible) return;
    // Scrolling away or hiding a tab can leave a column hovered without a
    // pointerleave event; returning must resume every previously moving column.
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    setActiveId(null);
  }, [inView, pageVisible]);

  const applyPlaneTransform = useCallback(
    (px, py) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth]
  );

  useEffect(() => {
    // Pausing preserves offsets. Resuming never integrates time spent offscreen.
    applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);
    trackRefs.current.forEach((track, index) => {
      if (track) track.style.transform = `translate3d(0, ${-(offsetsRef.current[index] ?? 0)}px, 0)`;
    });
    if (!running) return;

    const animate = ts => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const paused = wallHoveredRef.current && pauseOnHover;
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform, running]);

  const activate = useCallback((id, index) => {
    activeIdRef.current = id;
    hoveredColRef.current = index;
    setActiveId(id);
  }, []);
  const release = useCallback(() => {
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const handlePointerMove = useCallback(
    e => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        };
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit && hit.closest ? hit.closest('[data-tile-id]') : null;
      if (!tile || !containerRef.current?.contains(tile)) {
        release();
        return;
      }
      const id = tile.dataset.tileId;
      if (id === activeIdRef.current) return;
      activeIdRef.current = id;
      hoveredColRef.current = Number(tile.dataset.col);
      setActiveId(id);
    },
    [parallax, reduced, release]
  );

  const handlePointerLeaveWall = useCallback(() => {
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    release();
  }, [release]);

  const cssVars = useMemo(
    () => ({
      '--dw-tile-w': `${tileWidth}px`,
      '--dw-tile-h': `${tileHeight}px`,
      '--dw-plane-h': `${containerHeight * 1.6}px`,
      '--dw-gap': `${gap}px`,
      '--dw-radius': `${radius}px`,
      '--dw-perspective': `${perspective}px`,
      '--dw-lift': `${lift}px`,
      '--dw-dim': dim,
      '--dw-gray': grayscale ? 1 : 0,
      '--dw-overlay': overlayColor,
      '--dw-image-fit': imageFit,
      '--dw-image-position': imagePosition,
      '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
      ...style
    }),
    [tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, fade, style, imageFit, imagePosition, containerHeight]
  );

  const selectItem = (event, item, index) => {
    if (onSelect) {
      event.preventDefault();
      onSelect(item, index);
    } else if (item.href && event.currentTarget.tagName !== 'A') {
      window.location.assign(item.href);
    }
  };

  const tileContent = item => (
    <span className="drift-wall__inner">
      {item.image ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          style={{ objectPosition: item.objectPosition || imagePosition, objectFit: item.imageFit || imageFit }}
        />
      ) : (
        <span className="drift-wall__portrait-pending" aria-hidden="true">{item.title?.slice(0, 1)}</span>
      )}
      <span className="drift-wall__overlay" aria-hidden="true" />
      {showTitles && (
        <span className="drift-wall__caption">
          <span className="drift-wall__name">{item.title}</span>
          {item.subtitle && <span className="drift-wall__subtitle">{item.subtitle}</span>}
        </span>
      )}
    </span>
  );

  const renderTile = ({ item, index }, id, colIndex, semantic = false) => {
    const commonProps = {
      className: `drift-wall__tile${activeId === id ? ' is-active' : ''}`,
      'data-tile-id': id,
      'data-person-id': item.id,
      'data-col': colIndex,
      onClick: event => selectItem(event, item, index),
      onFocus: () => activate(id, colIndex),
      onBlur: release
    };
    if (semantic) {
      return item.href && !onSelect ? (
        <a key={id} href={item.href} {...commonProps} aria-label={`查看${item.title}的人物介绍`}>
          {tileContent(item)}
        </a>
      ) : (
        <button key={id} type="button" {...commonProps} aria-label={`查看${item.title}的人物介绍`}>
          {tileContent(item)}
        </button>
      );
    }
    // Looping copies are visual hit targets; the unique roster below provides
    // one keyboard/screen-reader action per person, regardless of copy count.
    return (
      <div key={id} {...commonProps} aria-hidden="true">
        {tileContent(item)}
      </div>
    );
  };

  const rootClass = ['drift-wall', reduced ? 'drift-wall--reduced' : '', running ? 'drift-wall--running' : '', className].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHoveredRef.current = true;
      }}
      onPointerLeave={handlePointerLeaveWall}
      onFocusCapture={() => setKeyboardFocus(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false);
      }}
      role="region"
      aria-label={ariaLabel}
      data-motion={running ? 'running' : 'paused'}
      data-running={running}
    >
      {reduced ? (
        <div className="drift-wall__static">
          {items.map((item, index) => renderTile({ item, index }, `static-${index}`, index, keyboardNavigation))}
        </div>
      ) : <div ref={planeRef} className="drift-wall__plane" aria-hidden="true">
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div className="drift-wall__col" key={`col-${c}`}>
              <div className="drift-wall__track" ref={el => (trackRefs.current[c] = el)}>
                {copies.map((_, copyIndex) =>
                  col.map((entry, itemIndex) => renderTile(entry, `${c}-${copyIndex}-${itemIndex}`, c))
                )}
              </div>
            </div>
          );
        })}
      </div>}
      {!reduced && keyboardNavigation && (
        <div className="drift-wall__keyboard-nav" aria-label="按姓名浏览人物">
          {items.map((item, index) => item.href && !onSelect ? (
            <a key={item.id ?? index} href={item.href}>{item.title}</a>
          ) : (
            <button key={item.id ?? index} type="button" onClick={event => selectItem(event, item, index)}>
              {item.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriftWall;
