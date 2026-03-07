// ═══════════════════════════════════════════════════
// ADMIN PHAO — Modern JS (API + Pagination + UI)
// ═══════════════════════════════════════════════════

var API = '/api/admin-phao';
var PAGE_SIZE = 20;

// ── State ──
var _data = { tinhThanh: [], donVi: [], tram: [], tuyenLuong: [], viTri: [] };
var _search = { tinhThanh: '', donVi: '', tram: '', tuyenLuong: '', viTri: '' };
var _page = { tinhThanh: 1, donVi: 1, tram: 1, tuyenLuong: 1, viTri: 1 };

// Breadcrumb labels
var _sectionLabels = {
    secOverview: 'Tổng Quan',
    secTinhThanh: 'Tỉnh / Thành Phố',
    secDonVi: 'Đơn Vị',
    secTram: 'Trạm Quản Lý',
    secTuyenLuong: 'Tuyến Luồng',
    secViTri: 'Vị Trí Phao BH'
};

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════

function showToast(msg, type) {
    type = type || 'success';
    var c = document.getElementById('toastContainer');
    var el = document.createElement('div');
    el.className = 'toast-custom ' + type;
    el.innerHTML = '<i class="bi ' + (type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-x-circle' : 'bi-info-circle') + ' me-2"></i>' + msg;
    c.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }, 3500);
}

function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function intVal(id) { var v = val(id); return v ? parseInt(v, 10) : null; }
function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = v != null ? v : ''; }
function showErr(id, msg) { var el = document.getElementById(id); if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; } }
function escHtml(s) { if (!s) return ''; var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

function statusBadge(s) {
    if (s === 'Hoạt động') return '<span class="badge-status badge-active">' + s + '</span>';
    if (s === 'Ngừng sử dụng') return '<span class="badge-status badge-locked">' + s + '</span>';
    return '<span class="badge-status">' + (s || '') + '</span>';
}

function loadingHtml(cols) {
    return '<tr><td colspan="' + cols + '"><div class="ap-loading"><div class="ap-spinner"></div><span>Đang tải dữ liệu...</span></div></td></tr>';
}

function emptyHtml(cols, icon, text) {
    return '<tr><td colspan="' + cols + '"><div class="ap-empty"><i class="bi ' + icon + '"></i><span>' + text + '</span></div></td></tr>';
}

// ═══════════════════════════════════════════
// SECTION NAV + BREADCRUMB
// ═══════════════════════════════════════════

function switchSection(sectionId) {
    document.querySelectorAll('.ap-section').forEach(function (s) { s.classList.remove('active'); });
    document.querySelectorAll('.ap-nav-item[data-section]').forEach(function (l) { l.classList.remove('active'); });
    var sec = document.getElementById(sectionId);
    var link = document.querySelector('.ap-nav-item[data-section="' + sectionId + '"]');
    if (sec) sec.classList.add('active');
    if (link) link.classList.add('active');
    // Update breadcrumb
    var bc = document.getElementById('breadcrumbCurrent');
    if (bc && _sectionLabels[sectionId]) bc.textContent = _sectionLabels[sectionId];
}

// ═══════════════════════════════════════════
// SEARCH + PAGINATION HELPERS
// ═══════════════════════════════════════════

function searchTable(key, query) {
    _search[key] = (query || '').toLowerCase();
    _page[key] = 1;
    renderMap[key]();
}

function goPage(key, p) {
    _page[key] = p;
    renderMap[key]();
}

function filterData(key, matchFn) {
    var q = _search[key];
    if (!q) return _data[key];
    return _data[key].filter(function (x) { return matchFn(x).toLowerCase().indexOf(q) >= 0; });
}

function paginate(list, page) {
    var total = Math.ceil(list.length / PAGE_SIZE) || 1;
    if (page > total) page = total;
    var start = (page - 1) * PAGE_SIZE;
    return { items: list.slice(start, start + PAGE_SIZE), page: page, total: total, count: list.length, start: start };
}

function renderPagination(containerId, key, pg) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (pg.count <= PAGE_SIZE) { el.innerHTML = ''; return; }

    var from = pg.start + 1;
    var to = Math.min(pg.start + PAGE_SIZE, pg.count);
    var html = '<div class="ap-pg-info">Hiển thị ' + from + '–' + to + ' / ' + pg.count + ' bản ghi</div>';
    html += '<div class="ap-pg-btns">';
    html += '<button class="ap-pg-btn" ' + (pg.page <= 1 ? 'disabled' : 'onclick="goPage(\'' + key + '\',' + (pg.page - 1) + ')"') + '><i class="bi bi-chevron-left"></i></button>';

    var maxVisible = 5;
    var startP = Math.max(1, pg.page - Math.floor(maxVisible / 2));
    var endP = Math.min(pg.total, startP + maxVisible - 1);
    if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);

    if (startP > 1) {
        html += '<button class="ap-pg-btn" onclick="goPage(\'' + key + '\',1)">1</button>';
        if (startP > 2) html += '<span class="ap-pg-btn" style="border:none;cursor:default">…</span>';
    }
    for (var i = startP; i <= endP; i++) {
        html += '<button class="ap-pg-btn' + (i === pg.page ? ' active' : '') + '" onclick="goPage(\'' + key + '\',' + i + ')">' + i + '</button>';
    }
    if (endP < pg.total) {
        if (endP < pg.total - 1) html += '<span class="ap-pg-btn" style="border:none;cursor:default">…</span>';
        html += '<button class="ap-pg-btn" onclick="goPage(\'' + key + '\',' + pg.total + ')">' + pg.total + '</button>';
    }

    html += '<button class="ap-pg-btn" ' + (pg.page >= pg.total ? 'disabled' : 'onclick="goPage(\'' + key + '\',' + (pg.page + 1) + ')"') + '><i class="bi bi-chevron-right"></i></button>';
    html += '</div>';
    el.innerHTML = html;
}

