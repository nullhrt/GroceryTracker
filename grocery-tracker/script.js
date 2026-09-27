document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('grocery-search-form');
  const searchInput = document.getElementById('site-search');
  const resultsContainer = document.getElementById('results');

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = searchInput.value.trim();
    if (!query) return;

    
    resultsContainer.innerHTML = '<p class="loading">Searching nearby stores from FIU MMC...</p>';

    try {
      const response = await fetch('/api/search-grocery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: query })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      renderResults(data);
    } catch (error) {
      console.error('Search request failed:', error);
      resultsContainer.innerHTML = '<p class="error">Unable to fetch grocery options right now. Please try again.</p>';
    }
  });

  function renderResults(data) {
    resultsContainer.innerHTML = '';

    if (!data.results || data.results.length === 0) {
      resultsContainer.innerHTML = '<p>No matching stores or products found nearby.</p>';
      return;
    }

    data.results.forEach((store) => {
      const card = document.createElement('article');
      card.className = 'store-card';

      // Build product list items
      const productListHtml = store.products
        ? store.products.map(item => `
            <li>
              <span>${item.name}</span>: 
              <strong>${item.estimatedPrice}</strong> 
              ${item.inStock !== undefined ? (item.inStock ? '(In Stock)' : '(Out of Stock)') : ''}
            </li>
          `).join('')
        : '';

      card.innerHTML = `
        <div class="store-header">
          <h3>${store.storeName}</h3>
          <span class="distance">${store.distanceMiles} miles from FIU MMC</span>
        </div>
        <p class="total-cost">Estimated Total: <strong>${store.estimatedTotalCost}</strong></p>
        <ul class="product-list">
          ${productListHtml}
        </ul>
      `;

      resultsContainer.appendChild(card);
    });
  }
});
