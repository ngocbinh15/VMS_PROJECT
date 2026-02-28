// ═══════════════════════════════════════════════════════════════════════════
// PHAO DASHBOARD — Main Script
// Requires: URLS and fpDate defined inline (Razor) before this file loads
// ═══════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════
// UTILITY
// ══════════════════════════════════════════════
function setText(id, val) { document.getElementById(id).textContent = val || '--'; }
function fmt(v) { return v != null ? parseFloat(v).toFixed(2) : '--'; }
function fmtDate(v) {
    if (!v) return '--';
    return new Date(v).toLocaleDateString('vi-VN');
}
function fmtDateInput(v) {
    if (!v) return '';
    var d = new Date(v);
    return d.toISOString().split('T')[0];
}
function getVal(id) { return document.getElementById(id).value; }
function getNumVal(id) { var v = document.getElementById(id).value; return v === '' ? null : parseFloat(v); }
function getIntVal(id) { var v = document.getElementById(id).value; return v === '' ? null : parseInt(v); }

function splitCoords(toaDo) {
    if (!toaDo) return { viDo: '--', kinhDo: '--' };
    var parts = toaDo.trim().split(/\s+/);
    return { viDo: parts[0] || '--', kinhDo: parts[1] || '--' };
}

// Dropdown cache
var _dropdownCache = null;
function loadDropdownData() {
    if (_dropdownCache) return Promise.resolve(_dropdownCache);
    return fetch(URLS.dropdownData).then(function(r) { return r.json(); }).then(function(d) { _dropdownCache = d; return d; });
}
function populateSelect(selectId, items, selectedVal) {
    var sel = document.getElementById(selectId);
    var firstOpt = sel.options[0]; // keep "-- Chọn --"
    sel.innerHTML = '';
    sel.appendChild(firstOpt);
    items.forEach(function(it) {
        var opt = document.createElement('option');
        opt.value = it.value;
        opt.textContent = it.text;
        sel.appendChild(opt);
    });
    if (selectedVal != null) sel.value = selectedVal;
}

function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    var icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
    var bg = type === 'success' ? 'bg-success' : 'bg-danger';
    var html = '<div class="toast align-items-center text-white ' + bg + ' border-0 show" role="alert">' +
        '<div class="d-flex"><div class="toast-body"><i class="bi ' + icon + ' me-2"></i>' + message + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>';
    container.insertAdjacentHTML('beforeend', html);
    var toast = container.lastElementChild;
    setTimeout(function() { toast.remove(); }, 4000);
}

// ══════════════════════════════════════════════
// AJAX FILTER (search + route)
// ══════════════════════════════════════════════
var filterTimeout = null;

function reloadTable() {
    var search = document.getElementById('searchInput').value.trim();
    var tuyenLuongId = document.getElementById('routeFilter').value;
    var params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tuyenLuongId) params.set('tuyenLuongId', tuyenLuongId);

    fetch(URLS.danhSach + '?' + params.toString())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            renderTable(data.items);
            updateStats(data.thongKe);
        })
        .catch(function(err) {
            console.error('Filter error:', err);
            showToast('Lỗi tải dữ liệu', 'error');
        });
}