// ═══════════════════════════════════════════
// THỐNG KÊ
// ═══════════════════════════════════════════

function loadStats() {
    fetch(API + '/thong-ke').then(function (r) { return r.json(); }).then(function (d) {
        document.getElementById('statPhao').textContent = d.tongPhao;
        document.getElementById('statTuyen').textContent = d.tongTuyenLuong;
        document.getElementById('statViTri').textContent = d.tongViTri;
        document.getElementById('statTram').textContent = d.tongTram;
        document.getElementById('statDonVi').textContent = d.tongDonVi;
    });
}

// ═══════════════════════════════════════════
// DM TỈNH / THÀNH PHỐ
// ═══════════════════════════════════════════

function loadTinhThanh() {
    document.getElementById('tinhThanhBody').innerHTML = loadingHtml(6);
    fetch(API + '/tinh-thanh').then(function (r) { return r.json(); }).then(function (list) {
        _data.tinhThanh = list;
        _page.tinhThanh = 1;
        renderTinhThanh();
    });
}

function renderTinhThanh() {
    var filtered = filterData('tinhThanh', function (x) { return x.maTinh + ' ' + x.tenTinh; });
    var pg = paginate(filtered, _page.tinhThanh);
    _page.tinhThanh = pg.page;
    var tb = document.getElementById('tinhThanhBody');
    if (!filtered.length) {
        tb.innerHTML = emptyHtml(6, 'bi-geo-alt', _data.tinhThanh.length ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu tỉnh / thành phố');
        document.getElementById('pgTinhThanh').innerHTML = '';
        return;
    }
    tb.innerHTML = pg.items.map(function (x, i) {
        return '<tr>' +
            '<td class="text-center">' + (pg.start + i + 1) + '</td>' +
            '<td><code>' + escHtml(x.maTinh) + '</code></td>' +
            '<td>' + escHtml(x.tenTinh) + '</td>' +
            '<td class="text-center">' + (x.thuTuHienThi != null ? x.thuTuHienThi : '') + '</td>' +
            '<td>' + statusBadge(x.trangThai) + '</td>' +
            '<td><button class="ap-btn-edit" onclick="editTinhThanh(' + x.id + ')"><i class="bi bi-pencil-square"></i> Sửa</button></td>' +
            '</tr>';
    }).join('');
    renderPagination('pgTinhThanh', 'tinhThanh', pg);
}

function editTinhThanh(id) {
    var x = _data.tinhThanh.find(function (d) { return d.id === id; });
    if (!x) return;
    setVal('ttId', x.id); setVal('ttMaTinh', x.maTinh); setVal('ttTenTinh', x.tenTinh); setVal('ttThuTu', x.thuTuHienThi);
    document.getElementById('modalTinhThanhTitle').textContent = 'Chỉnh Sửa Tỉnh / Thành Phố';
    showErr('ttError', '');
    new bootstrap.Modal(document.getElementById('modalTinhThanh')).show();
}

function saveTinhThanh() {
    showErr('ttError', '');
    var id = val('ttId');
    var body = { maTinh: val('ttMaTinh'), tenTinh: val('ttTenTinh'), thuTuHienThi: intVal('ttThuTu') };
    var url = API + '/tinh-thanh' + (id ? '?id=' + id : '');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) { showErr('ttError', res.data.error || 'Lỗi'); return; }
            bootstrap.Modal.getInstance(document.getElementById('modalTinhThanh')).hide();
            showToast(id ? 'Cập nhật thành công' : 'Thêm mới thành công');
            loadTinhThanh(); loadStats();
        });
}

