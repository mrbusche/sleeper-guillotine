const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

export function watchForUpdates() {
  const updateNotice = document.getElementById('updateNotice');
  const refreshButton = document.getElementById('refreshPageButton');
  const currentModuleSrc = document.querySelector('script[type="module"][src]')?.getAttribute('src');

  if (!updateNotice || !refreshButton || !currentModuleSrc) return;

  let updateAvailable = false;
  let checkInProgress = false;

  async function checkForUpdates() {
    if (document.hidden || updateAvailable || checkInProgress) return;

    checkInProgress = true;

    try {
      const updateUrl = new URL(window.location.pathname, window.location.origin);
      updateUrl.searchParams.set('_updateCheck', Date.now().toString());
      const response = await fetch(updateUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Update check failed with status ${response.status}`);
      }

      const latestHtml = await response.text();
      const latestModuleSrc = new DOMParser()
        .parseFromString(latestHtml, 'text/html')
        .querySelector('script[type="module"][src]')
        ?.getAttribute('src');

      if (latestModuleSrc && latestModuleSrc !== currentModuleSrc) {
        updateAvailable = true;
        updateNotice.classList.remove('hidden');
      }
    } catch (error) {
      console.warn('Unable to check for app updates:', error);
    } finally {
      checkInProgress = false;
    }
  }

  refreshButton.addEventListener('click', () => window.location.reload());
  window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdates();
  });
  checkForUpdates();
}
