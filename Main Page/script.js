const searchInput = document.getElementById("mainSearchInput");
const searchResults = document.getElementById("searchResults");

const fuse = new Fuse(searchData, {
  keys: ["title", "module", "content"],
  threshold: 0.3,
  includeScore: true,
  ignoreLocation: true
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();

  searchResults.innerHTML = "";

  if (query === "") {
    searchResults.style.display = "none";
    return;
  }

  const results = fuse.search(query);

  if (results.length === 0) {
    searchResults.style.display = "block";
    searchResults.innerHTML =
      '<div class="no-results">No results found</div>';
    return;
  }

  searchResults.style.display = "block";

  results.slice(0, 5).forEach(result => {
    const item = result.item;

    const a = document.createElement("a");
    a.classList.add("search-result");
    a.href = item.url;

    a.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.module}</p>
    `;

    searchResults.appendChild(a);
  });
});

document.addEventListener("click", (e) => {
  if (
    !searchInput.contains(e.target) &&
    !searchResults.contains(e.target)
  ) {
    searchResults.style.display = "none";
  }
});