// ═══════════════════════════════════════════
// DM ĐƠN VỊ
// ═══════════════════════════════════════════

function loadDonVi() {
    document.getElementById('donViBody').innerHTML = loadingHtml(9);
    fetch(API + '/don-vi').then(function (r) { return r.json(); }).then(function (list) {
        _data.donVi = list;
        _page.donVi = 1;
        renderDonVi();
        populateDonViDropdown();
    });
}

function renderDonVi() {
    var filtered = filterData('donVi', function (x) { return x.maDonVi + ' ' + x.tenDonVi + ' ' + (x.loaiDonVi || ''); });
    var pg = paginate(filtered, _page.donVi);
    _page.donVi = pg.page;
    var tb = document.getElementById('donViBody');
    if (!filtered.length) {
        tb.innerHTML = emptyHtml(9, 'bi-building', _data.donVi.length ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu đơn vị');
        document.getElementById('pgDonVi').innerHTML = '';
        return;
    }
    tb.innerHTML = pg.items.map(function (x, i) {
        return '<tr>' +
            '<td class="text-center">' + (pg.start + i + 1) + '</td>' +
            '<td><code>' + escHtml(x.maDonVi) + '</code></td>' +
            '<td>' + escHtml(x.tenDonVi) + '</td>' +
            '<td>' + escHtml(x.loaiDonVi || '') + '</td>' +
            '<td class="small">' + escHtml(x.diaChi || '') + '</td>' +
            '<td>' + escHtml(x.soDienThoai || '') + '</td>' +
            '<td class="text-center">' + (x.thuTuHienThi != null ? x.thuTuHienThi : '') + '</td>' +
            '<td>' + statusBadge(x.trangThai) + '</td>' +
            '<td><button class="ap-btn-edit" onclick="editDonVi(' + x.id + ')"><i class="bi bi-pencil-square"></i> Sửa</button></td>' +
            '</tr>';
    }).join('');
    renderPagination('pgDonVi', 'donVi', pg);
}

function populateDonViDropdown() {
    var sel = document.getElementById('tramDonViId');
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '<option value="">— Không —</option>' + _data.donVi.map(function (x) {
        return '<option value="' + x.id + '">' + escHtml(x.tenDonVi) + '</option>';
    }).join('');
    if (current) sel.value = current;
}

function editDonVi(id) {
    var x = _data.donVi.find(function (d) { return d.id === id; });
    if (!x) return;
    setVal('dvId', x.id); setVal('dvMaDonVi', x.maDonVi); setVal('dvTenDonVi', x.tenDonVi);
    setVal('dvLoaiDonVi', x.loaiDonVi); setVal('dvDiaChi', x.diaChi);
    setVal('dvSoDienThoai', x.soDienThoai); setVal('dvThuTu', x.thuTuHienThi);
    document.getElementById('modalDonViTitle').textContent = 'Chỉnh Sửa Đơn Vị';
    showErr('dvError', '');
    new bootstrap.Modal(document.getElementById('modalDonVi')).show();
}

function saveDonVi() {
    showErr('dvError', '');
    var id = val('dvId');
    var body = {
        maDonVi: val('dvMaDonVi'), tenDonVi: val('dvTenDonVi'),
        loaiDonVi: val('dvLoaiDonVi') || null, diaChi: val('dvDiaChi') || null,
        soDienThoai: val('dvSoDienThoai') || null, thuTuHienThi: intVal('dvThuTu')
    };
    var url = API + '/don-vi' + (id ? '?id=' + id : '');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) { showErr('dvError', res.data.error || 'Lỗi'); return; }
            bootstrap.Modal.getInstance(document.getElementById('modalDonVi')).hide();
            showToast(id ? 'Cập nhật thành công' : 'Thêm mới thành công');
            loadDonVi(); loadStats();
        });
}