function renderTable(items) {
    var tbody = document.getElementById('buoyTableBody');
    document.getElementById('totalCount').textContent = items.length;
    document.getElementById('displayCount').textContent = items.length;

    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-5">' +
            '<i class="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>' +
            '<span>Không tìm thấy phao nào phù hợp.</span></td></tr>';
        return;
    }

    tbody.innerHTML = items.map(function(p, i) {
        var viTri = p.viTriHienTai
            ? '<div class="small fw-bold text-dark"><i class="bi bi-geo-alt-fill text-danger me-1"></i>' + p.viTriHienTai + '</div>' +
              (p.toaDo ? '<div class="small text-muted ms-3">' + p.toaDo + '</div>' : '')
            : '<span class="text-muted small">--</span>';

        var dk = p.duongKinhPhao != null ? parseFloat(p.duongKinhPhao).toFixed(2) : '--';
        var ngaySC = p.ngaySuaChuaGanNhat ? new Date(p.ngaySuaChuaGanNhat).toLocaleDateString('vi-VN') : 'Chưa sửa chữa';

        // Escape single quotes for onclick
        var kyHieuSafe = (p.kyHieuTaiSan || '--').replace(/'/g, "\\'");

        return '<tr data-id="' + p.id + '">' +
            '<td class="text-center ps-4 fw-bold text-muted">' + (i + 1) + '</td>' +
            '<td><div class="fw-bold text-dark">' + (p.kyHieuTaiSan || '--') + '</div>' +
                '<div class="small text-muted" style="font-size:0.75rem">' + (p.maLoaiPhao || '') + '</div></td>' +
            '<td class="fw-semibold text-primary">' + p.maPhaoDayDu + '</td>' +
            '<td class="text-center font-monospace text-muted">' + dk + '</td>' +
            '<td>' + viTri + '</td>' +
            '<td class="small fw-semibold text-secondary">' + (p.tuyenLuong || '--') + '</td>' +
            '<td class="small fw-bold text-dark">' + ngaySC + '</td>' +
            '<td class="text-center"><span class="badge-status ' + p.trangThaiHienThiClass + '">' + (p.trangThaiHienTai || '--') + '</span></td>' +
            '<td class="text-end pe-4">' +
                '<div class="d-flex justify-content-end gap-1">' +
                    '<button class="action-btn" title="Xem chi tiết" onclick="viewPhaoDetail(' + p.id + ')"><i class="bi bi-eye"></i></button>' +
                    '<button class="action-btn action-btn-edit" title="Chỉnh sửa" onclick="openEditModal(' + p.id + ')"><i class="bi bi-pencil-square"></i></button>' +
                    '<button class="action-btn action-btn-delete" title="Xóa" onclick="confirmDelete(' + p.id + ', \'' + kyHieuSafe + '\')"><i class="bi bi-trash3"></i></button>' +
                '</div>' +
            '</td></tr>';
    }).join('');
}

function updateStats(tk) {
    document.getElementById('statTongSo').textContent = tk.tongSoPhao;
    document.getElementById('statTrenLuong').textContent = tk.soPhaoTrenLuong;
    document.getElementById('statBaoTri').textContent = tk.soPhaoSuCo || 0;
}

// Debounced search
document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(reloadTable, 400);
});

// Route filter
document.getElementById('routeFilter').addEventListener('change', reloadTable);

