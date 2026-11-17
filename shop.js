const weekdayInGurugram = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long', timeZone: 'Asia/Kolkata'
}).format(new Date());

document.getElementById('hours-label').textContent = 'Today’s hours';
document.getElementById('today-hours').textContent = weekdayInGurugram === 'Tuesday'
  ? 'Closed today (Tuesday)'
  : '10 am–9 pm';

const mobileActions = document.querySelector('.mobile-actions');
const mobileViewport = window.matchMedia('(max-width: 620px)');
const heroActions = document.querySelector('.hero .actions');

function updateMobileActions() {
  mobileActions.hidden = !mobileViewport.matches || heroActions.getBoundingClientRect().bottom > 0;
}

const actionsObserver = new IntersectionObserver(updateMobileActions);
actionsObserver.observe(heroActions);
mobileViewport.addEventListener('change', updateMobileActions);
updateMobileActions();

const sectionMotif = document.querySelector('.section-motif');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  sectionMotif.classList.add('awaiting-reveal');
  const motifObserver = new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    sectionMotif.classList.remove('awaiting-reveal');
    observer.disconnect();
  }, { rootMargin: '0px 0px -12% 0px' });
  motifObserver.observe(sectionMotif);
}

const reviewList = document.getElementById('review-list');
const reviewControls = document.querySelector('.reviews-controls');
const reviewPosition = document.querySelector('.reviews-position');
const [previousReview, nextReview] = reviewControls.querySelectorAll('[data-review-step]');

function reviewStepWidth() {
  return reviewList.children[1].offsetLeft - reviewList.children[0].offsetLeft;
}

function updateReviewControls() {
  const step = reviewStepWidth();
  const first = 1 + Math.round(reviewList.scrollLeft / step);
  const count = reviewList.children.length;
  const last = Math.min(count, first + Math.round(reviewList.clientWidth / step) - 1);
  const position = first === last ? `${first} of ${count}` : `${first}–${last} of ${count}`;
  if (reviewPosition.textContent !== position) reviewPosition.textContent = position;

  previousReview.setAttribute('aria-disabled', reviewList.scrollLeft <= 1);
  nextReview.setAttribute('aria-disabled', reviewList.scrollLeft + reviewList.clientWidth >= reviewList.scrollWidth - 1);
}

function moveReview(step) {
  const width = reviewStepWidth();
  const current = Math.round(reviewList.scrollLeft / width);
  reviewList.scrollTo({ left: (current + step) * width });
}

for (const button of [previousReview, nextReview]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') !== 'true') moveReview(Number(button.dataset.reviewStep));
  });
}
reviewList.addEventListener('keydown', (event) => {
  if (event.target !== reviewList || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveReview(event.key === 'ArrowLeft' ? -1 : 1);
});
reviewList.addEventListener('scroll', updateReviewControls, { passive: true });
new ResizeObserver(updateReviewControls).observe(reviewList);
updateReviewControls();
reviewControls.hidden = false;

const deliveryForm = document.querySelector('.delivery-form');
const deliveryArea = document.getElementById('delivery-area');
const deliveryMessage = deliveryForm.elements.namedItem('text');

deliveryArea.addEventListener('input', () => deliveryArea.setCustomValidity(''));
deliveryForm.addEventListener('submit', (event) => {
  const area = deliveryArea.value.trim();
  if (!area) {
    event.preventDefault();
    deliveryArea.setCustomValidity('Enter your society or area.');
    deliveryArea.reportValidity();
    return;
  }

  deliveryMessage.value = `Hi, could you confirm if free home delivery is available to ${area} from Sardar - A Pure Meat Shop, Sector 67?`;
  recordAction('whatsapp_click', { placement: 'delivery_check' });
});

const locateDelivery = deliveryForm.querySelector('.delivery-locate');
const deliveryResult = deliveryForm.querySelector('.delivery-result');
const shopLatitude = 28.3909661;
const shopLongitude = 77.0668174;
const deliveryRadiusKm = 5;

function distanceFromShop({ latitude, longitude }) {
  const radians = Math.PI / 180;
  const halfLatitudeGap = (latitude - shopLatitude) * radians / 2;
  const halfLongitudeGap = (longitude - shopLongitude) * radians / 2;
  const chord = Math.sin(halfLatitudeGap) ** 2
    + Math.cos(latitude * radians) * Math.cos(shopLatitude * radians) * Math.sin(halfLongitudeGap) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, chord)));
}

function showDeliveryResult(title, detail) {
  const heading = document.createElement('strong');
  heading.textContent = title;
  deliveryResult.replaceChildren(heading, document.createTextNode(detail));
}

if (navigator.geolocation) {
  locateDelivery.hidden = false;
  locateDelivery.addEventListener('click', () => {
    locateDelivery.disabled = true;
    showDeliveryResult('Checking your distance…', 'Allow location access if your browser asks.');

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const distance = distanceFromShop(coords);
      const uncertaintyKm = Math.max(.1, coords.accuracy / 1000);
      let coverage = distance < deliveryRadiusKm ? 'Within the 5 km radius' : 'Beyond the 5 km radius';
      if (Math.abs(distance - deliveryRadiusKm) <= uncertaintyKm) coverage = 'Near the 5 km boundary';
      showDeliveryResult(coverage, `About ${distance.toFixed(1)} km from the shop in a straight line.`);
      locateDelivery.disabled = false;
    }, (error) => {
      const status = error.code === 1 ? 'Location access is unavailable' : 'Couldn’t find your location';
      showDeliveryResult(status, 'Enter your society or area to check on WhatsApp.');
      locateDelivery.disabled = false;
    }, { timeout: 10000, maximumAge: 60000 });
  });
}