// ═══════════════════════════════════════════
// DM TRẠM QUẢN LÝ
// ═══════════════════════════════════════════

function loadTram() {
    document.getElementById('tramBody').innerHTML = loadingHtml(9);
    fetch(API + '/tram').then(function (r) { return r.json(); }).then(function (list) {
        _data.tram = list;
        _page.tram = 1;
        renderTram();
    });
}

function renderTram() {
    var filtered = filterData('tram', function (x) { return x.maTram + ' ' + x.tenTram + ' ' + (x.tenDonViChuQuan || ''); });
    var pg = paginate(filtered, _page.tram);
    _page.tram = pg.page;
    var tb = document.getElementById('tramBody');
    if (!filtered.length) {
        tb.innerHTML = emptyHtml(9, 'bi-broadcast-pin', _data.tram.length ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu trạm quản lý');
        document.getElementById('pgTram').innerHTML = '';
        return;
    }
    tb.innerHTML = pg.items.map(function (x, i) {
        return '<tr>' +
            '<td class="text-center">' + (pg.start + i + 1) + '</td>' +
            '<td><code>' + escHtml(x.maTram) + '</code></td>' +
            '<td>' + escHtml(x.tenTram) + '</td>' +
            '<td>' + escHtml(x.tenDonViChuQuan || '') + '</td>' +
            '<td class="small">' + escHtml(x.diaDiem || '') + '</td>' +
            '<td>' + escHtml(x.soDienThoai || '') + '</td>' +
            '<td class="text-center">' + (x.thuTuHienThi != null ? x.thuTuHienThi : '') + '</td>' +
            '<td>' + statusBadge(x.trangThai) + '</td>' +
            '<td><button class="ap-btn-edit" onclick="editTram(' + x.id + ')"><i class="bi bi-pencil-square"></i> Sửa</button></td>' +
            '</tr>';
    }).join('');
    renderPagination('pgTram', 'tram', pg);
}

function editTram(id) {
    var x = _data.tram.find(function (d) { return d.id === id; });
    if (!x) return;
    populateDonViDropdown();
    setVal('tramId', x.id); setVal('tramMaTram', x.maTram); setVal('tramTenTram', x.tenTram);
    setVal('tramDonViId', x.donViChuQuanId || ''); setVal('tramDiaDiem', x.diaDiem);
    setVal('tramSoDienThoai', x.soDienThoai); setVal('tramThuTu', x.thuTuHienThi);
    document.getElementById('modalTramTitle').textContent = 'Chỉnh Sửa Trạm Quản Lý';
    showErr('tramError', '');
    new bootstrap.Modal(document.getElementById('modalTram')).show();
}

function saveTram() {
    showErr('tramError', '');
    var id = val('tramId');
    var donViId = intVal('tramDonViId');
    var body = {
        maTram: val('tramMaTram'), tenTram: val('tramTenTram'),
        donViChuQuanId: donViId, diaDiem: val('tramDiaDiem') || null,
        soDienThoai: val('tramSoDienThoai') || null, thuTuHienThi: intVal('tramThuTu')
    };
    var url = API + '/tram' + (id ? '?id=' + id : '');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) { showErr('tramError', res.data.error || 'Lỗi'); return; }
            bootstrap.Modal.getInstance(document.getElementById('modalTram')).hide();
            showToast(id ? 'Cập nhật thành công' : 'Thêm mới thành công');
            loadTram(); loadStats();
        });
}