// ══════════════════════════════════════════════
// VIEW DETAIL MODAL
// ══════════════════════════════════════════════
function viewPhaoDetail(id) {
    var modal = new bootstrap.Modal(document.getElementById('phaoDetailModal'));
    document.getElementById('modalLoading').classList.remove('d-none');
    document.getElementById('modalContent').classList.add('d-none');

    // Reset to first tab
    var firstTab = document.querySelector('#phaoDetailModal .nav-link');
    if (firstTab) bootstrap.Tab.getOrCreateInstance(firstTab).show();

    modal.show();

    fetch(URLS.chiTiet + '/' + id)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            document.getElementById('modalLoading').classList.add('d-none');
            document.getElementById('modalContent').classList.remove('d-none');

            setText('dtKyHieu', data.kyHieuTaiSan);
            setText('dtMaPhao', data.maPhaoDayDu);
            setText('dtLoaiPhao', data.maLoaiPhao);
            setText('dtTrangThai', data.trangThaiHienTai);
            setText('dtDuongKinh', fmt(data.duongKinhPhao));
            setText('dtChieuCao', fmt(data.chieuCaoToanBo));
            setText('dtHinhDang', data.hinhDang);
            setText('dtVatLieu', data.vatLieu);
            setText('dtMauSac', data.mauSac);
            setText('dtViTri', data.viTriHienTai);
            setText('dtTuyen', data.tuyenLuong);
            // v1.1 – Tọa độ tách Vĩ độ / Kinh độ
            var coords = splitCoords(data.toaDoThietKe);
            setText('dtViDo', coords.viDo);
            setText('dtKinhDo', coords.kinhDo);
            setText('dtDienTich', fmt(data.dienTich));
            setText('dtThoiGianSD', data.thoiGianSuDung != null ? data.thoiGianSuDung + ' năm' : '--');
            setText('dtThoiDiemThayTha', fmtDate(data.thoiDiemThayTha));
            setText('dtSuaChuaGanNhat', fmtDate(data.thoiDiemSuaChuaGanNhat));

            setText('dtXichPhao_DK', fmt(data.xichPhao_DuongKinh));
            setText('dtXichPhao_CD', fmt(data.xichPhao_ChieuDai));
            setText('dtXichPhao_SD', fmtDate(data.xichPhao_ThoiDiemSuDung));
            setText('dtXichRua_DK', fmt(data.xichRua_DuongKinh));
            setText('dtXichRua_CD', fmt(data.xichRua_ChieuDai));
            setText('dtXichRua_SD', fmtDate(data.xichRua_ThoiDiemSuDung));
            setText('dtRua_TL', fmt(data.rua_TrongLuong));
            setText('dtRua_SD', fmtDate(data.rua_ThoiDiemSuDung));

            setText('dtDen_CL', data.den_ChungLoai);
            setText('dtDen_AIS', data.den_KetNoiAIS === true ? 'Có' : data.den_KetNoiAIS === false ? 'Không' : '--');
            setText('dtDen_AS', data.den_DacTinhAnhSang);
            setText('dtDen_CX', fmt(data.den_ChieuXaTamSang));
            setText('dtDen_NL', data.den_NguonCapNangLuong);
            setText('dtDen_SD', fmtDate(data.den_ThoiDiemSuDung));
            setText('dtDen_SC', fmtDate(data.den_ThoiDiemSuaChua));
            // v1.1 – Đèn mở rộng
            setText('dtDen_CCTSHD', fmt(data.den_ChieuCaoTamSangHaiDo));
            setText('dtDen_SQDT', data.den_SoQuyetDinhTang);
            // v1.1 – Quản lý
            setText('dtTramQL', data.tramQuanLyTen);
            setText('dtTinhTP', data.tinhThanhPhoTen);
            setText('dtDVQL', data.donViQuanLyTen);
            setText('dtDVVH', data.donViVanHanhTen);
            setText('dtSoQDTang', data.soQuyetDinhTang);
            setText('dtNgayQDTang', fmtDate(data.ngayQuyetDinhTang));
        })
        .catch(function(err) {
            document.getElementById('modalLoading').innerHTML =
                '<div class="text-danger"><i class="bi bi-exclamation-circle fs-1"></i><div class="mt-2">Không thể tải dữ liệu</div></div>';
        });
}

// ══════════════════════════════════════════════
// EDIT MODAL
// ══════════════════════════════════════════════
// ── Toggle Tuyến/ViTri enable/disable theo TrangThaiHoatDong ──
function applyTrangThaiLogic(val) {
    var isTrenLuong = val === 'Trên luồng';
    var ddlTuyen = document.getElementById('edTuyenLuong');
    var ddlViTri = document.getElementById('edViTri');
    ddlTuyen.disabled = !isTrenLuong;
    if (!isTrenLuong) {
        ddlTuyen.value = '';
        ddlViTri.innerHTML = '<option value="">-- Chọn tuyến luồng trước --</option>';
        ddlViTri.disabled = true;
        document.getElementById('edViDo').textContent = '--';
        document.getElementById('edKinhDo').textContent = '--';
        document.getElementById('edViTriWarning').classList.add('d-none');
        document.getElementById('btnSaveEdit').disabled = false;
    }
}

