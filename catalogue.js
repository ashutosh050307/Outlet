const catalogue = document.querySelector('.catalogue');
const categoryList = catalogue.querySelector('.category-links');
const tabs = [...categoryList.querySelectorAll('a')];
const panels = tabs.map((tab) => document.getElementById(tab.dataset.category));
const subgroups = panels.map((panel, categoryIndex) => [...panel.querySelectorAll('.group-links a')].map((link) => ({
  link,
  panel: document.getElementById(link.dataset.group),
  name: link.querySelector('.group-label').textContent,
  categoryName: tabs[categoryIndex].querySelector('.category-label').textContent,
  categoryIndex,
  productIndexes: []
})));
const groupsByHash = new Map(subgroups.flat().map((group) => [group.link.hash, group]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const oldCategoryLinks = {
  '#raw': '#fresh',
  '#frozen': '#heat-n-eat',
  '#product-fresh-chicken': '#raw-chicken',
  '#product-jhatka-mutton': '#raw-mutton',
  '#product-chicken-tikka': '#marinated-chicken',
  '#product-chicken-seekh': '#heat-chicken'
};

function selectGroup(categoryIndex, selectedGroup) {
  for (const group of subgroups[categoryIndex]) {
    const selected = group === selectedGroup;
    group.link.setAttribute('aria-expanded', String(selected));
    group.panel.hidden = !selected;
  }
}

function revealIfBelowFold(panel) {
  if (panel.getBoundingClientRect().top < window.innerHeight - 200) return;
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ block: 'start' });
}

function selectCategory(index, animate = false) {
  tabs.forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[position].hidden = !selected;
  });

  if (animate && !reducedMotion.matches) {
    panels[index].animate([{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], {
      duration: 220, easing: 'ease-out'
    });
  }
}

function openCategoryFromLocation() {
  const hash = oldCategoryLinks[location.hash] || location.hash;
  const group = groupsByHash.get(hash);
  const index = group ? group.categoryIndex : tabs.findIndex((tab) => tab.hash === hash);
  if (index === -1) return;
  selectCategory(index);
  selectGroup(index, group);
  document.getElementById(hash.slice(1)).scrollIntoView({ block: 'start', behavior: 'instant' });
}

categoryList.setAttribute('role', 'tablist');
catalogue.classList.add('catalogue-interactive');
tabs.forEach((tab, index) => {
  const panel = panels[index];
  tab.id = `tab-${panel.id}`;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panel.id);
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', tab.id);
  panel.tabIndex = -1;
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    const wasSelected = tab.getAttribute('aria-selected') === 'true';
    selectCategory(index, !wasSelected);
    if (!wasSelected) selectGroup(index);
    history.replaceState(history.state, '', tab.hash);
    if (event.detail > 0) revealIfBelowFold(panel);
  });
  tab.addEventListener('keydown', (event) => {
    const navigation = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    };
    if (event.key === ' ') {
      event.preventDefault();
      tab.click();
    } else if (Object.hasOwn(navigation, event.key)) {
      event.preventDefault();
      tabs[navigation[event.key]].focus();
      tabs[navigation[event.key]].click();
    }
  });
});
for (const [index, groups] of subgroups.entries()) {
  selectGroup(index);
  for (const group of groups) {
    group.link.setAttribute('aria-controls', group.panel.id);
    group.panel.tabIndex = -1;
    group.link.addEventListener('click', (event) => {
      event.preventDefault();
      selectGroup(index, group);
      history.replaceState(history.state, '', group.link.hash);
      revealIfBelowFold(group.panel);
    });
  }
}
selectCategory(0);
openCategoryFromLocation();
window.addEventListener('hashchange', openCategoryFromLocation);

const productDetail = document.getElementById('product-detail');
const detailPhoto = productDetail.querySelector('.detail-photo');
const detailTitle = document.getElementById('detail-title');
const detailCategory = document.getElementById('detail-category');
const detailDescription = document.getElementById('detail-description');
const detailSave = productDetail.querySelector('.detail-save');