// ═══════════════════════════════════════════
// DM TUYẾN LUỒNG
// ═══════════════════════════════════════════

function loadTuyenLuong() {
    document.getElementById('tuyenBody').innerHTML = loadingHtml(8);
    fetch(API + '/tuyen-luong').then(function (r) { return r.json(); }).then(function (list) {
        _data.tuyenLuong = list;
        _page.tuyenLuong = 1;
        renderTuyenLuong();
        populateTuyenDropdowns();
    });
}

function renderTuyenLuong() {
    var filtered = filterData('tuyenLuong', function (x) { return x.maTuyen + ' ' + x.tenTuyen; });
    var pg = paginate(filtered, _page.tuyenLuong);
    _page.tuyenLuong = pg.page;
    var tb = document.getElementById('tuyenBody');
    if (!filtered.length) {
        tb.innerHTML = emptyHtml(8, 'bi-signpost-split', _data.tuyenLuong.length ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu tuyến luồng');
        document.getElementById('pgTuyenLuong').innerHTML = '';
        return;
    }
    tb.innerHTML = pg.items.map(function (x, i) {
        return '<tr>' +
            '<td class="text-center">' + (pg.start + i + 1) + '</td>' +
            '<td><code>' + escHtml(x.maTuyen) + '</code></td>' +
            '<td>' + escHtml(x.tenTuyen) + '</td>' +
            '<td class="small">' + escHtml(x.moTa || '') + '</td>' +
            '<td class="text-center"><span class="badge bg-primary bg-opacity-10 text-primary fw-bold">' + x.soViTri + '</span></td>' +
            '<td class="text-center">' + (x.thuTuHienThi != null ? x.thuTuHienThi : '') + '</td>' +
            '<td>' + statusBadge(x.trangThai) + '</td>' +
            '<td><button class="ap-btn-edit" onclick="editTuyenLuong(' + x.id + ')"><i class="bi bi-pencil-square"></i> Sửa</button></td>' +
            '</tr>';
    }).join('');
    renderPagination('pgTuyenLuong', 'tuyenLuong', pg);
}

function populateTuyenDropdowns() {
    var opts = '<option value="">— Chọn tuyến luồng —</option>' + _data.tuyenLuong.map(function (x) {
        return '<option value="' + x.id + '">' + escHtml(x.tenTuyen) + ' (' + escHtml(x.maTuyen) + ')</option>';
    }).join('');
    var filter = document.getElementById('viTriTuyenFilter');
    var modal = document.getElementById('vtTuyenLuongId');
    if (filter) { var cv = filter.value; filter.innerHTML = opts; if (cv) filter.value = cv; }
    if (modal) { var cv2 = modal.value; modal.innerHTML = opts; if (cv2) modal.value = cv2; }
}

function editTuyenLuong(id) {
    var x = _data.tuyenLuong.find(function (d) { return d.id === id; });
    if (!x) return;
    setVal('tlId', x.id); setVal('tlMaTuyen', x.maTuyen); setVal('tlTenTuyen', x.tenTuyen);
    setVal('tlMoTa', x.moTa); setVal('tlThuTu', x.thuTuHienThi);
    document.getElementById('modalTuyenLuongTitle').textContent = 'Chỉnh Sửa Tuyến Luồng';
    showErr('tlError', '');
    new bootstrap.Modal(document.getElementById('modalTuyenLuong')).show();
}

function saveTuyenLuong() {
    showErr('tlError', '');
    var id = val('tlId');
    var body = {
        maTuyen: val('tlMaTuyen'), tenTuyen: val('tlTenTuyen'),
        moTa: val('tlMoTa') || null, thuTuHienThi: intVal('tlThuTu')
    };
    var url = API + '/tuyen-luong' + (id ? '?id=' + id : '');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) { showErr('tlError', res.data.error || 'Lỗi'); return; }
            bootstrap.Modal.getInstance(document.getElementById('modalTuyenLuong')).hide();
            showToast(id ? 'Cập nhật thành công' : 'Thêm mới thành công');
            loadTuyenLuong(); loadStats();
        });
}

