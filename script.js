(() => {
  // The local file is already trimmed to the requested 00:10–00:45 segment.
  const LOOP_START = 0;
  const LOOP_END = 35;
  const videos = document.querySelectorAll('.loop-video');

  // Keep both local videos inside the requested segment.
  videos.forEach((video) => {
    const playVideo = () => {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {});
      }
    };

    const startVideo = () => {
      video.currentTime = LOOP_START;
      playVideo();
    };

    video.addEventListener('loadedmetadata', startVideo, { once: true });
    video.addEventListener('timeupdate', () => {
      if (video.currentTime >= LOOP_END || video.currentTime < LOOP_START) {
        startVideo();
      }
    });
    video.addEventListener('ended', startVideo);
    video.addEventListener('pause', () => {
      if (!document.hidden) playVideo();
    });

    if (video.readyState >= 1) {
      startVideo();
    }

  });

  const cta = document.getElementById('cta');
  const verificationModal = document.getElementById('human-verification');
  const verifyHumanButton = document.getElementById('verify-human');
  const verificationClose = document.getElementById('verification-close');
  const verificationSwipe = document.getElementById('verification-swipe');
  let swipeVerified = false;
  // Keep the popup CTA aligned with the canonical offer used by WWM-2.
  // The tracking values are appended to this offer URL so the campaign
  // click id/sub ids remain available without sending the visitor back to
  // the pre-lander through the tracker bridge.
  const offerUrl = 'https://www.broevo.com/C42TG9D/M1NBQ79/';
  const articleUrl = 'https://www.gamertik.com/arknights-endfield-build-a-future-on-talos-ii/';

  const getClickId = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('click_id')) return params.get('click_id');
    try { return sessionStorage.getItem('kuma_click_id') || ''; } catch (e) { return ''; }
  };

  // Pass campaign parameters from the pre-lander URL into the offer CTA.
  const syncTrackingParams = () => {
    const pageParams = new URLSearchParams(window.location.search);
    const destination = new URL(offerUrl);
    const clickId = getClickId();
    if (clickId) destination.searchParams.set('click_id', clickId);
    ['sub1', 'subid'].forEach((key) => {
      const value = pageParams.get(key);
      if (value) destination.searchParams.set(key, value);
    });
    return destination;
  };

  const resetVerification = () => {
    swipeVerified = false;
    if (verificationSwipe) {
      verificationSwipe.style.setProperty('--swipe-progress', '0');
      verificationSwipe.style.setProperty('--swipe-offset', '0px');
      verificationSwipe.classList.remove('is-complete', 'is-dragging');
      verificationSwipe.setAttribute('aria-valuenow', '0');
      verificationSwipe.setAttribute('aria-valuetext', 'Not verified');
    }
    if (verifyHumanButton) verifyHumanButton.disabled = true;
  };

  const continueToOffer = () => {
    if (!cta) return;

    const destination = syncTrackingParams();
    if (!destination.searchParams.get('click_id')) {
      alert('Tracking click_id missing. Open this page from the campaign link.');
      return;
    }

    // A direct confirmation click opens the offer in a new tab while this tab
    // moves to the requested editorial page.
    const offerTab = window.open(destination.toString(), '_blank', 'noopener,noreferrer');
    if (offerTab) {
      offerTab.opener = null;
      window.location.assign(articleUrl);
      return;
    }

    // If a strict popup blocker intervenes, keep the primary CTA usable.
    window.location.assign(destination.toString());
  };

  if (cta) {
    cta.addEventListener('click', (event) => {
      event.preventDefault();

      if (verificationModal && typeof verificationModal.showModal === 'function') {
        resetVerification();
        verificationModal.showModal();
        return;
      }

      continueToOffer();
    });
  }

  if (verificationSwipe && verifyHumanButton) {
    let swipeStartX = null;
    const completeSwipe = () => {
      swipeVerified = true;
      verificationSwipe.style.setProperty('--swipe-progress', '1');
      verificationSwipe.style.setProperty('--swipe-offset', `${Math.max(0, verificationSwipe.clientWidth - 45)}px`);
      verificationSwipe.classList.remove('is-dragging');
      verificationSwipe.classList.add('is-complete');
      verificationSwipe.setAttribute('aria-valuenow', '1');
      verificationSwipe.setAttribute('aria-valuetext', 'Verified');
      verifyHumanButton.disabled = false;
    };

    const resetSwipePosition = () => {
      if (!swipeVerified) verificationSwipe.style.setProperty('--swipe-progress', '0');
    };

    verificationSwipe.addEventListener('pointerdown', (event) => {
      swipeStartX = event.clientX;
      verificationSwipe.classList.add('is-dragging');
      verificationSwipe.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    verificationSwipe.addEventListener('pointermove', (event) => {
      if (swipeStartX === null || swipeVerified) return;
      const progress = Math.max(0, Math.min(1, (event.clientX - swipeStartX) / Math.max(55, verificationSwipe.clientWidth - 50)));
      verificationSwipe.style.setProperty('--swipe-progress', progress.toFixed(2));
      verificationSwipe.style.setProperty('--swipe-offset', `${Math.round(progress * Math.max(0, verificationSwipe.clientWidth - 45))}px`);
      if (progress >= 1) completeSwipe();
    });

    verificationSwipe.addEventListener('pointerup', () => {
      swipeStartX = null;
      verificationSwipe.classList.remove('is-dragging');
      resetSwipePosition();
    });
    verificationSwipe.addEventListener('pointercancel', () => {
      swipeStartX = null;
      verificationSwipe.classList.remove('is-dragging');
      resetSwipePosition();
    });
    verificationSwipe.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        completeSwipe();
      }
    });
  }

  if (verifyHumanButton) {
    verifyHumanButton.addEventListener('click', () => {
      if (!swipeVerified) return;

      if (verificationModal && verificationModal.open) {
        verificationModal.close();
      }
      continueToOffer();
    });
  }

  if (verificationClose && verificationModal) {
    verificationClose.addEventListener('click', () => {
      resetVerification();
      verificationModal.close();
    });
    verificationModal.addEventListener('click', (event) => {
      if (event.target === verificationModal) {
        resetVerification();
        verificationModal.close();
      }
    });
    verificationModal.addEventListener('cancel', resetVerification);
  }
})();
