(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     DATA MODEL
  ═══════════════════════════════════════════════════════════════ */

  var ROUTES = {
    QN: { id: 'QN', name: 'Luồng Quy Nhơn', short: 'QN-Route' },
    VT: { id: 'VT', name: 'Luồng Vũng Tàu', short: 'VT-Route' },
    DN: { id: 'DN', name: 'Luồng Đà Nẵng', short: 'DN-Route' }
  };

  var ROUTE_POSITIONS = {
    QN: [
      { id: 'P0',  label: 'Vị trí 0-QN',  type: 'Cửa vào luồng',  lat: '13.759°N', lng: '109.21°E' },
      { id: 'P1',  label: 'Vị trí 1-QN',  type: 'Luồng chính',     lat: '13.761°N', lng: '109.21°E' },
      { id: 'P2',  label: 'Vị trí 2-QN',  type: 'Luồng chính',     lat: '13.762°N', lng: '109.22°E' },
      { id: 'P3',  label: 'Vị trí 3-QN',  type: 'Điểm rẽ luồng',   lat: '13.768°N', lng: '109.23°E' },
      { id: 'P3A', label: 'Vị trí 3A-QN', type: 'Luồng chính',     lat: '13.765°N', lng: '109.23°E' },
      { id: 'P4',  label: 'Vị trí 4-QN',  type: 'Luồng chính',     lat: '13.770°N', lng: '109.24°E' },
      { id: 'P5',  label: 'Vị trí 5-QN',  type: 'Khu vực bến cảng', lat: '13.775°N', lng: '109.24°E' },
      { id: 'P6',  label: 'Vị trí 6-QN',  type: 'Khu vực bến cảng', lat: '13.778°N', lng: '109.25°E' },
      { id: 'P7',  label: 'Vị trí 7-QN',  type: 'Khu vực bến cảng', lat: '13.782°N', lng: '109.24°E' },
      { id: 'P8',  label: 'Vị trí 8-QN',  type: 'Khu vực bến cảng', lat: '13.785°N', lng: '109.24°E' },
      { id: 'P9',  label: 'Vị trí 9-QN',  type: 'Khu vực bến cảng', lat: '13.788°N', lng: '109.25°E' },
      { id: 'P10', label: 'Vị trí 10-QN', type: 'Khu vực bến cảng', lat: '13.791°N', lng: '109.25°E' }
    ],
    VT: [
      { id: 'P0', label: 'Vị trí 0-VT', type: 'Cửa vào luồng',  lat: '10.359°N', lng: '107.07°E' },
      { id: 'P1', label: 'Vị trí 1-VT', type: 'Luồng chính',     lat: '10.361°N', lng: '107.07°E' },
      { id: 'P2', label: 'Vị trí 2-VT', type: 'Luồng chính',     lat: '10.362°N', lng: '107.08°E' },
      { id: 'P3', label: 'Vị trí 3-VT', type: 'Điểm rẽ luồng',   lat: '10.365°N', lng: '107.08°E' },
      { id: 'P4', label: 'Vị trí 4-VT', type: 'Khu vực bến cảng', lat: '10.368°N', lng: '107.09°E' },
      { id: 'P5', label: 'Vị trí 5-VT', type: 'Khu vực bến cảng', lat: '10.371°N', lng: '107.09°E' }
    ],
    DN: [
      { id: 'P0', label: 'Vị trí 0-DN', type: 'Cửa vào luồng',  lat: '16.071°N', lng: '108.22°E' },
      { id: 'P1', label: 'Vị trí 1-DN', type: 'Luồng chính',     lat: '16.073°N', lng: '108.23°E' },
      { id: 'P2', label: 'Vị trí 2-DN', type: 'Luồng chính',     lat: '16.075°N', lng: '108.23°E' },
      { id: 'P3', label: 'Vị trí 3-DN', type: 'Điểm rẽ luồng',   lat: '16.077°N', lng: '108.24°E' },
      { id: 'P4', label: 'Vị trí 4-DN', type: 'Khu vực bến cảng', lat: '16.079°N', lng: '108.24°E' }
    ]
  };

  // Slot state  key = routeId + '|' + posId
  var SLOTS = {
    'QN|P0':  { buoyId: 'D22.001', status: 'active',      battery: 100 },
    'QN|P1':  null,
    'QN|P2':  { buoyId: 'D22.005', status: 'active',      battery: 88  },
    'QN|P3':  { buoyId: 'D19.202', status: 'maintenance', battery: 15, maintNote: 'Pin yếu' },
    'QN|P3A': null,
    'QN|P4':  null,
    'QN|P5':  null,
    'QN|P6':  null,
    'QN|P7':  { buoyId: 'D22.108', status: 'active',      battery: 92  },
    'QN|P8':  null,
    'QN|P9':  null,
    'QN|P10': null
  };

  // Available inventory pool
  var INVENTORY = [
    { id: 'D24.015', type: 'Phao nổi năng lượng MT', model: 'LED-300',  status: 'ready',   location: 'Kho khu vực A-12', battery: 95  },
    { id: 'D24.088', type: 'Phao thép thông thường',   model: 'Thông thường', status: 'inspect', location: 'Kho khu vực B-04', battery: 60  },
    { id: 'X12.004', type: 'Phao nhựa composite',      model: 'LED-100',  status: 'ready',   location: 'Kho khu vực B-02', battery: 88  },
    { id: 'B09.221', type: 'Phao trụ nổi (Spar)',      model: 'Chuẩn',    status: 'ready',   location: 'Kho khu vực C-11', battery: 100 },
    { id: 'D22.099', type: 'Phao nổi năng lượng MT',   model: 'LED-300',  status: 'ready',   location: 'Kho khu vực A-04', battery: 78  },
    { id: 'T26.055', type: 'Phao thép',                model: 'LED-200',  status: 'ready',   location: 'Kho khu vực B-11', battery: 91  }
  ];

  // Maintenance dock
  var MAINTENANCE_DOCK = [
    { id: 'D19.202', reason: 'Pin yếu', since: '20/02/2026', tech: 'Nguyễn V. An' }
  ];

  // History log
  var HISTORY_LOG = [
    { time: '26/02/2026 09:15', actor: 'Admin',        action: 'DEPLOY',      buoyId: 'D22.001', from: 'Kho',              to: 'Luồng QN / Vị trí 0-QN', note: '',              color: '#22c55e' },
    { time: '25/02/2026 14:30', actor: 'Trần T. Bình', action: 'MAINTENANCE', buoyId: 'D19.202', from: 'Luồng QN / Vị trí 3-QN', to: 'Bãi sửa chữa',    note: 'Pin yếu',       color: '#ef4444' },
    { time: '24/02/2026 11:00', actor: 'Lê V. Cường',  action: 'DEPLOY',      buoyId: 'D22.108', from: 'Kho',              to: 'Luồng QN / Vị trí 7-QN', note: '',              color: '#22c55e' },
    { time: '23/02/2026 08:45', actor: 'Admin',        action: 'DEPLOY',      buoyId: 'D22.005', from: 'Kho',              to: 'Luồng QN / Vị trí 2-QN', note: '',              color: '#22c55e' },
    { time: '22/02/2026 16:20', actor: 'Phạm V. Đức',  action: 'RELOCATE',    buoyId: 'T26.016', from: 'Luồng VT / Vị trí 1-VT', to: 'Luồng QN / Vị trí 0-QN', note: 'Tái phân bổ', color: '#8b5cf6' }
  ];

  /* ═══════════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════════ */

  var currentRoute = 'QN';

  var dragState = {
    active: false,
    buoyId: null,
    fromSourceType: null, // 'inventory' | 'slot'
    fromSlotKey: null,
    buoyObj: null,
    selectMode: false,
    selectBuoyId: null,
    selectFromKey: null,
    selectBuoyObj: null
  };

  var pendingDeploy = null;
  var pendingReloc  = null;
  var pendingMaint  = null;

  var undoSnapshot  = null;
  var undoTimeout   = null;

  /* ═══════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════ */

  document.addEventListener('DOMContentLoaded', function () {

    /* ── Screen navigation ── */
    var btnDispatch = document.getElementById('btnDispatchView');
    var btnBack     = document.getElementById('dpBtnBack');
    var mainContent = document.querySelector('.container-fluid.px-4.pb-5');
    var timeScreen  = document.getElementById('timelineScreen');
    var dispScreen  = document.getElementById('dispatchScreen');

    if (btnDispatch) {
      btnDispatch.addEventListener('click', function () {
        if (mainContent) mainContent.classList.add('d-none');
        if (timeScreen)  timeScreen.classList.add('d-none');
        dispScreen.classList.remove('d-none');
        initFlatpickrDispatch();
        renderAll();
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', function () {
        dispScreen.classList.add('d-none');
        if (mainContent) mainContent.classList.remove('d-none');
        cancelSelectMode();
      });
    }

    /* ── Route selector ── */
    var routeSel = document.getElementById('dpRouteSelect');
    if (routeSel) {
      routeSel.addEventListener('change', function () {
        currentRoute = routeSel.value;
        cancelSelectMode();
        renderGrid();
        renderStats();
      });
    }

    /* ── Inventory search & filter ── */
    var searchInp = document.getElementById('dpSearchInv');
    if (searchInp) {
      searchInp.addEventListener('input', function () { renderInventory(); });
    }

    document.querySelectorAll('.dp-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.dp-filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderInventory();
      });
    });

    /* ── History offcanvas ── */
    var btnHistory = document.getElementById('dpBtnHistory');
    if (btnHistory) {
      btnHistory.addEventListener('click', function () {
        renderHistoryList();
        new bootstrap.Offcanvas(document.getElementById('dpHistoryOffcanvas')).show();
      });
    }
    var histSearch = document.getElementById('dpHistorySearch');
    if (histSearch) {
      histSearch.addEventListener('input', renderHistoryList);
    }

    /* ── Save button ── */
    var saveBtn = document.getElementById('dpBtnSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        showToast('Đã lưu thay đổi thành công!', false);
      });
    }

    /* ── Modal confirms ── */
    var deployBtn = document.getElementById('dpDeployConfirmBtn');
    if (deployBtn) deployBtn.addEventListener('click', confirmDeploy);

    var relocBtn = document.getElementById('dpRelocConfirmBtn');
    if (relocBtn) relocBtn.addEventListener('click', confirmReloc);

    var maintBtn = document.getElementById('dpMaintConfirmBtn');
    if (maintBtn) maintBtn.addEventListener('click', confirmMaint);

    /* ── Undo ── */
    var undoBtn = document.getElementById('dpUndoBtn');
    if (undoBtn) undoBtn.addEventListener('click', doUndo);

    /* ── Dock drop zone ── */
    setupDockDrop();

    /* ── Keyboard shortcuts ── */
    document.addEventListener('keydown', function (e) {
      if (document.getElementById('dispatchScreen').classList.contains('d-none')) return;
      if (e.key === 'Escape') {
        cancelSelectMode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (undoSnapshot) { e.preventDefault(); doUndo(); }
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     FLATPICKR
  ═══════════════════════════════════════════════════════════════ */

  function initFlatpickrDispatch() {
    ['dpDeployDate', 'dpRelocDate', 'dpMaintDate'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el._flatpickr) {
        flatpickr(el, { locale: 'vn', dateFormat: 'd/m/Y', defaultDate: 'today' });
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — TOP LEVEL
  ═══════════════════════════════════════════════════════════════ */

  function renderAll() {
    renderInventory();
    renderGrid();
    renderStats();
    renderZones();
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — INVENTORY
  ═══════════════════════════════════════════════════════════════ */

  function renderInventory() {
    var searchQ   = ((document.getElementById('dpSearchInv') || {}).value || '').toLowerCase().trim();
    var filterEl  = document.querySelector('.dp-filter-btn.active');
    var filterVal = filterEl ? filterEl.dataset.filter : 'all';

    var filtered = INVENTORY.filter(function (b) {
      if (searchQ && b.id.toLowerCase().indexOf(searchQ) < 0 && b.type.toLowerCase().indexOf(searchQ) < 0) return false;
      if (filterVal === 'ready'   && b.status !== 'ready')   return false;
      if (filterVal === 'inspect' && b.status !== 'inspect') return false;
      return true;
    });

    var html = '';
    if (filtered.length === 0) {
      html = '<div class="text-muted text-center py-4" style="font-size:.82rem;">Không có phao nào khớp.</div>';
    } else {
      filtered.forEach(function (b) {
        var badgeCls   = b.status === 'ready' ? 'dp-badge-ready' : (b.status === 'inspect' ? 'dp-badge-inspect' : 'dp-badge-maintenance');
        var badgeLbl   = b.status === 'ready' ? 'SẴN SÀNG' : (b.status === 'inspect' ? 'CẦN KIỂM TRA' : 'SỬA CHỮA');
        var draggable  = b.status !== 'maintenance';
        var batColor   = b.battery > 50 ? '#22c55e' : (b.battery > 20 ? '#f59e0b' : '#ef4444');

        html +=
          '<div class="dp-buoy-card' + (draggable ? '' : ' disabled-card') + '" ' +
            'data-buoy-id="' + b.id + '"' +
            (draggable ? ' draggable="true"' : '') + '>' +
            '<div class="dp-buoy-card-top">' +
              '<div class="dp-buoy-id"><i class="bi bi-broadcast text-primary" style="font-size:.8rem;"></i>' + b.id + '</div>' +
              '<span class="dp-badge ' + badgeCls + '">' + badgeLbl + '</span>' +
            '</div>' +
            '<div class="dp-buoy-type">' + b.type + ' / ' + b.model + '</div>' +
            '<div class="dp-buoy-loc"><i class="bi bi-geo-alt-fill text-danger" style="font-size:.7rem;"></i> ' + b.location + '</div>' +
            '<div style="margin-top:6px;">' +
              '<div style="height:3px;background:#e2e8f0;border-radius:2px;overflow:hidden;">' +
                '<div style="width:' + b.battery + '%;height:100%;background:' + batColor + ';border-radius:2px;"></div>' +
              '</div>' +
              '<div style="font-size:.65rem;color:#94a3b8;margin-top:2px;">Pin: ' + b.battery + '%</div>' +
            '</div>' +
            (draggable ?
              '<div class="dp-inv-actions">' +
                '<button class="dp-inv-btn dp-inv-btn-deploy" data-buoy-id="' + b.id + '"><i class="bi bi-send-plus"></i> Lắp đặt</button>' +
                '<button class="dp-inv-btn dp-inv-btn-maint" data-buoy-id="' + b.id + '"><i class="bi bi-tools"></i> Sửa chữa</button>' +
              '</div>' : '') +
          '</div>';
      });
    }

    var list = document.getElementById('dpInvList');
    if (list) list.innerHTML = html;

    var cnt = document.getElementById('dpInvCount');
    if (cnt) cnt.textContent = 'Hiển thị ' + filtered.length + ' / ' + INVENTORY.length + ' phao';

    // Bind events
    document.querySelectorAll('#dpInvList .dp-buoy-card[draggable="true"]').forEach(function (card) {
      card.addEventListener('dragstart', function (e) { onInvDragStart(e, card); });
      card.addEventListener('dragend',   onDragEnd);
      card.addEventListener('click',     function () { onInvCardClick(card); });
    });

    // Inventory action buttons
    document.querySelectorAll('#dpInvList .dp-inv-btn-deploy').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var bId = btn.dataset.buoyId;
        var bObj = INVENTORY.find(function (b) { return b.id === bId; });
        if (!bObj) return;
        startSelectMode(bId, null, 'deploy');
        showToast('Chọn vị trí trống để lắp đặt phao ' + bId + '. Nhấn Esc để hủy.', false);
      });
    });

    document.querySelectorAll('#dpInvList .dp-inv-btn-maint').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var bId = btn.dataset.buoyId;
        pendingMaint = { buoyId: bId, slotKey: null };
        openMaintModal(bId, null);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — ROUTE GRID
  ═══════════════════════════════════════════════════════════════ */

  function renderGrid() {
    var positions = ROUTE_POSITIONS[currentRoute] || [];
    var html = '';
    positions.forEach(function (pos) {
      var key  = currentRoute + '|' + pos.id;
      var slot = SLOTS[key] || null;
      html += buildSlotCard(pos, key, slot);
    });
    var grid = document.getElementById('dpPosGrid');
    if (grid) {
      grid.innerHTML = html;
      bindSlotEvents();
    }
  }

  function buildSlotCard(pos, slotKey, slot) {
    if (!slot) {
      return (
        '<div class="dp-slot slot-empty" ' +
          'data-slot-key="' + slotKey + '">' +
          '<div class="dp-slot-header">' +
            '<div>' +
              '<div class="dp-slot-pos">' + pos.label + '</div>' +
              '<div class="dp-slot-type">' + pos.type + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="dp-slot-empty-indicator">' +
            '<i class="bi bi-plus-circle"></i>' +
            '<div>Vị trí trống</div>' +
            '<div style="font-size:.65rem;opacity:.7;">Kéo thả hoặc nhấn để lắp đặt</div>' +
          '</div>' +
        '</div>'
      );
    }

    var isMaint     = slot.status === 'maintenance';
    var slotClass   = isMaint ? 'dp-slot slot-maintenance' : 'dp-slot has-buoy';
    var statusColor = isMaint ? '#ef4444' : '#22c55e';
    var statusLabel = isMaint ? 'ĐANG SỬA CHỮA' : ('Hoạt động · ' + slot.battery + '%');
    var batColor    = slot.battery > 50 ? '#22c55e' : (slot.battery > 20 ? '#f59e0b' : '#ef4444');

    return (
      '<div class="' + slotClass + '" ' +
        'data-slot-key="' + slotKey + '"' +
        (!isMaint ? ' draggable="true"' : '') + '>' +

        (isMaint ? '<div class="dp-maint-badge">' + (slot.maintNote || 'Sửa chữa') + '</div>' : '') +

        '<div class="dp-slot-header">' +
          '<div>' +
            '<div class="dp-slot-pos">' + pos.label + '</div>' +
            '<div class="dp-slot-type">' + pos.type + '</div>' +
          '</div>' +
          (!isMaint ?
            '<button class="dp-remove-btn" data-slot-key="' + slotKey + '" ' +
              'title="Thu hồi phao" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1rem;line-height:1;padding:0;">×</button>'
            : '') +
        '</div>' +

        '<div class="dp-slot-buoy-id">' +
          (isMaint
            ? '<i class="bi bi-exclamation-triangle-fill text-danger" style="font-size:.8rem;"></i> '
            : '<i class="bi bi-broadcast text-primary" style="font-size:.8rem;"></i> ') +
          slot.buoyId +
        '</div>' +

        '<div class="dp-slot-buoy-sub" style="color:' + statusColor + ';margin-bottom:4px;">' + statusLabel + '</div>' +

        '<div style="margin-bottom:4px;">' +
          '<div style="height:3px;background:#e2e8f0;border-radius:2px;overflow:hidden;">' +
            '<div style="width:' + slot.battery + '%;height:100%;background:' + batColor + ';border-radius:2px;"></div>' +
          '</div>' +
        '</div>' +

        '<div class="dp-slot-coords">' +
          '<i class="bi bi-geo-fill" style="font-size:.6rem;"></i> ' + pos.lat + ', ' + pos.lng +
        '</div>' +

        '<div class="dp-slot-actions">' +
          (!isMaint
            ? '<button class="dp-slot-btn dp-btn-reloc" data-slot-key="' + slotKey + '"><i class="bi bi-arrow-left-right"></i> Đổi vị trí</button>'
            : '') +
          '<button class="dp-slot-btn danger dp-btn-maint" data-slot-key="' + slotKey + '">' +
            (isMaint ? '<i class="bi bi-tools"></i> Đang bảo trì' : '<i class="bi bi-tools"></i> Sửa chữa') +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function bindSlotEvents() {
    // Drop targets
    document.querySelectorAll('.dp-slot').forEach(function (el) {
      el.addEventListener('dragover',  function (e) { onSlotDragOver(e, el); });
      el.addEventListener('dragleave', function ()  { onSlotDragLeave(el); });
      el.addEventListener('drop',      function (e) { onSlotDrop(e, el); });
    });

    // Draggable filled slots (relocate via drag)
    document.querySelectorAll('.dp-slot[draggable="true"]').forEach(function (el) {
      el.addEventListener('dragstart', function (e) { onSlotDragStart(e, el); });
      el.addEventListener('dragend',   onDragEnd);
    });

    // Remove (recall) buttons
    document.querySelectorAll('.dp-remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        recallSlot(btn.dataset.slotKey);
      });
    });

    // Maintenance action buttons
    document.querySelectorAll('.dp-btn-maint').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var key  = btn.dataset.slotKey;
        var slot = SLOTS[key];
        if (!slot) return;
        if (slot.status === 'maintenance') {
          showWarn('Phao này đã đang trong bãi sửa chữa rồi.');
          return;
        }
        pendingMaint = { buoyId: slot.buoyId, slotKey: key };
        openMaintModal(slot.buoyId, key);
      });
    });

    // Relocate buttons
    document.querySelectorAll('.dp-btn-reloc').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var key  = btn.dataset.slotKey;
        var slot = SLOTS[key];
        if (!slot) return;
        startSelectMode(slot.buoyId, key, 'reloc');
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CLICK-TO-SELECT MODE
  ═══════════════════════════════════════════════════════════════ */

  function startSelectMode(buoyId, fromKey, purpose) {
    cancelSelectMode();
    dragState.selectMode    = true;
    dragState.selectBuoyId  = buoyId;
    dragState.selectFromKey = fromKey;
    dragState.selectPurpose = purpose; // 'deploy' | 'reloc'

    document.querySelectorAll('.dp-slot.slot-empty').forEach(function (s) {
      s.classList.add('dp-select-target');
      s.addEventListener('click', onEmptySlotClickSelect);
    });

    showToast('Click vào vị trí muốn chuyển đến. Nhấn Esc để hủy.', false);
  }

  function cancelSelectMode() {
    dragState.selectMode = false;
    document.querySelectorAll('.dp-slot.slot-empty').forEach(function (s) {
      s.classList.remove('dp-select-target');
      s.removeEventListener('click', onEmptySlotClickSelect);
    });
    document.querySelectorAll('.dp-buoy-card').forEach(function (c) { c.classList.remove('selected'); });
  }

  function onEmptySlotClickSelect(e) {
    if (!dragState.selectMode) return;
    var toKey    = this.dataset.slotKey;
    var toParts  = toKey.split('|');
    var fromKey  = dragState.selectFromKey;
    var buoyId   = dragState.selectBuoyId;
    cancelSelectMode();

    if (!fromKey) {
      // From inventory → deploy
      var bObj = INVENTORY.find(function (b) { return b.id === buoyId; });
      openDeployModal(buoyId, bObj, toParts[0], toParts[1], null);
    } else {
      var fromParts = fromKey.split('|');
      if (fromParts[0] === toParts[0]) {
        // Same route → internal move (treated as redeploy)
        var slotObj = SLOTS[fromKey];
        openDeployModal(buoyId, slotObj ? { type: 'Active', model: '--', battery: slotObj.battery } : {}, toParts[0], toParts[1], fromKey);
      } else {
        // Cross‑route relocation
        openRelocModal(buoyId, fromParts[0], fromParts[1], toParts[0], toParts[1]);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — STATS
  ═══════════════════════════════════════════════════════════════ */

  function renderStats() {
    var positions = ROUTE_POSITIONS[currentRoute] || [];
    var total = positions.length, active = 0, empty = 0;
    positions.forEach(function (pos) {
      var s = SLOTS[currentRoute + '|' + pos.id];
      if (!s)                        empty++;
      else if (s.status !== 'maintenance') active++;
    });
    var el;
    if ((el = document.getElementById('dpStatTotal')))  el.textContent = total  + ' vị trí ·';
    if ((el = document.getElementById('dpStatActive'))) el.textContent = active + ' có phao ·';
    if ((el = document.getElementById('dpStatEmpty')))  el.textContent = empty  + ' trống';
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — ZONES (Dock + Warehouse)
  ═══════════════════════════════════════════════════════════════ */

  function renderZones() {
    var dockHtml = '';
    MAINTENANCE_DOCK.forEach(function (b) {
      dockHtml +=
        '<div class="dp-zone-chip maintenance-chip">' +
          '<i class="bi bi-exclamation-triangle-fill"></i>' +
          '<div>' +
            '<div style="font-weight:800;font-size:.78rem;">' + b.id + '</div>' +
            '<div style="font-size:.65rem;opacity:.75;">' + b.reason + ' · ' + b.since + '</div>' +
          '</div>' +
        '</div>';
    });
    if (!dockHtml) dockHtml = '<div class="text-muted" style="font-size:.75rem;padding:6px 0;">Không có phao đang sửa chữa</div>';
    var dockEl = document.getElementById('dpDockChips');
    if (dockEl) dockEl.innerHTML = dockHtml;

    var whHtml = '';
    INVENTORY.forEach(function (b) {
      if (b.location.toLowerCase().indexOf('kho') >= 0) {
        whHtml +=
          '<div class="dp-zone-chip warehouse-chip">' +
            '<i class="bi bi-box-seam"></i>' +
            '<div>' +
              '<div style="font-weight:800;font-size:.78rem;">' + b.id + '</div>' +
              '<div style="font-size:.65rem;opacity:.75;">' + b.location.replace('Kho ', '') + '</div>' +
            '</div>' +
          '</div>';
      }
    });
    if (!whHtml) whHtml = '<div class="text-muted" style="font-size:.75rem;padding:6px 0;">Không có phao trong kho</div>';
    var whEl = document.getElementById('dpWarehouseChips');
    if (whEl) whEl.innerHTML = whHtml;
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER — HISTORY LIST
  ═══════════════════════════════════════════════════════════════ */

  function renderHistoryList() {
    var q = ((document.getElementById('dpHistorySearch') || {}).value || '').toLowerCase();
    var filtered = HISTORY_LOG.filter(function (e) {
      return !q || e.buoyId.toLowerCase().indexOf(q) >= 0 || e.action.toLowerCase().indexOf(q) >= 0;
    });

    var labels = { DEPLOY: 'Điều phối', RECALL: 'Thu hồi', RELOCATE: 'Đổi luồng', MAINTENANCE: 'Đưa bảo trì' };
    var html = '';
    if (!filtered.length) {
      html = '<div class="text-muted text-center py-4" style="font-size:.82rem;">Không có lịch sử.</div>';
    } else {
      filtered.forEach(function (e) {
        html +=
          '<div class="dp-history-entry d-flex gap-2">' +
            '<div class="dp-history-dot" style="background:' + e.color + ';width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;"></div>' +
            '<div>' +
              '<div class="dp-history-action">' +
                (labels[e.action] || e.action) + ' <strong class="text-primary">' + e.buoyId + '</strong>' +
              '</div>' +
              '<div style="font-size:.78rem;color:#475569;">' + e.from + ' → ' + e.to +
                (e.note ? ' · ' + e.note : '') + '</div>' +
              '<div class="dp-history-meta">' + e.time + ' · ' + e.actor + '</div>' +
            '</div>' +
          '</div>';
      });
    }
    var listEl = document.getElementById('dpHistoryList');
    if (listEl) listEl.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════════════════════
     DRAG & DROP — INVENTORY → SLOT
  ═══════════════════════════════════════════════════════════════ */

  function onInvDragStart(e, card) {
    var buoyId = card.dataset.buoyId;
    dragState.active         = true;
    dragState.buoyId         = buoyId;
    dragState.fromSourceType = 'inventory';
    dragState.fromSlotKey    = null;
    dragState.buoyObj        = INVENTORY.find(function (b) { return b.id === buoyId; });
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', buoyId);
    showDragGhost(buoyId);
  }

  /* ═══════════════════════════════════════════════════════════════
     DRAG & DROP — SLOT → SLOT
  ═══════════════════════════════════════════════════════════════ */

  function onSlotDragStart(e, slotEl) {
    var key  = slotEl.dataset.slotKey;
    var slot = SLOTS[key];
    if (!slot || slot.status === 'maintenance') { e.preventDefault(); return; }
    dragState.active         = true;
    dragState.buoyId         = slot.buoyId;
    dragState.fromSourceType = 'slot';
    dragState.fromSlotKey    = key;
    dragState.buoyObj        = { type: 'Active', model: '--', battery: slot.battery };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.buoyId);
    showDragGhost(slot.buoyId + ' · Relocation');
  }

  /* ═══════════════════════════════════════════════════════════════
     DRAG & DROP — DRAGOVER / DRAGLEAVE / DROP
  ═══════════════════════════════════════════════════════════════ */

  function onSlotDragOver(e, slotEl) {
    e.preventDefault();
    if (!dragState.active) return;
    if (!slotEl.classList.contains('slot-empty')) {
      slotEl.classList.add('drag-over-invalid');
      e.dataTransfer.dropEffect = 'none';
    } else {
      slotEl.classList.remove('drag-over-invalid');
      slotEl.classList.add('drag-over-valid');
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function onSlotDragLeave(slotEl) {
    slotEl.classList.remove('drag-over-valid', 'drag-over-invalid');
  }

  function onSlotDrop(e, slotEl) {
    e.preventDefault();
    slotEl.classList.remove('drag-over-valid', 'drag-over-invalid');
    if (!dragState.active) return;

    if (!slotEl.classList.contains('slot-empty')) {
      showWarn('Vị trí này đã có phao! Vui lòng chọn vị trí trống.');
      onDragEnd();
      return;
    }

    var toKey   = slotEl.dataset.slotKey;
    var toParts = toKey.split('|');

    if (dragState.fromSourceType === 'inventory') {
      openDeployModal(dragState.buoyId, dragState.buoyObj, toParts[0], toParts[1], null);
    } else if (dragState.fromSourceType === 'slot') {
      var fromParts = dragState.fromSlotKey.split('|');
      if (fromParts[0] === toParts[0]) {
        openDeployModal(dragState.buoyId, dragState.buoyObj, toParts[0], toParts[1], dragState.fromSlotKey);
      } else {
        openRelocModal(dragState.buoyId, fromParts[0], fromParts[1], toParts[0], toParts[1]);
      }
    }
    onDragEnd();
  }

  function onDragEnd() {
    dragState.active = false;
    hideDragGhost();
    document.querySelectorAll('.dp-buoy-card').forEach(function (c) { c.classList.remove('dragging'); });
    document.querySelectorAll('.dp-slot').forEach(function (s) {
      s.classList.remove('drag-over-valid', 'drag-over-invalid');
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     DOCK DROP ZONE
  ═══════════════════════════════════════════════════════════════ */

  function setupDockDrop() {
    var dockDrop = document.getElementById('dpDockDrop');
    if (!dockDrop) return;

    dockDrop.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (dragState.active && dragState.fromSourceType === 'slot') {
        dockDrop.classList.add('drag-over-valid');
        e.dataTransfer.dropEffect = 'move';
      }
    });
    dockDrop.addEventListener('dragleave', function () {
      dockDrop.classList.remove('drag-over-valid');
    });
    dockDrop.addEventListener('drop', function (e) {
      e.preventDefault();
      dockDrop.classList.remove('drag-over-valid');
      if (!dragState.active || dragState.fromSourceType !== 'slot') return;
      pendingMaint = { buoyId: dragState.buoyId, slotKey: dragState.fromSlotKey };
      onDragEnd();
      openMaintModal(pendingMaint.buoyId, pendingMaint.slotKey);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     OPEN MODALS
  ═══════════════════════════════════════════════════════════════ */

  function openDeployModal(buoyId, buoyObj, toRouteId, toPosId, fromSlotKey) {
    var positions = ROUTE_POSITIONS[toRouteId] || [];
    var posObj    = positions.find(function (p) { return p.id === toPosId; });
    var routeObj  = ROUTES[toRouteId];
    pendingDeploy = { buoyId: buoyId, buoyObj: buoyObj, toRouteId: toRouteId, toPosId: toPosId, fromSlotKey: fromSlotKey };

    var el;
    if ((el = document.getElementById('dpDeployBuoyId')))   el.textContent = buoyId;
    if ((el = document.getElementById('dpDeployBuoyType'))) el.textContent = buoyObj ? ((buoyObj.type || '--') + ' / ' + (buoyObj.model || '--')) : '---';
    if ((el = document.getElementById('dpDeployPos')))      el.textContent = posObj  ? posObj.label  : toPosId;
    if ((el = document.getElementById('dpDeployRoute')))    el.textContent = routeObj ? routeObj.name : toRouteId;
    if ((el = document.getElementById('dpDeployActor')))    el.value = '';
    if ((el = document.getElementById('dpDeployNote')))     el.value = '';

    new bootstrap.Modal(document.getElementById('dpDeployModal')).show();
  }

  function openRelocModal(buoyId, fromRouteId, fromPosId, toRouteId, toPosId) {
    var fromSlot = SLOTS[fromRouteId + '|' + fromPosId];
    if (fromSlot && fromSlot.status === 'maintenance') {
      showWarn('Không thể điều phối phao đang bảo trì. Hoàn thành bảo trì trước.');
      return;
    }
    var fromRoute = ROUTES[fromRouteId];
    var toRoute   = ROUTES[toRouteId];
    var fromPos   = (ROUTE_POSITIONS[fromRouteId] || []).find(function (p) { return p.id === fromPosId; });
    var toPos     = (ROUTE_POSITIONS[toRouteId]   || []).find(function (p) { return p.id === toPosId;   });
    pendingReloc = { buoyId: buoyId, fromRouteId: fromRouteId, fromPosId: fromPosId, toRouteId: toRouteId, toPosId: toPosId };

    var el;
    if ((el = document.getElementById('dpRelocBuoyId')))    el.textContent = buoyId;
    if ((el = document.getElementById('dpRelocFromRoute'))) el.textContent = fromRoute ? fromRoute.short : fromRouteId;
    if ((el = document.getElementById('dpRelocFromPos')))   el.textContent = fromPos   ? fromPos.label   : fromPosId;
    if ((el = document.getElementById('dpRelocToRoute')))   el.textContent = toRoute   ? toRoute.short   : toRouteId;
    if ((el = document.getElementById('dpRelocToPos')))     el.textContent = toPos     ? toPos.label     : toPosId;
    if ((el = document.getElementById('dpRelocReason')))    el.value = '';

    new bootstrap.Modal(document.getElementById('dpRelocateModal')).show();
  }

  function openMaintModal(buoyId, slotKey) {
    var parts  = (slotKey || '').split('|');
    var posObj = parts[1] ? (ROUTE_POSITIONS[parts[0]] || []).find(function (p) { return p.id === parts[1]; }) : null;
    var loc    = posObj ? ((ROUTES[parts[0]] ? ROUTES[parts[0]].short + ' / ' : '') + posObj.label) : 'Kho / Inventory';

    var el;
    if ((el = document.getElementById('dpMaintBuoyId')))  el.textContent = buoyId;
    if ((el = document.getElementById('dpMaintBuoyLoc'))) el.textContent = loc;
    document.querySelectorAll('input[name="dpMaintReason"]').forEach(function (r) { r.checked = false; });
    if ((el = document.getElementById('dpMaintOther'))) el.value = '';
    if ((el = document.getElementById('dpMaintTech')))  el.value = '';

    new bootstrap.Modal(document.getElementById('dpMaintModal')).show();
  }

  /* ═══════════════════════════════════════════════════════════════
     CONFIRM ACTIONS
  ═══════════════════════════════════════════════════════════════ */

  function confirmDeploy() {
    if (!pendingDeploy) return;
    var modal = bootstrap.Modal.getInstance(document.getElementById('dpDeployModal'));
    if (modal) modal.hide();

    var actor = (document.getElementById('dpDeployActor').value || 'Admin').trim();
    var note  = (document.getElementById('dpDeployNote').value  || '').trim();

    saveSnapshot();

    // Clear source
    if (pendingDeploy.fromSlotKey) {
      SLOTS[pendingDeploy.fromSlotKey] = null;
    } else {
      var idx = -1;
      INVENTORY.forEach(function (b, i) { if (b.id === pendingDeploy.buoyId) idx = i; });
      if (idx >= 0) INVENTORY.splice(idx, 1);
    }

    // Place in new slot
    SLOTS[pendingDeploy.toRouteId + '|' + pendingDeploy.toPosId] = {
      buoyId:  pendingDeploy.buoyId,
      status:  'active',
      battery: pendingDeploy.buoyObj ? (pendingDeploy.buoyObj.battery || 100) : 100
    };

    var fromLbl = pendingDeploy.fromSlotKey ? pendingDeploy.fromSlotKey.replace('|', '/') : 'Warehouse';
    var toLbl   = (ROUTES[pendingDeploy.toRouteId] ? ROUTES[pendingDeploy.toRouteId].short : pendingDeploy.toRouteId) +
                  ' / ' + (ROUTE_POSITIONS[pendingDeploy.toRouteId] || []).reduce(function (acc, p) {
                    return p.id === pendingDeploy.toPosId ? p.label : acc;
                  }, pendingDeploy.toPosId);

    addHistory('DEPLOY', pendingDeploy.buoyId, fromLbl, toLbl, note, actor, '#22c55e');
    var bid = pendingDeploy.buoyId;
    pendingDeploy = null;
    renderAll();
    showUndoToast('✓ Điều phối ' + bid + ' thành công!');
  }

  function confirmReloc() {
    if (!pendingReloc) return;
    var modal = bootstrap.Modal.getInstance(document.getElementById('dpRelocateModal'));
    if (modal) modal.hide();

    var reason = (document.getElementById('dpRelocReason').value || '').trim();
    saveSnapshot();

    var fromKey = pendingReloc.fromRouteId + '|' + pendingReloc.fromPosId;
    var toKey   = pendingReloc.toRouteId   + '|' + pendingReloc.toPosId;
    var slot    = SLOTS[fromKey];

    SLOTS[toKey]  = { buoyId: slot.buoyId, status: 'active', battery: slot.battery };
    SLOTS[fromKey] = null;

    var fromLbl = (ROUTES[pendingReloc.fromRouteId] ? ROUTES[pendingReloc.fromRouteId].short : pendingReloc.fromRouteId) + ' / ' + pendingReloc.fromPosId;
    var toLbl   = (ROUTES[pendingReloc.toRouteId]   ? ROUTES[pendingReloc.toRouteId].short   : pendingReloc.toRouteId)   + ' / ' + pendingReloc.toPosId;

    addHistory('RECALL',   slot.buoyId, fromLbl, fromLbl, 'Thu hồi để đổi luồng', 'Admin', '#f59e0b');
    addHistory('RELOCATE', slot.buoyId, fromLbl, toLbl,   reason,                  'Admin', '#8b5cf6');
    var bid = slot.buoyId;
    pendingReloc = null;
    renderAll();
    showUndoToast('✓ Đổi luồng ' + bid + ' thành công!');
  }

  function confirmMaint() {
    if (!pendingMaint) return;
    var reasonEl = document.querySelector('input[name="dpMaintReason"]:checked');
    if (!reasonEl) { showWarn('Vui lòng chọn lý do bảo trì.'); return; }
    var reason = reasonEl.value === 'other'
      ? ((document.getElementById('dpMaintOther').value || 'Khác').trim())
      : reasonEl.value;
    var tech = (document.getElementById('dpMaintTech').value || 'Admin').trim();

    var modal = bootstrap.Modal.getInstance(document.getElementById('dpMaintModal'));
    if (modal) modal.hide();

    saveSnapshot();

    if (pendingMaint.slotKey) SLOTS[pendingMaint.slotKey] = null;

    var idx = -1;
    INVENTORY.forEach(function (b, i) { if (b.id === pendingMaint.buoyId) idx = i; });
    if (idx >= 0) INVENTORY.splice(idx, 1);

    MAINTENANCE_DOCK.push({ id: pendingMaint.buoyId, reason: reason, since: todayStr(), tech: tech });

    var fromLbl = pendingMaint.slotKey ? pendingMaint.slotKey.replace('|', '/') : 'Inventory';
    addHistory('MAINTENANCE', pendingMaint.buoyId, fromLbl, 'Maintenance Dock', reason, tech, '#ef4444');
    var bid = pendingMaint.buoyId;
    pendingMaint = null;
    renderAll();
    showUndoToast('✓ Đã đưa ' + bid + ' vào bảo trì!');
  }

  function recallSlot(slotKey) {
    var slot = SLOTS[slotKey];
    if (!slot) return;
    saveSnapshot();
    var parts = slotKey.split('|');
    var fromLbl = (ROUTES[parts[0]] ? ROUTES[parts[0]].short : parts[0]) + '/' + parts[1];
    INVENTORY.push({ id: slot.buoyId, type: 'Recalled', model: '--', status: 'inspect', location: 'Warehouse (Thu hồi)', battery: slot.battery });
    SLOTS[slotKey] = null;
    addHistory('RECALL', slot.buoyId, fromLbl, 'Warehouse', 'Thu hồi thủ công', 'Admin', '#f59e0b');
    var bid = slot.buoyId;
    renderAll();
    showUndoToast('✓ Đã thu hồi phao ' + bid + '!');
  }

  /* ═══════════════════════════════════════════════════════════════
     INVENTORY CARD CLICK (click-then-click assignment)
  ═══════════════════════════════════════════════════════════════ */

  function onInvCardClick(card) {
    var buoyId = card.dataset.buoyId;
    var bObj   = INVENTORY.find(function (b) { return b.id === buoyId; });
    if (!bObj || bObj.status === 'maintenance') return;

    var wasSelected = card.classList.contains('selected');
    cancelSelectMode();
    if (wasSelected) return;

    card.classList.add('selected');
    startSelectMode(buoyId, null, 'deploy');
    dragState.selectBuoyObj = bObj;
  }

  /* ═══════════════════════════════════════════════════════════════
     UNDO
  ═══════════════════════════════════════════════════════════════ */

  function saveSnapshot() {
    undoSnapshot = {
      slots:      JSON.parse(JSON.stringify(SLOTS)),
      inventory:  JSON.parse(JSON.stringify(INVENTORY)),
      dock:       JSON.parse(JSON.stringify(MAINTENANCE_DOCK)),
      historyLen: HISTORY_LOG.length
    };
  }

  function doUndo() {
    if (!undoSnapshot) return;

    Object.keys(SLOTS).forEach(function (k) { delete SLOTS[k]; });
    Object.assign(SLOTS, undoSnapshot.slots);

    INVENTORY.length = 0;
    undoSnapshot.inventory.forEach(function (b) { INVENTORY.push(b); });

    MAINTENANCE_DOCK.length = 0;
    undoSnapshot.dock.forEach(function (b) { MAINTENANCE_DOCK.push(b); });

    var len = undoSnapshot.historyLen;
    HISTORY_LOG.splice(0, HISTORY_LOG.length - len);

    undoSnapshot = null;
    clearTimeout(undoTimeout);
    hideUndoToast();
    renderAll();
    showToast('Đã hoàn tác thành công!', false);
  }

  /* ═══════════════════════════════════════════════════════════════
     TOAST & WARNINGS
  ═══════════════════════════════════════════════════════════════ */

  function showUndoToast(msg) {
    var toast = document.getElementById('dpUndoToast');
    var msgEl = document.getElementById('dpUndoMsg');
    var bar   = document.getElementById('dpUndoBarInner');
    if (!toast) return;
    if (msgEl) msgEl.textContent = msg;
    toast.classList.add('show');
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      setTimeout(function () {
        bar.style.transition = 'width 10s linear';
        bar.style.width = '0%';
      }, 60);
    }
    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(function () {
      hideUndoToast();
      undoSnapshot = null;
    }, 10000);
  }

  function hideUndoToast() {
    var toast = document.getElementById('dpUndoToast');
    if (toast) toast.classList.remove('show');
    clearTimeout(undoTimeout);
  }

  function showToast(msg, isErr) {
    var el = document.createElement('div');
    el.className = 'dp-flash-toast';
    el.style.cssText =
      'position:fixed;top:88px;right:20px;z-index:9999;' +
      'background:' + (isErr ? '#ef4444' : '#22c55e') + ';' +
      'color:#fff;padding:12px 20px;border-radius:10px;' +
      'font-weight:700;font-size:.84rem;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.2);' +
      'animation:fadeIn .3s ease;max-width:340px;';
    el.textContent = (isErr ? '⚠ ' : '✓ ') + msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
  }

  function showWarn(msg) { showToast(msg, true); }

  /* ═══════════════════════════════════════════════════════════════
     DRAG GHOST
  ═══════════════════════════════════════════════════════════════ */

  function showDragGhost(label) {
    var ghost = document.getElementById('dpDragGhost');
    if (!ghost) return;
    ghost.textContent = '✦ ' + label;
    ghost.style.display = 'block';
    document.addEventListener('dragover', moveDragGhost);
  }

  function moveDragGhost(e) {
    var ghost = document.getElementById('dpDragGhost');
    if (!ghost) return;
    ghost.style.left = (e.clientX + 14) + 'px';
    ghost.style.top  = (e.clientY + 10)  + 'px';
  }

  function hideDragGhost() {
    var ghost = document.getElementById('dpDragGhost');
    if (ghost) ghost.style.display = 'none';
    document.removeEventListener('dragover', moveDragGhost);
  }

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════ */

  function todayStr() {
    var d = new Date();
    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear()
    ].join('/');
  }

  function addHistory(action, buoyId, from, to, note, actor, color) {
    var d   = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var ts  = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
              ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    HISTORY_LOG.unshift({ time: ts, actor: actor, action: action, buoyId: buoyId, from: from, to: to, note: note || '', color: color });
  }

})();