// ═══════════════════════════════════════════
// DM VỊ TRÍ PHAO BH
// ═══════════════════════════════════════════

function loadViTri() {
    var tuyenId = val('viTriTuyenFilter');
    var tb = document.getElementById('viTriBody');
    if (!tuyenId) {
        _data.viTri = [];
        tb.innerHTML = emptyHtml(9, 'bi-funnel', 'Chọn tuyến luồng để xem danh sách');
        document.getElementById('pgViTri').innerHTML = '';
        return;
    }
    tb.innerHTML = loadingHtml(9);
    fetch(API + '/vi-tri?tuyenLuongId=' + tuyenId).then(function (r) { return r.json(); }).then(function (list) {
        _data.viTri = list;
        _page.viTri = 1;
        _search.viTri = '';
        var si = document.getElementById('searchViTri');
        if (si) si.value = '';
        renderViTri();
    });
}

function renderViTri() {
    var filtered = filterData('viTri', function (x) { return x.soViTri + ' ' + x.maPhaoBH + ' ' + (x.tenTuyen || ''); });
    var pg = paginate(filtered, _page.viTri);
    _page.viTri = pg.page;
    var tb = document.getElementById('viTriBody');
    if (!filtered.length) {
        tb.innerHTML = emptyHtml(9, 'bi-pin-map', _data.viTri.length ? 'Không tìm thấy kết quả' : 'Không có vị trí nào thuộc tuyến này');
        document.getElementById('pgViTri').innerHTML = '';
        return;
    }
    tb.innerHTML = pg.items.map(function (x, i) {
        return '<tr>' +
            '<td class="text-center">' + (pg.start + i + 1) + '</td>' +
            '<td>' + escHtml(x.tenTuyen || '') + '</td>' +
            '<td><strong>' + escHtml(x.soViTri) + '</strong></td>' +
            '<td><code>' + escHtml(x.maPhaoBH) + '</code></td>' +
            '<td class="small">' + escHtml(x.toaDoThietKe || '') + '</td>' +
            '<td class="small">' + escHtml(x.moTa || '') + '</td>' +
            '<td class="text-center">' + (x.thuTuHienThi != null ? x.thuTuHienThi : '') + '</td>' +
            '<td>' + statusBadge(x.trangThai) + '</td>' +
            '<td><button class="ap-btn-edit" onclick="editViTri(' + x.id + ')"><i class="bi bi-pencil-square"></i> Sửa</button></td>' +
            '</tr>';
    }).join('');
    renderPagination('pgViTri', 'viTri', pg);
}

function editViTri(id) {
    var x = _data.viTri.find(function (d) { return d.id === id; });
    if (!x) return;
    populateTuyenDropdowns();
    setVal('vtId', x.id); setVal('vtTuyenLuongId', x.tuyenLuongId);
    setVal('vtSoViTri', x.soViTri); setVal('vtMaPhaoBH', x.maPhaoBH);
    setVal('vtToaDo', x.toaDoThietKe); setVal('vtMoTa', x.moTa);
    setVal('vtThuTu', x.thuTuHienThi);
    document.getElementById('modalViTriTitle').textContent = 'Chỉnh Sửa Vị Trí Phao BH';
    showErr('vtError', '');
    new bootstrap.Modal(document.getElementById('modalViTri')).show();
}