if (typeof productDetail.showModal === 'function') {
  const detailMedia = productDetail.querySelector('.detail-media');
  const detailZoomLabel = productDetail.querySelector('.detail-zoom-label');
  const detailCount = productDetail.querySelector('.detail-count');
  const enquiry = document.getElementById('whatsapp-enquiry');
  const enquiryHeading = document.getElementById('enquiry-heading');
  const enquiryItems = enquiry.querySelector('.enquiry-items');
  const enquiryEmpty = enquiry.querySelector('.enquiry-empty');
  const enquiryBrowse = enquiry.querySelector('.enquiry-browse');
  const enquiryForm = enquiry.querySelector('.enquiry-form');
  const enquiryMessage = document.getElementById('whatsapp-message');
  const listButtons = [...document.querySelectorAll('[data-open-list]')];
  const listStorageKey = 'sardar-sector67-product-list';
  const savedIds = new Set();
  let currentIndex = 0;
  let activeProductLink = '';
  let enquiryProduct = null;
  let listDraft = '';

  const products = [...catalogue.querySelectorAll('.product')].map((card, index) => {
    const heading = card.querySelector('h5');
    const name = heading.textContent;
    const group = groupsByHash.get(`#${card.closest('.product-group').id}`);
    const groupPosition = group.productIndexes.push(index) - 1;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-open';
    button.textContent = name;
    button.setAttribute('aria-haspopup', 'dialog');
    const more = document.createElement('span');
    more.setAttribute('aria-hidden', 'true');
    more.textContent = '+';
    button.append(more);
    heading.replaceChildren(button);
    card.classList.add('product-interactive');
    button.addEventListener('click', () => openProduct(index, 'product_counter'));

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button button-outline product-save';
    card.append(saveButton);
    saveButton.addEventListener('click', () => toggleSaved(products[index].id));

    return {
      id: card.dataset.product,
      hash: `#${card.id}`,
      name,
      description: card.querySelector('p')?.textContent || (group.panel.id === 'raw-fish'
        ? 'Ask the shop about seasonal availability and pre-orders.'
        : 'Ask the shop about availability and pack sizes.'),
      photo: card.querySelector('img'),
      group,
      groupPosition,
      openButton: button,
      saveButton
    };
  });
  const productLinks = new Map(products.map((product, index) => [product.hash, index]));
  const nameCounts = new Map();
  for (const product of products) {
    const name = product.name.toLowerCase();
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  }
  for (const product of products) {
    product.enquiryName = nameCounts.get(product.name.toLowerCase()) > 1
      ? `${product.name} (${product.group.categoryName})`
      : product.name;
  }

  // Keep existing saved requests for whole categories or unspecified varieties.
  const listProducts = [...products,
    { id: 'fresh_chicken', enquiryName: 'Fresh chicken' },
    { id: 'jhatka_mutton', enquiryName: 'Jhatka mutton' },
    { id: 'chicken_tikka', enquiryName: 'Chicken Tikka' },
    { id: 'chicken_seekh', enquiryName: 'Chicken seekh kebabs' }
  ];

  try {
    const stored = JSON.parse(localStorage.getItem(listStorageKey));
    if (Array.isArray(stored)) {
      listProducts.forEach((product) => { if (stored.includes(product.id)) savedIds.add(product.id); });
    }
  } catch { /* The list still works when browser storage is unavailable. */ }

  function updateSaveButton(button, product) {
    const saved = savedIds.has(product.id);
    button.textContent = saved ? '✓ In my list' : '+ Add to my list';
    button.setAttribute('aria-label', `Save ${product.name} to my list`);
    button.setAttribute('aria-pressed', String(saved));
  }

  function updateSavedControls() {
    products.forEach((product) => updateSaveButton(product.saveButton, product));
    updateSaveButton(detailSave, products[currentIndex]);
    listButtons.forEach((button) => {
      button.querySelector('[data-list-count]').textContent = savedIds.size;
      button.setAttribute('aria-label', `My list, ${savedIds.size} ${savedIds.size === 1 ? 'item' : 'items'}`);
    });
  }

  function toggleSaved(id) {
    if (savedIds.has(id)) savedIds.delete(id);
    else savedIds.add(id);
    updateSavedControls();
    try { localStorage.setItem(listStorageKey, JSON.stringify([...savedIds])); } catch { /* Storage is optional. */ }
  }

  function renderList(removedProduct) {
    const savedProducts = listProducts.filter((product) => savedIds.has(product.id));
    const previousDraft = listDraft;
    const lines = savedProducts.map((product) => `- ${product.enquiryName}`);
    listDraft = `Hi, could you confirm availability and pack sizes for these items at Sardar - A Pure Meat Shop, Sector 67?\n\n${lines.join('\n')}`;
    if (!removedProduct || enquiryMessage.value === previousDraft) {
      enquiryMessage.value = listDraft;
    } else {
      enquiryMessage.value = enquiryMessage.value.split('\n').filter((line) => line !== `- ${removedProduct.enquiryName}`).join('\n');
    }
    enquiryItems.replaceChildren(...savedProducts.map((product, index) => {
      const row = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = product.enquiryName;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${product.enquiryName}`);
      remove.addEventListener('click', () => {
        toggleSaved(product.id);
        renderList(product);
        const next = enquiryItems.children[Math.min(index, enquiryItems.children.length - 1)];
        (next?.querySelector('button') || enquiryBrowse).focus();
      });
      row.append(name, remove);
      return row;
    }));
    enquiryItems.hidden = enquiryForm.hidden = savedProducts.length === 0;
    enquiryEmpty.hidden = savedProducts.length > 0;
  }

  function openEnquiry(product = null) {
    enquiryProduct = product;
    enquiryHeading.textContent = product ? `Ask about ${product.enquiryName}` : 'My list';
    enquiryMessage.setCustomValidity('');
    if (product) {
      enquiryItems.hidden = enquiryEmpty.hidden = true;
      enquiryForm.hidden = false;
      enquiryMessage.value = `Hi, could you confirm today’s availability and pack sizes for ${product.enquiryName} at Sardar - A Pure Meat Shop, Sector 67?`;
    } else {
      renderList();
    }
    enquiry.showModal();
    document.body.classList.add('detail-open');
  }

  for (const button of listButtons) {
    button.addEventListener('click', () => openEnquiry());
    button.hidden = false;
  }
  updateSavedControls();
  detailSave.addEventListener('click', () => toggleSaved(products[currentIndex].id));
  productDetail.querySelector('.detail-edit').addEventListener('click', () => openEnquiry(products[currentIndex]));
  enquiry.querySelector('.enquiry-close').addEventListener('click', () => enquiry.close());
  enquiryBrowse.addEventListener('click', () => {
    enquiry.close();
    catalogue.focus({ preventScroll: true });
  });
  enquiry.addEventListener('click', (event) => { if (event.target === enquiry) enquiry.close(); });
  enquiry.addEventListener('close', () => {
    if (!productDetail.open) document.body.classList.remove('detail-open');
  });
  enquiryMessage.addEventListener('input', () => enquiryMessage.setCustomValidity(''));
  enquiryForm.addEventListener('submit', (event) => {
    const message = enquiryMessage.value.trim();
    if (!message) {
      event.preventDefault();
      enquiryMessage.setCustomValidity('Enter the message you want to open in WhatsApp.');
      enquiryMessage.reportValidity();
      return;
    }
    enquiryMessage.value = message;
    recordAction('whatsapp_click', enquiryProduct ? {
      placement: 'product_detail',
      product: enquiryProduct.id,
      product_category: panels[enquiryProduct.group.categoryIndex].id,
      product_group: enquiryProduct.group.panel.id
    } : { placement: 'my_list', item_count: savedIds.size });
  });

  function setPhotoZoom(zoomed) {
    detailMedia.setAttribute('aria-pressed', String(zoomed));
    detailZoomLabel.textContent = zoomed ? 'Zoom out' : 'Zoom photo';
  }

  function openProduct(index, placement) {
    currentIndex = index;
    const product = products[index];
    const { group } = product;
    if (placement !== 'product_counter') {
      selectCategory(group.categoryIndex);
      selectGroup(group.categoryIndex, group);
    }
    detailTitle.textContent = product.name;
    detailCategory.textContent = panels[group.categoryIndex].id === 'heat-n-eat'
      ? `${group.categoryName} · ${group.name}`
      : group.name;
    detailDescription.textContent = product.description;
    detailMedia.hidden = !product.photo;
    if (product.photo) {
      detailPhoto.alt = product.photo.alt;
      detailPhoto.src = product.photo.currentSrc || product.photo.src;
      detailPhoto.style.objectPosition = product.photo.style.objectPosition;
    }
    setPhotoZoom(false);
    detailCount.textContent = `${product.groupPosition + 1} of ${group.productIndexes.length}`;
    updateSaveButton(detailSave, product);
    if (!productDetail.open) productDetail.showModal();
    document.body.classList.add('detail-open');
    recordAction('product_open', {
      product: product.id, product_category: panels[group.categoryIndex].id, product_group: group.panel.id, placement
    });
  }

  function stepProduct(offset) {
    const { group, groupPosition } = products[currentIndex];
    const indexes = group.productIndexes;
    const position = (groupPosition + offset + indexes.length) % indexes.length;
    const index = indexes[position];
    if (activeProductLink) {
      activeProductLink = products[index].hash;
      history.replaceState(history.state, '', activeProductLink);
    }
    openProduct(index, 'product_navigation');
    if (!detailMedia.hidden && !reducedMotion.matches) detailPhoto.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 180 });
  }

  function openProductFromLink() {
    const index = productLinks.get(location.hash);
    if (index === undefined) return;
    activeProductLink = location.hash;
    openProduct(index, 'product_link');
  }

  detailMedia.addEventListener('click', () => setPhotoZoom(detailMedia.getAttribute('aria-pressed') === 'false'));
  productDetail.querySelector('.detail-prev').addEventListener('click', () => stepProduct(-1));
  productDetail.querySelector('.detail-next').addEventListener('click', () => stepProduct(1));
  productDetail.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    stepProduct(event.key === 'ArrowRight' ? 1 : -1);
  });
  productDetail.querySelector('.detail-close').addEventListener('click', () => productDetail.close());
  productDetail.querySelector('.detail-browse').addEventListener('click', () => {
    productDetail.close();
    catalogue.focus({ preventScroll: true });
  });
  productDetail.addEventListener('click', (event) => {
    if (event.target === productDetail) productDetail.close();
  });
  productDetail.addEventListener('close', () => {
    if (!enquiry.open) document.body.classList.remove('detail-open');
    if (activeProductLink && location.hash === activeProductLink) {
      history.replaceState(history.state, '', products[currentIndex].group.link.hash);
    }
    activeProductLink = '';
    if (document.activeElement === document.body) products[currentIndex].openButton.focus();
  });

  openProductFromLink();
  window.addEventListener('hashchange', openProductFromLink);
}
