document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  const tagFilter = document.getElementById('tagFilter');
  const dateSort = document.getElementById('dateSort');
  const entriesContainer = document.getElementById('log-entries');
  const noResults = document.getElementById('no-results');
  const allEntries = Array.from(entriesContainer.querySelectorAll('.log-entry'));

  // --- 1. Populate Filters ---
  function populateTags() {
    const tags = new Set();
    allEntries.forEach(entry => {
      const entryTags = entry.dataset.tags.split(',');
      entryTags.forEach(tag => tags.add(tag.trim()));
    });

    tags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = `#${tag}`;
      tagFilter.appendChild(option);
    });
  }

  // --- 2. Filter and Sort Logic ---
  function filterAndSortEntries() {
    const searchQuery = searchInput.value.toLowerCase();
    const selectedTag = tagFilter.value;
    
    // First, filter
    let visibleEntries = 0;
    allEntries.forEach(entry => {
      const title = entry.querySelector('h3').textContent.toLowerCase();
      const tags = entry.dataset.tags.split(',');

      const searchMatch = title.includes(searchQuery);
      const tagMatch = (selectedTag === 'all') || tags.includes(selectedTag);

      if (searchMatch && tagMatch) {
        entry.style.display = 'block';
        visibleEntries++;
      } else {
        entry.style.display = 'none';
      }
    });

    // Show 'no results' message if needed
    noResults.style.display = visibleEntries === 0 ? 'block' : 'none';

    // Then, sort the visible entries
    const sortOrder = dateSort.value;
    const sortedEntries = Array.from(entriesContainer.children)
      .filter(el => el.style.display !== 'none' && el.classList.contains('log-entry'))
      .sort((a, b) => {
        const dateA = new Date(a.dataset.date);
        const dateB = new Date(b.dataset.date);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

    // Re-append sorted entries to the container
    sortedEntries.forEach(entry => entriesContainer.appendChild(entry));
  }

  // --- 3. Event Listeners ---
  // Entry expansion
  entriesContainer.addEventListener('click', (e) => {
    const header = e.target.closest('.entry-header');
    if (!header) return;

    const entry = header.parentElement;
    const isExpanded = entry.classList.toggle('expanded');
    header.querySelector('.expand-btn').setAttribute('aria-expanded', isExpanded);
  });

  // Filter controls
  searchInput.addEventListener('input', filterAndSortEntries);
  tagFilter.addEventListener('change', filterAndSortEntries);
  dateSort.addEventListener('change', filterAndSortEntries);

  // --- 4. Initialization ---
  function init() {
    // Add RGB values for CSS variables to be used in JS-driven styles
    // This is a small helper to make the tag colors work with themes
    const rootStyle = getComputedStyle(document.body);
    const primaryColor = rootStyle.getPropertyValue('--primary-color').trim();
    if (primaryColor.startsWith('#')) {
        const r = parseInt(primaryColor.slice(1, 3), 16);
        const g = parseInt(primaryColor.slice(3, 5), 16);
        const b = parseInt(primaryColor.slice(5, 7), 16);
        document.body.style.setProperty('--primary-color-rgb', `${r},${g},${b}`);
    }

    populateTags();
    filterAndSortEntries(); // Initial sort on page load
  }

  init();
});
