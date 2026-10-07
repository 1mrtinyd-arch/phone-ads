const grid = document.getElementById("pk-grid");
PHONES.forEach((p) => {
  const a = document.createElement("a");
  a.className = "card";
  a.href = `ad.html?p=${p.id}`;
  a.style.cssText = `--frame:${p.frame};--wall:${p.wall};--r:${p.r}px;--ink:${p.ink || "#fff"}`;
  a.innerHTML = `<div class="mini p-${p.punch}"><i></i></div><h3>${p.name}</h3><small>${p.brand} · ${p.display}</small><span class="go">▶ Play ad</span>`;
  grid.appendChild(a);
});
