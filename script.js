const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'メニューを開く' : 'メニューを閉じる');
  navigation.classList.toggle('is-open', !isOpen);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'メニューを開く');
    navigation.classList.remove('is-open');
  }
});

const photoLightbox = document.querySelector('.photo-lightbox');

if (photoLightbox) {
  const closeButton = photoLightbox.querySelector('.lightbox-close');
  const lightboxImage = photoLightbox.querySelector('img');
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let isDragging = false;
  let didDrag = false;
  let pointerId = null;
  const setTransform = () => {
    lightboxImage.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoom})`;
    lightboxImage.style.cursor = zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in';
  };
  const clampOffset = () => {
    const limitX = (lightboxImage.clientWidth * (zoom - 1)) / 2;
    const limitY = (lightboxImage.clientHeight * (zoom - 1)) / 2;
    offsetX = Math.max(-limitX, Math.min(limitX, offsetX));
    offsetY = Math.max(-limitY, Math.min(limitY, offsetY));
  };
  const resetZoom = () => {
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
    isDragging = false;
    setTransform();
  };

  document.querySelectorAll('.profile-photo-link').forEach((photoLink) => {
    photoLink.addEventListener('click', (event) => {
      event.preventDefault();
      const thumbnail = photoLink.querySelector('img');
      lightboxImage.src = photoLink.href;
      lightboxImage.alt = `${thumbnail.alt} 拡大画像`;
      resetZoom();
      photoLightbox.showModal();
    });
  });

  closeButton.addEventListener('click', () => photoLightbox.close());

  photoLightbox.addEventListener('wheel', (event) => {
    if (event.target !== lightboxImage) return;
    event.preventDefault();
    const step = event.deltaY < 0 ? 0.15 : -0.15;
    zoom = Math.min(3, Math.max(1, zoom + step));
    if (zoom === 1) offsetX = offsetY = 0;
    clampOffset();
    setTransform();
  }, { passive: false });

  lightboxImage.addEventListener('click', () => {
    if (didDrag) {
      didDrag = false;
      return;
    }
    if (zoom === 1) zoom = 1.5;
    else {
      zoom = 1;
      offsetX = offsetY = 0;
    }
    clampOffset();
    setTransform();
  });

  lightboxImage.addEventListener('pointerdown', (event) => {
    if (zoom <= 1 || event.button !== 0) return;
    event.preventDefault();
    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = offsetX;
    dragOriginY = offsetY;
    didDrag = false;
    isDragging = true;
    lightboxImage.setPointerCapture(pointerId);
    setTransform();
  });
  lightboxImage.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerId !== pointerId) return;
    const moveX = event.clientX - dragStartX;
    const moveY = event.clientY - dragStartY;
    if (Math.abs(moveX) + Math.abs(moveY) > 4) didDrag = true;
    offsetX = dragOriginX + moveX;
    offsetY = dragOriginY + moveY;
    clampOffset();
    setTransform();
  });
  const finishDrag = (event) => {
    if (!isDragging || event.pointerId !== pointerId) return;
    isDragging = false;
    pointerId = null;
    setTransform();
  };
  lightboxImage.addEventListener('pointerup', finishDrag);
  lightboxImage.addEventListener('pointercancel', finishDrag);
  photoLightbox.addEventListener('close', resetZoom);

  photoLightbox.addEventListener('click', (event) => {
    if (event.target === photoLightbox) photoLightbox.close();
  });
}

/* View toggle: force PC / mobile layout (preview switch) */
(() => {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="viewport"]');
  const DEFAULT_META = 'width=device-width, initial-scale=1';
  const buttons = document.querySelectorAll('.view-toggle [data-view-set]');
  if (!buttons.length) return;
  const apply = (mode) => {
    if (mode === 'pc' || mode === 'sp') {
      root.setAttribute('data-view', mode);
      if (meta) meta.setAttribute('content', mode === 'pc' ? 'width=1280' : DEFAULT_META);
    } else {
      root.removeAttribute('data-view');
      if (meta) meta.setAttribute('content', DEFAULT_META);
    }
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewSet === mode)));
    try {
      if (mode) localStorage.setItem('mesigiji-view', mode);
      else localStorage.removeItem('mesigiji-view');
    } catch (e) {}
  };
  let saved = null;
  try { saved = localStorage.getItem('mesigiji-view'); } catch (e) {}
  if (saved === 'pc' || saved === 'sp') apply(saved);
  buttons.forEach((b) => b.addEventListener('click', () => {
    apply(root.getAttribute('data-view') === b.dataset.viewSet ? null : b.dataset.viewSet);
  }));
})();
