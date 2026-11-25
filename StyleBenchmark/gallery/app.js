(() => {
  const manifest = window.STYLE_MANIFEST || { styles: [] };
  const allStyles = manifest.styles || [];
  const completed = allStyles.filter((s) => s.status === 'completed');
  const failed = allStyles.filter((s) => s.status === 'failed');

  const statsBar = document.getElementById('statsBar');
  const searchInput = document.getElementById('searchInput');
  const engineSelect = document.getElementById('engineSelect');
  const sortSelect = document.getElementById('sortSelect');
  const categoryPills = document.getElementById('categoryPills');
  const galleryGrid = document.getElementById('galleryGrid');
  const compareStudio = document.getElementById('compareStudio');
  const compareGrid = document.getElementById('compareGrid');
  const compareCount = document.getElementById('compareCount');
  const cmpScrubber = document.getElementById('cmpScrubber');
  const cmpTimeLabel = document.getElementById('cmpTimeLabel');
  const cmpSpeed = document.getElementById('cmpSpeed');
  const toggleFailedBtn = document.getElementById('toggleFailedBtn');
  const failedDrawer = document.getElementById('failedDrawer');
  const failedList = document.getElementById('failedList');

  statsBar.textContent = `${completed.length} / ${allStyles.length} Styles Ready · ${failed.length} Unavailable`;

  if (failed.length > 0) {
    toggleFailedBtn.style.display = 'inline-block';
    document.getElementById('failedCount').textContent = String(failed.length);
    failedList.innerHTML = failed.map((f) => `<li><b>${f.name}</b> (${f.source_repo}): ${f.error || 'Unknown error'}</li>`).join('');
    toggleFailedBtn.onclick = () => {
      failedDrawer.style.display = failedDrawer.style.display === 'none' ? 'block' : 'none';
    };
  }

  let activeCategory = 'ALL';
  let activeEngine = 'ALL';
  let searchQuery = '';
  let sortMode = 'alpha';
  let pinnedIds = [];
  let activeAudioId = null;

  const engines = ['ALL', ...Array.from(new Set(completed.map((s) => s.source_repo))).sort()];
  engineSelect.innerHTML = engines.map((e) => `<option value="${e}">${e === 'ALL' ? 'All Engines' : e}</option>`).join('');

  const categories = ['ALL', ...Array.from(new Set(completed.map((s) => s.category))).sort()];
  function renderPills() {
    categoryPills.innerHTML = categories.map((c) => {
      const cnt = c === 'ALL' ? completed.length : completed.filter((s) => s.category === c).length;
      return `<button class="pill ${activeCategory === c ? 'active' : ''}" data-cat="${c}">${c === 'ALL' ? 'All Categories' : c} (${cnt})</button>`;
    }).join('');
    categoryPills.querySelectorAll('.pill').forEach((btn) => {
      btn.onclick = () => { activeCategory = btn.dataset.cat; renderPills(); renderGrid(); };
    });
  }

  function getFiltered() {
    const q = searchQuery.trim().toLowerCase();
    const list = completed.filter((s) => {
      if (activeCategory !== 'ALL' && s.category !== activeCategory) return false;
      if (activeEngine !== 'ALL' && s.source_repo !== activeEngine) return false;
      if (q) {
        const hay = `${s.name} ${s.id} ${s.source_repo} ${s.engine} ${s.category} ${s.medium_summary || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (sortMode === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (sortMode === 'engine') return a.source_repo.localeCompare(b.source_repo) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function renderCompare() {
    compareCount.textContent = `(${pinnedIds.length}/4 selected)`;
    compareStudio.classList.toggle('empty', pinnedIds.length === 0);
    if (pinnedIds.length === 0) {
      compareGrid.innerHTML = '';
      return;
    }
    if (!activeAudioId || !pinnedIds.includes(activeAudioId)) activeAudioId = pinnedIds[0];

    compareGrid.innerHTML = pinnedIds.map((id) => {
      const s = completed.find((x) => x.id === id);
      if (!s) return '';
      return `
        <div class="compare-slot" data-id="${s.id}">
          <div class="compare-slot-head">
            <span>${s.name}</span>
            <button class="btn-secondary remove-cmp" data-id="${s.id}" style="padding:2px 8px;font-size:11px">×</button>
          </div>
          <video class="cmp-video" src="../${s.video_path}" loop playsinline ${s.id === activeAudioId ? '' : 'muted'}></video>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;">
            <span>${s.source_repo}</span>
            <label><input type="radio" name="cmpAudio" value="${s.id}" ${s.id === activeAudioId ? 'checked' : ''} /> Audio</label>
          </div>
        </div>`;
    }).join('');

    const vids = Array.from(compareGrid.querySelectorAll('.cmp-video'));
    const rate = parseFloat(cmpSpeed.value || '1');
    vids.forEach((v) => { v.playbackRate = rate; v.currentTime = parseFloat(cmpScrubber.value); });

    compareGrid.querySelectorAll('.remove-cmp').forEach((b) => {
      b.onclick = () => { pinnedIds = pinnedIds.filter((x) => x !== b.dataset.id); renderCompare(); renderGrid(); };
    });
    compareGrid.querySelectorAll('input[name="cmpAudio"]').forEach((r) => {
      r.onchange = () => {
        activeAudioId = r.value;
        compareGrid.querySelectorAll('.compare-slot').forEach((slot) => {
          const v = slot.querySelector('video');
          if (v) v.muted = slot.dataset.id !== activeAudioId;
        });
      };
    });
  }

  function syncCompareTime(t) {
    const clamped = Math.max(0, Math.min(4.99, t));
    cmpScrubber.value = String(clamped);
    cmpTimeLabel.textContent = `${clamped.toFixed(2)}s / 5.00s`;
    compareGrid.querySelectorAll('.cmp-video').forEach((v) => { v.currentTime = clamped; });
  }

  document.getElementById('cmpPlayPause').onclick = () => {
    const vids = Array.from(compareGrid.querySelectorAll('.cmp-video'));
    if (!vids.length) return;
    const shouldPlay = vids[0].paused;
    const rate = parseFloat(cmpSpeed.value || '1');
    vids.forEach((v) => {
      v.playbackRate = rate;
      if (shouldPlay) v.play().catch(() => {});
      else v.pause();
    });
  };
  document.getElementById('cmpPrevFrame').onclick = () => {
    compareGrid.querySelectorAll('.cmp-video').forEach((v) => v.pause());
    syncCompareTime(parseFloat(cmpScrubber.value) - 1 / 30);
  };
  document.getElementById('cmpNextFrame').onclick = () => {
    compareGrid.querySelectorAll('.cmp-video').forEach((v) => v.pause());
    syncCompareTime(parseFloat(cmpScrubber.value) + 1 / 30);
  };
  cmpScrubber.oninput = () => {
    compareGrid.querySelectorAll('.cmp-video').forEach((v) => v.pause());
    syncCompareTime(parseFloat(cmpScrubber.value));
  };
  cmpSpeed.onchange = () => {
    const rate = parseFloat(cmpSpeed.value || '1');
    compareGrid.querySelectorAll('.cmp-video').forEach((v) => { v.playbackRate = rate; });
  };
  document.querySelectorAll('.phase-btn').forEach((b) => {
    b.onclick = () => {
      compareGrid.querySelectorAll('.cmp-video').forEach((v) => v.pause());
      syncCompareTime(parseFloat(b.dataset.t));
    };
  });
  document.getElementById('cmpClear').onclick = () => { pinnedIds = []; renderCompare(); renderGrid(); };

  function renderGrid() {
    const items = getFiltered();
    galleryGrid.innerHTML = items.map((s) => {
      const isPinned = pinnedIds.includes(s.id);
      return `
        <article class="card ${isPinned ? 'pinned' : ''}" data-id="${s.id}">
          <div class="media-box">
            <img src="../${s.preview_path}" alt="${s.name}" loading="lazy" />
            <span class="play-badge">▶ 5.0s</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${s.name}</h3>
            <div class="badges">
              <span class="badge">${s.source_repo}</span>
              <span class="badge cat">${s.category}</span>
            </div>
            <p class="card-desc">${s.medium_summary || ''}</p>
            <div class="card-actions">
              <button class="btn-secondary play-card" data-id="${s.id}">Play / Sound</button>
              <button class="${isPinned ? 'btn-primary' : 'btn-secondary'} pin-card" data-id="${s.id}">${isPinned ? 'Pinned' : '+ Compare'}</button>
            </div>
          </div>
        </article>`;
    }).join('');

    galleryGrid.querySelectorAll('.media-box').forEach((box) => {
      box.onclick = () => activateCardVideo(box.closest('.card'), true);
    });
    galleryGrid.querySelectorAll('.play-card').forEach((btn) => {
      btn.onclick = () => activateCardVideo(btn.closest('.card'), false);
    });
    galleryGrid.querySelectorAll('.pin-card').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (pinnedIds.includes(id)) pinnedIds = pinnedIds.filter((x) => x !== id);
        else if (pinnedIds.length < 4) pinnedIds.push(id);
        renderCompare();
        renderGrid();
      };
    });
  }

  function activateCardVideo(card, muted) {
    const id = card.dataset.id;
    const s = completed.find((x) => x.id === id);
    if (!s) return;
    const box = card.querySelector('.media-box');
    let vid = box.querySelector('video');
    if (!vid) {
      box.innerHTML = `<video src="../${s.video_path}" controls loop playsinline autoplay ${muted ? 'muted' : ''}></video>`;
    } else {
      vid.muted = muted;
      if (vid.paused) vid.play().catch(() => {});
      else vid.pause();
    }
  }

  searchInput.oninput = () => { searchQuery = searchInput.value; renderGrid(); };
  engineSelect.onchange = () => { activeEngine = engineSelect.value; renderGrid(); };
  sortSelect.onchange = () => { sortMode = sortSelect.value; renderGrid(); };

  renderPills();
  renderCompare();
  renderGrid();
})();
