import React, {useLayoutEffect, useRef, useState} from 'react';
import './MediaDialog.css';
import {runTransition} from '../transitionCoordinator.js';

const TRANSITION_NAME = 'archive-reading-object';
function visibleImage(element, path) {
  const url = new URL(path, document.baseURI).href;
  const images = element?.matches?.('img') ? [element] : [...(element?.querySelectorAll?.('img') || [])];
  return images.find(image => (image.currentSrc || image.src) === url && image.getBoundingClientRect().width > 0);
}

export default function MediaDialog({media, onClose}) {
  const dialogRef = useRef(null);
  const imageRef = useRef(null);
  const originRef = useRef(null);
  const triggerRef = useRef(null);
  const pointerRef = useRef(null);
  const transitionRef = useRef(null);
  const closingRef = useRef(false);
  const sessionRef = useRef(0);
  const callbackRef = useRef(onClose);
  const restoreNameRef = useRef(() => {});
  const [zoomed, setZoomed] = useState(false);
  callbackRef.current = onClose;

  // Pointer capture also identifies the exact object in browsers that do not
  // focus a button on click. Keyboard activation uses the focused trigger.
  useLayoutEffect(() => {
    const capture = event => { pointerRef.current = event.target; };
    document.addEventListener('pointerdown', capture, true);
    return () => document.removeEventListener('pointerdown', capture, true);
  }, []);

  useLayoutEffect(() => {
    if (!media) return;
    const dialog = dialogRef.current;
    sessionRef.current += 1;
    let cancelled = false;
    closingRef.current = false;
    setZoomed(false);
    const focused = document.activeElement;
    const pointed = pointerRef.current?.closest?.('button, [role="button"], a');
    const focusedImage = visibleImage(focused, media.path);
    const pointedImage = visibleImage(pointed, media.path);
    const origin = focusedImage || pointedImage || [...document.querySelectorAll('img')].find(image =>
      !dialog.contains(image) && visibleImage(image, media.path));
    originRef.current = origin;
    triggerRef.current = focusedImage ? focused : pointedImage ? pointed : focused;
    pointerRef.current = null;
    const originalName = origin?.style.viewTransitionName || '';
    restoreNameRef.current = () => {
      if (origin) origin.style.viewTransitionName = originalName;
      if (imageRef.current) imageRef.current.style.viewTransitionName = '';
      document.documentElement.removeAttribute('data-archive-transition');
    };
    const open = () => {
      if (cancelled) return;
      if (origin) origin.style.viewTransitionName = 'none';
      imageRef.current.style.viewTransitionName = TRANSITION_NAME;
      if (!dialog.open) dialog.showModal();
    };
    const canAnimate = origin && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canAnimate) {
      origin.style.viewTransitionName = TRANSITION_NAME;
      document.documentElement.setAttribute('data-archive-transition', 'opening');
      try {
        const transition = runTransition({kind:'media',update:open});
        transitionRef.current = transition;
        transition.finished.then(ok => {
          if (ok && !cancelled && transitionRef.current === transition) restoreNameRef.current();
        });
      } catch { open(); restoreNameRef.current(); }
    } else { open(); restoreNameRef.current(); }
    return () => {
      cancelled = true;
      sessionRef.current += 1;
      transitionRef.current?.cancel();
      restoreNameRef.current();
      if (dialog.open) dialog.close();
    };
  }, [media]);

  function close() {
    const dialog = dialogRef.current;
    if (closingRef.current || !dialog.open) return;
    closingRef.current = true;
    transitionRef.current?.cancel();
    restoreNameRef.current();
    const origin = originRef.current;
    const trigger = triggerRef.current;
    const session = sessionRef.current;
    const finish = () => {
      if (sessionRef.current !== session) return;
      restoreNameRef.current();
      if (trigger?.isConnected) trigger.focus?.({preventScroll: true});
      callbackRef.current();
    };
    const dismiss = () => {
      if (imageRef.current) imageRef.current.style.viewTransitionName = 'none';
      if (origin?.isConnected) origin.style.viewTransitionName = TRANSITION_NAME;
      dialog.close();
    };
    const canAnimate = origin?.isConnected && origin.getBoundingClientRect().width > 0 &&
      document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canAnimate) {
      imageRef.current.style.viewTransitionName = TRANSITION_NAME;
      document.documentElement.setAttribute('data-archive-transition', 'closing');
      try {
        const transition = runTransition({kind:'media',update:dismiss,onCancel:finish});
        transitionRef.current = transition;
        transition.finished.then(ok=>{if(ok)finish()});
      } catch { dismiss(); finish(); }
    } else { dismiss(); finish(); }
  }

  return <dialog className="media-dialog archival-reader" ref={dialogRef} aria-labelledby="media-dialog-title" data-scroll-lock
    onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation(); }}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}
    onClose={() => { if (!closingRef.current && media) { restoreNameRef.current(); callbackRef.current(); } }}>
    <header className="archival-reader-bar"><span>图像阅览室 <i>/</i> ORIGINAL OBJECT</span><button className="dialog-close" onClick={close} aria-label="关闭影像">返回原物件 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15 5 5 15M5 6v9h9" stroke="currentColor" strokeWidth="1.2"/></svg></button></header>
    {media && <><div className={`media-view ${zoomed ? 'is-zoomed' : ''}`} tabIndex={0} aria-label="图像查看区，放大后可滚动查看">
      <img ref={imageRef} src={media.path} alt={media.alt || media.caption || ''}/>
    </div><div className="media-caption"><p className="eyebrow">ARCHIVAL IMAGE / 图像档案</p><h2 id="media-dialog-title">{media.caption || media.alt}</h2>
      <button className="image-zoom-toggle" onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>{zoomed ? '适合窗口 −' : '放大查看 ＋'}</button>
      <p className="image-zoom-hint">{zoomed ? '可在图像区域滚动查看；放大不增加原图细节。' : '保留原始图像，可放大阅读细节。'}</p>
      <p>{media.verificationNote || media.credit}</p><p>{media.rightsNote || media.license}</p>
      {media.sourceUrl && <a href={media.sourceUrl} target="_blank" rel="noreferrer">查看原始出处 ↗</a>}
      <p className="fine">图像保持原貌；公开可见不等于可自由再利用。</p>
    </div></>}
  </dialog>;
}