function saveViTri() {
    showErr('vtError', '');
    var id = val('vtId');
    var body = {
        tuyenLuongId: intVal('vtTuyenLuongId') || 0,
        soViTri: val('vtSoViTri'), maPhaoBH: val('vtMaPhaoBH'),
        toaDoThietKe: val('vtToaDo') || null, moTa: val('vtMoTa') || null,
        thuTuHienThi: intVal('vtThuTu')
    };
    var url = API + '/vi-tri' + (id ? '?id=' + id : '');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) { showErr('vtError', res.data.error || 'Lỗi'); return; }
            bootstrap.Modal.getInstance(document.getElementById('modalViTri')).hide();
            showToast(id ? 'Cập nhật thành công' : 'Thêm mới thành công');
            loadViTri(); loadStats();
        });
}

// ═══════════════════════════════════════════
// MODAL OPEN HELPER
// ═══════════════════════════════════════════

function openModal(type) {
    if (type === 'tinhThanh') {
        setVal('ttId', ''); setVal('ttMaTinh', ''); setVal('ttTenTinh', ''); setVal('ttThuTu', '');
        document.getElementById('modalTinhThanhTitle').textContent = 'Thêm Tỉnh / Thành Phố';
        showErr('ttError', '');
        new bootstrap.Modal(document.getElementById('modalTinhThanh')).show();
    } else if (type === 'donVi') {
        setVal('dvId', ''); setVal('dvMaDonVi', ''); setVal('dvTenDonVi', '');
        setVal('dvLoaiDonVi', ''); setVal('dvDiaChi', ''); setVal('dvSoDienThoai', ''); setVal('dvThuTu', '');
        document.getElementById('modalDonViTitle').textContent = 'Thêm Đơn Vị';
        showErr('dvError', '');
        new bootstrap.Modal(document.getElementById('modalDonVi')).show();
    } else if (type === 'tram') {
        populateDonViDropdown();
        setVal('tramId', ''); setVal('tramMaTram', ''); setVal('tramTenTram', '');
        setVal('tramDonViId', ''); setVal('tramDiaDiem', ''); setVal('tramSoDienThoai', ''); setVal('tramThuTu', '');
        document.getElementById('modalTramTitle').textContent = 'Thêm Trạm Quản Lý';
        showErr('tramError', '');
        new bootstrap.Modal(document.getElementById('modalTram')).show();
    } else if (type === 'tuyenLuong') {
        setVal('tlId', ''); setVal('tlMaTuyen', ''); setVal('tlTenTuyen', ''); setVal('tlMoTa', ''); setVal('tlThuTu', '');
        document.getElementById('modalTuyenLuongTitle').textContent = 'Thêm Tuyến Luồng';
        showErr('tlError', '');
        new bootstrap.Modal(document.getElementById('modalTuyenLuong')).show();
    } else if (type === 'viTri') {
        populateTuyenDropdowns();
        setVal('vtId', ''); setVal('vtSoViTri', ''); setVal('vtMaPhaoBH', '');
        setVal('vtToaDo', ''); setVal('vtMoTa', ''); setVal('vtThuTu', '');
        var filterVal = val('viTriTuyenFilter');
        setVal('vtTuyenLuongId', filterVal);
        document.getElementById('modalViTriTitle').textContent = 'Thêm Vị Trí Phao BH';
        showErr('vtError', '');
        new bootstrap.Modal(document.getElementById('modalViTri')).show();
    }
}

// ═══════════════════════════════════════════
// RENDER MAP (for pagination/search callbacks)
// ═══════════════════════════════════════════

var renderMap = {
    tinhThanh: renderTinhThanh,
    donVi: renderDonVi,
    tram: renderTram,
    tuyenLuong: renderTuyenLuong,
    viTri: renderViTri
};

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar click handlers
    document.querySelectorAll('.ap-nav-item[data-section]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            switchSection(this.getAttribute('data-section'));
        });
    });

    // Load all data
    loadStats();
    loadTinhThanh();
    loadDonVi();
    loadTram();
    loadTuyenLuong();
});
