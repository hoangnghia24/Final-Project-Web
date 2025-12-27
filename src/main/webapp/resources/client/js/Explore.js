(function(){
  console.log('Explore.js ready');

  // Tabs behavior
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const kind = btn.dataset.kind;
      document.querySelectorAll('[data-section]').forEach(sec=>{
        sec.style.display = (sec.dataset.section === kind) ? '' : 'none';
      });
    });
  });

  // Topic chips selection (single-select)
  document.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click',()=>{
      const already = chip.classList.contains('active');
      document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      if(!already) chip.classList.add('active');
    });
  });

  // Load more mock
  const loadBtn = document.getElementById('exploreLoadMore');
  if (loadBtn) {
    loadBtn.addEventListener('click',()=>{
      loadBtn.disabled = true; loadBtn.textContent = 'Đang tải...';
      setTimeout(()=>{
        // Append a mock card
        const grid = document.querySelector('.cards-grid');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <img class="card-media" src="https://images.unsplash.com/photo-1542744095-291d1f67b221" alt="">
          <div class="card-body">
            <div class="card-title">Bài viết mới được đề xuất</div>
            <div class="card-meta">↑ 312 • 💬 42 • r/random</div>
          </div>`;
        grid.appendChild(card);
        loadBtn.disabled = false; loadBtn.textContent = 'Xem thêm';
      }, 800);
    });
  }
})();