// ── Cascade: load ViTri by TuyenLuong ──
var _viTriByTuyenCache = {};
function loadViTriByTuyen(tuyenLuongId) {
    var selViTri = document.getElementById('edViTri');
    var warn = document.getElementById('edViTriWarning');
    warn.classList.add('d-none');
    if (!tuyenLuongId) {
        selViTri.innerHTML = '<option value="">-- Chọn tuyến luồng trước --</option>';
        selViTri.disabled = true;
        updateEditCoords();
        return Promise.resolve([]);
    }
    if (_viTriByTuyenCache[tuyenLuongId]) {
        var cached = _viTriByTuyenCache[tuyenLuongId];
        populateViTriSelect(cached, null);
        selViTri.disabled = false;
        return Promise.resolve(cached);
    }
    return fetch(URLS.viTriByTuyen + '?tuyenLuongId=' + tuyenLuongId)
        .then(function(resp) { return resp.json(); })
        .then(function(items) {
            _viTriByTuyenCache[tuyenLuongId] = items;
            populateViTriSelect(items, null);
            selViTri.disabled = false;
            return items;
        });
}

function populateViTriSelect(items, selectedVal) {
    var sel = document.getElementById('edViTri');
    sel.innerHTML = '<option value="">-- Chọn vị trí --</option>';
    items.forEach(function(it) {
        var opt = document.createElement('option');
        opt.value = it.id;
        opt.textContent = it.maPhaoBH;
        opt.dataset.toaDo = it.toaDoThietKe || '';
        sel.appendChild(opt);
    });
    if (selectedVal != null) sel.value = selectedVal;
}

function updateEditCoords() {
    var sel = document.getElementById('edViTri');
    var selOpt = sel.options[sel.selectedIndex];
    var toaDo = selOpt && selOpt.dataset.toaDo ? selOpt.dataset.toaDo : null;
    if (toaDo) {
        var c = splitCoords(toaDo);
        document.getElementById('edViDo').textContent = c.viDo;
        document.getElementById('edKinhDo').textContent = c.kinhDo;
    } else {
        document.getElementById('edViDo').textContent = '--';
        document.getElementById('edKinhDo').textContent = '--';
    }
}

