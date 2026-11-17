const measurementId = document.querySelector('meta[name="ga-measurement-id"]').content.trim();
const analyticsEnabled = /^G-[A-Z0-9]+$/.test(measurementId);

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

if (analyticsEnabled) {
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(tag);
  gtag('js', new Date());
  gtag('config', measurementId);
}

function recordAction(name, details) {
  const properties = { branch: 'sector_67', ...details };
  if (analyticsEnabled) {
    gtag('event', name, properties);
  } else {
    window.dataLayer.push({ event: name, ...properties });
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-action]');
  if (!link) return;

  const details = {};
  if (link.dataset.placement) details.placement = link.dataset.placement;
  if (link.dataset.category) details.product_category = link.dataset.category;
  if (link.dataset.group) details.product_group = link.dataset.group;
  if (link.dataset.product) details.product = link.dataset.product;
  recordAction(link.dataset.action, details);
});
