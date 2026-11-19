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
  // The popup CTA must go through the tracker click endpoint. The tracker
  // resolves the stored click and forwards sub1 to the configured offer.
  const trackerClickUrl = 'https://trk.gameroza.com/lp/click.php';
  const articleUrl = 'https://www.gamertik.com/arknights-endfield-build-a-future-on-talos-ii/';

  const getClickId = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('click_id')) return params.get('click_id');
    try { return sessionStorage.getItem('kuma_click_id') || ''; } catch (e) { return ''; }
  };

  // Resolve the tracked offer from the campaign click id.
  const syncTrackingParams = () => {
    const destination = new URL(trackerClickUrl);
    const clickId = getClickId();
    if (clickId) destination.searchParams.set('click_id', clickId);
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
    // Open a blank tab synchronously, detach it from this page, then send it
    // to the offer. This prevents the offer from navigating the original tab.
    const offerTab = window.open('about:blank', '_blank');
    if (!offerTab) {
      alert('Please allow pop-ups to continue to the offer.');
      return;
    }
    offerTab.opener = null;
    offerTab.location.replace(destination.toString());
    window.location.replace(articleUrl);
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