// ── Duplicate ViTri check ──
function checkViTriDuplicate() {
    var viTriId = getIntVal('edViTri');
    var phaoId = parseInt(getVal('editId'));
    var warn = document.getElementById('edViTriWarning');
    var btn = document.getElementById('btnSaveEdit');
    warn.classList.add('d-none');

    if (!viTriId) { btn.disabled = false; return Promise.resolve(); }

    return fetch(URLS.checkViTriTrung + '?viTriId=' + viTriId + '&excludePhaoId=' + phaoId)
        .then(function(resp) { return resp.json(); })
        .then(function(result) {
            if (result.trung) {
                document.getElementById('edViTriWarningText').textContent =
                    'Vị trí này đang được sử dụng bởi phao: ' + (result.tenPhao || result.maPhao);
                warn.classList.remove('d-none');
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        })
        .catch(function() { btn.disabled = false; });
}

// ── Tab height sync ──
function syncTabHeight() {
    var general = document.getElementById('editTabGeneral');
    if (!general) return;
    requestAnimationFrame(function() {
        var h = general.scrollHeight;
        document.querySelectorAll('#phaoEditModal .tab-pane').forEach(function(pane) {
            if (pane.id !== 'editTabGeneral') pane.style.minHeight = h + 'px';
        });
    });
}

function openEditModal(id) {
    var modal = new bootstrap.Modal(document.getElementById('phaoEditModal'));
    document.getElementById('editLoading').classList.remove('d-none');
    document.getElementById('editContent').classList.add('d-none');
    document.getElementById('edViTriWarning').classList.add('d-none');
    document.getElementById('btnSaveEdit').disabled = false;
    _viTriByTuyenCache = {};

    // Reset to first tab
    var firstTab = document.querySelector('#phaoEditModal .nav-link');
    if (firstTab) bootstrap.Tab.getOrCreateInstance(firstTab).show();

    modal.show();

    // Load both: phao detail + dropdown data in parallel
    Promise.all([
        fetch(URLS.chiTiet + '/' + id).then(function(r) { return r.json(); }),
        loadDropdownData()
    ])
    .then(function(results) {
        var data = results[0];
        var dd = results[1];

        document.getElementById('editLoading').classList.add('d-none');
        document.getElementById('editContent').classList.remove('d-none');

        document.getElementById('editId').value = data.id;
        document.getElementById('edKyHieu').value = data.kyHieuTaiSan || '';
        document.getElementById('edMaPhao').value = data.maPhaoDayDu || '';
        document.getElementById('edTenPhao').value = data.tenPhao || '';
        document.getElementById('edSoPhao').value = data.soPhaoHienTai != null ? data.soPhaoHienTai : '';
        document.getElementById('edDuongKinh').value = data.duongKinhPhao != null ? data.duongKinhPhao : '';
        document.getElementById('edChieuCao').value = data.chieuCaoToanBo != null ? data.chieuCaoToanBo : '';
        document.getElementById('edHinhDang').value = data.hinhDang || '';
        document.getElementById('edVatLieu').value = data.vatLieu || '';
        document.getElementById('edMauSac').value = data.mauSac || '';
        // v1.1 – Thông tin chung mở rộng
        document.getElementById('edThoiGianSD').value = data.thoiGianSuDung != null ? data.thoiGianSuDung : '';
        fpDate['edThoiDiemThayTha'].setDate(data.thoiDiemThayTha ? new Date(data.thoiDiemThayTha) : null, false);
        fpDate['edSuaChuaGanNhat'].setDate(data.thoiDiemSuaChuaGanNhat ? new Date(data.thoiDiemSuaChuaGanNhat) : null, false);
        document.getElementById('edDienTich').value = data.dienTich != null ? data.dienTich : '';

        // ── Trạng thái hoạt động ──
        var trangThaiVal = data.trangThaiHoatDong || '';
        document.getElementById('edTrangThai').value = trangThaiVal;
        applyTrangThaiLogic(trangThaiVal);
        document.getElementById('edTrangThai').onchange = function () {
            applyTrangThaiLogic(this.value);
        };

        // ── Tuyến luồng dropdown ──
        populateSelect('edTuyenLuong', dd.tuyenLuong, data.tuyenLuongId);
        // Re-apply disabled state after populate
        document.getElementById('edTuyenLuong').disabled = trangThaiVal !== 'Trên luồng';
        document.getElementById('edTuyenLuong').onchange = function () {
            loadViTriByTuyen(this.value).then(function() {
                updateEditCoords();
                document.getElementById('edViTriWarning').classList.add('d-none');
                document.getElementById('btnSaveEdit').disabled = false;
            });
        };

        // ── Cascade: load ViTri for current TuyenLuong ──
        var viTriPromise;
        if (trangThaiVal === 'Trên luồng' && data.tuyenLuongId) {
            viTriPromise = loadViTriByTuyen(data.tuyenLuongId).then(function(items) {
                populateViTriSelect(items, data.viTriPhaoBHHienTaiId);
            });
        } else {
            viTriPromise = Promise.resolve();
        }

        viTriPromise.then(function() {
            // Show coords
            if (data.toaDoThietKe) {
                var c = splitCoords(data.toaDoThietKe);
                document.getElementById('edViDo').textContent = c.viDo;
                document.getElementById('edKinhDo').textContent = c.kinhDo;
            } else {
                updateEditCoords();
            }
        });

        // ── ViTri change: coords + duplicate check ──
        document.getElementById('edViTri').onchange = function () {
            updateEditCoords();
            checkViTriDuplicate();
        };

        // Populate dropdowns: Quản lý
        populateSelect('edTramQL', dd.tramQuanLy, data.tramQuanLyId);
        populateSelect('edTinhTP', dd.tinhThanhPho, data.tinhThanhPhoId);
        populateSelect('edDVQL', dd.donVi, data.donViQuanLyId);
        populateSelect('edDVVH', dd.donVi, data.donViVanHanhId);

        document.getElementById('edXichPhao_DK').value = data.xichPhao_DuongKinh != null ? data.xichPhao_DuongKinh : '';
        document.getElementById('edXichPhao_CD').value = data.xichPhao_ChieuDai != null ? data.xichPhao_ChieuDai : '';
        fpDate['edXichPhao_SD'].setDate(data.xichPhao_ThoiDiemSuDung ? new Date(data.xichPhao_ThoiDiemSuDung) : null, false);
        document.getElementById('edXichRua_DK').value = data.xichRua_DuongKinh != null ? data.xichRua_DuongKinh : '';
        document.getElementById('edXichRua_CD').value = data.xichRua_ChieuDai != null ? data.xichRua_ChieuDai : '';
        fpDate['edXichRua_SD'].setDate(data.xichRua_ThoiDiemSuDung ? new Date(data.xichRua_ThoiDiemSuDung) : null, false);
        document.getElementById('edRua_TL').value = data.rua_TrongLuong != null ? data.rua_TrongLuong : '';
        fpDate['edRua_SD'].setDate(data.rua_ThoiDiemSuDung ? new Date(data.rua_ThoiDiemSuDung) : null, false);

        document.getElementById('edDen_CL').value = data.den_ChungLoai || '';
        document.getElementById('edDen_AIS').value = data.den_KetNoiAIS === true ? 'true' : data.den_KetNoiAIS === false ? 'false' : '';
        document.getElementById('edDen_AS').value = data.den_DacTinhAnhSang || '';
        document.getElementById('edDen_CX').value = data.den_ChieuXaTamSang != null ? data.den_ChieuXaTamSang : '';
        document.getElementById('edDen_NL').value = data.den_NguonCapNangLuong || '';
        fpDate['edDen_SD'].setDate(data.den_ThoiDiemSuDung ? new Date(data.den_ThoiDiemSuDung) : null, false);
        fpDate['edDen_SC'].setDate(data.den_ThoiDiemSuaChua ? new Date(data.den_ThoiDiemSuaChua) : null, false);
        // v1.1 – Đèn mở rộng
        document.getElementById('edDen_CCTSHD').value = data.den_ChieuCaoTamSangHaiDo != null ? data.den_ChieuCaoTamSangHaiDo : '';
        document.getElementById('edDen_SQDT').value = data.den_SoQuyetDinhTang || '';
        // v1.1 – Quản lý (text inputs)
        document.getElementById('edSoQDTang').value = data.soQuyetDinhTang || '';
        fpDate['edNgayQDTang'].setDate(data.ngayQuyetDinhTang ? new Date(data.ngayQuyetDinhTang) : null, false);

        // ── Tab height sync ──
        syncTabHeight();
    })
    .catch(function(err) {
        document.getElementById('editLoading').innerHTML =
            '<div class="text-danger"><i class="bi bi-exclamation-circle fs-1"></i><div class="mt-2">Không thể tải dữ liệu</div></div>';
    });
}

function saveEdit() {
    var maPhao = getVal('edMaPhao').trim();
    if (!maPhao) {
        showToast('Mã phao đầy đủ là bắt buộc', 'error');
        return;
    }

    var trangThaiHoatDong = getVal('edTrangThai').trim();
    if (!trangThaiHoatDong) {
        showToast('Vui lòng chọn trạng thái hoạt động', 'error');
        return;
    }
    var isTrenLuong = trangThaiHoatDong === 'Trên luồng';

    var btn = document.getElementById('btnSaveEdit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...';

    var aisVal = getVal('edDen_AIS');
    var dto = {
        id: parseInt(getVal('editId')),
        maPhaoDayDu: maPhao,
        kyHieuTaiSan: getVal('edKyHieu') || null,
        tenPhao: getVal('edTenPhao') || null,
        soPhaoHienTai: getIntVal('edSoPhao'),
        duongKinhPhao: getNumVal('edDuongKinh'),
        chieuCaoToanBo: getNumVal('edChieuCao'),
        hinhDang: getVal('edHinhDang') || null,
        vatLieu: getVal('edVatLieu') || null,
        mauSac: getVal('edMauSac') || null,
        // v1.1 – Thông tin chung mở rộng
        thoiGianSuDung: getIntVal('edThoiGianSD'),
        thoiDiemThayTha: getVal('edThoiDiemThayTha') || null,
        thoiDiemSuaChuaGanNhat: getVal('edSuaChuaGanNhat') || null,
        dienTich: getNumVal('edDienTich'),
        trangThaiHoatDong: trangThaiHoatDong,
        viTriPhaoBHHienTaiId: isTrenLuong ? getIntVal('edViTri') : null,
        xichPhao_DuongKinh: getNumVal('edXichPhao_DK'),
        xichPhao_ChieuDai: getNumVal('edXichPhao_CD'),
        xichPhao_ThoiDiemSuDung: getVal('edXichPhao_SD') || null,
        xichRua_DuongKinh: getNumVal('edXichRua_DK'),
        xichRua_ChieuDai: getNumVal('edXichRua_CD'),
        xichRua_ThoiDiemSuDung: getVal('edXichRua_SD') || null,
        rua_TrongLuong: getNumVal('edRua_TL'),
        rua_ThoiDiemSuDung: getVal('edRua_SD') || null,
        den_ChungLoai: getVal('edDen_CL') || null,
        den_KetNoiAIS: aisVal === 'true' ? true : aisVal === 'false' ? false : null,
        den_DacTinhAnhSang: getVal('edDen_AS') || null,
        den_ChieuXaTamSang: getNumVal('edDen_CX'),
        den_NguonCapNangLuong: getVal('edDen_NL') || null,
        den_ThoiDiemSuDung: getVal('edDen_SD') || null,
        den_ThoiDiemSuaChua: getVal('edDen_SC') || null,
        // v1.1 – Đèn mở rộng
        den_ChieuCaoTamSangHaiDo: getNumVal('edDen_CCTSHD'),
        den_SoQuyetDinhTang: getVal('edDen_SQDT') || null,
        // v1.1 – Quản lý
        tramQuanLyId: getIntVal('edTramQL'),
        tinhThanhPhoId: getIntVal('edTinhTP'),
        donViQuanLyId: getIntVal('edDVQL'),
        donViVanHanhId: getIntVal('edDVVH'),
        soQuyetDinhTang: getVal('edSoQDTang') || null,
        ngayQuyetDinhTang: getVal('edNgayQDTang') || null
    };

    fetch(URLS.capNhat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Lưu thay đổi';

        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('phaoEditModal')).hide();
            showToast('Cập nhật phao thành công!');
            reloadTable();
        } else {
            showToast(data.error || 'Lỗi cập nhật', 'error');
        }
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Lưu thay đổi';
        showToast('Lỗi kết nối server', 'error');
    });
}

// ══════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════
function confirmDelete(id, name) {
    document.getElementById('deletePhaoId').value = id;
    document.getElementById('deletePhaoName').textContent = name;
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
}

function executeDelete() {
    var id = document.getElementById('deletePhaoId').value;

    fetch(URLS.xoa + '/' + id, { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            if (data.success) {
                showToast('Đã xóa phao thành công!');
                reloadTable();
            } else {
                showToast(data.error || 'Lỗi xóa phao', 'error');
            }
        })
        .catch(function(err) {
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            showToast('Lỗi kết nối server', 'error');
        });
}

// ── Flatpickr init (dd/MM/yyyy for all modal date inputs) ──────────────
['edThoiDiemThayTha','edSuaChuaGanNhat','edXichPhao_SD','edXichRua_SD',
 'edRua_SD','edDen_SD','edDen_SC','edNgayQDTang'].forEach(function(id) {
    fpDate[id] = flatpickr(document.getElementById(id), {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        allowInput: true
    });
});
