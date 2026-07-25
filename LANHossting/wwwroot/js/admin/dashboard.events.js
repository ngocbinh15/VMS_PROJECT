// ═══════════════════════════════════════════
// ADMIN DASHBOARD — Events & Orchestration
// Binds UI events → calls API → updates UI.
// ═══════════════════════════════════════════

/* ── State ────────────────────────────────── */
let _accounts = [];
let _materials = [];
let _khoList = [];
let _roles = [];
let _logCurrentPage = 1;

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar navigation
    document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
            onSectionEnter(section);
        });
    });

    // Load initial data
    await loadDashboardOverview();
    try { await loadPhieuChoDuyet(); } catch (_) { }

    // Bind search inputs
    const vatLieuSearch = document.getElementById('vatLieuSearchInput');
    if (vatLieuSearch) {
        vatLieuSearch.addEventListener('input', () => filterVatLieuTable(vatLieuSearch.value));
    }

    // Real-Time SignalR
    initRealtimeSignalR();
});

function initRealtimeSignalR() {
    if (typeof signalR === 'undefined') return;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/khoHub")
        .withAutomaticReconnect()
        .build();

    connection.on("ReceivePendingTicketsUpdate", async (maPhieu, nguoiTao, action) => {
        console.log("[SignalR] Pending tickets updated:", maPhieu, nguoiTao, action);
        try { await loadPhieuChoDuyet(); } catch (_) { }
        try { await loadDashboardOverview(); } catch (_) { }

        if (action === 'CREATING') {
            playNotificationSound('info');
            showToast(`Có phiếu giao dịch mới vừa gửi bởi <strong>${nguoiTao || 'Thủ kho'}</strong> cần duyệt!`, 'info');
        }
    });

    connection.on("ReceiveLogUpdate", async (msg) => {
        console.log("[SignalR] Log updated:", msg);
        try { await loadSystemLog(_logCurrentPage); } catch (_) { }
    });

    connection.on("ReceiveStockUpdate", async (khoId, msg) => {
        console.log("[SignalR] Stock updated:", khoId, msg);
        try { await loadDashboardOverview(); } catch (_) { }
    });

    connection.start().then(() => {
        console.log("[SignalR] Real-time connection established");
    }).catch(err => console.error("[SignalR] Connection error:", err));
}

/* ── Section enter handler ────────────────── */
async function onSectionEnter(section) {
    switch (section) {
        case 'sectionOverview':
            await loadDashboardOverview();
            break;
        case 'sectionTaiKhoan':
            await loadTaiKhoan();
            break;
        case 'sectionVatLieu':
            await loadVatLieu();
            break;
        case 'sectionKho':
            await loadKho();
            break;
        case 'sectionDuyetPhieu':
            await loadPhieuChoDuyet();
            break;
        case 'sectionSystemLog':
            _logCurrentPage = 1;
            await loadSystemLog(1);
            break;
    }
}

/* ══════════════════════════════════════════
   DASHBOARD OVERVIEW & CẢNH BÁO TỒN KHO
   ══════════════════════════════════════════ */
async function loadDashboardOverview() {
    try {
        const [accounts, materials] = await Promise.all([
            AdminAPI.getTaiKhoan(),
            AdminAPI.getVatLieu()
        ]);
        _accounts = accounts || [];
        _materials = materials || [];
        renderDashboardStats(_accounts, _materials);
        await loadLowStockWarningData();

        const inputTu = document.getElementById('chartTuNgay');
        const inputDen = document.getElementById('chartDenNgay');
        if (inputTu && inputDen && inputTu.value && inputDen.value) {
            await loadOverviewCharts(inputTu.value, inputDen.value);
        } else {
            await loadChartByQuickDays(7);
        }
    } catch (e) {
        showToast('Lỗi tải dữ liệu tổng quan: ' + e.message, 'error');
    }
}

let _selectedChartKhoIds = [];
let _allChartWarehouses = [];

async function loadOverviewCharts(tuNgay, denNgay) {
    try {
        const chartData = await AdminAPI.getThongKeBieuDo(tuNgay, denNgay, _selectedChartKhoIds);
        renderOverviewCharts(chartData);
    } catch (e) {
        console.error('Lỗi tải biểu đồ:', e);
    }
}

function applyChartDateFilter() {
    const tuNgay = document.getElementById('chartTuNgay')?.value;
    const denNgay = document.getElementById('chartDenNgay')?.value;
    if (!tuNgay && !denNgay) {
        showToast('Vui lòng chọn Từ ngày hoặc Đến ngày để lọc', 'info');
        return;
    }
    document.getElementById('btnChart7Days')?.classList.remove('active');
    document.getElementById('btnChart30Days')?.classList.remove('active');
    loadOverviewCharts(tuNgay, denNgay);
}

function loadChartByQuickDays(days) {
    document.getElementById('btnChart7Days')?.classList.toggle('active', days === 7);
    document.getElementById('btnChart30Days')?.classList.toggle('active', days === 30);
    
    const den = new Date();
    const tu = new Date();
    tu.setDate(den.getDate() - (days - 1));

    const tuStr = tu.toISOString().split('T')[0];
    const denStr = den.toISOString().split('T')[0];

    const inputTu = document.getElementById('chartTuNgay');
    const inputDen = document.getElementById('chartDenNgay');
    if (inputTu) inputTu.value = tuStr;
    if (inputDen) inputDen.value = denStr;

    loadOverviewCharts(tuStr, denStr);
}

/* ── Warehouse Filter Modal ────────────────── */
async function openChartWarehouseModal() {
    try {
        if (_allChartWarehouses.length === 0) {
            _allChartWarehouses = await AdminAPI.getKho() || [];
        }
        renderChartWarehouseModalList(_allChartWarehouses);
        const modal = new bootstrap.Modal(document.getElementById('modalChartWarehouseFilter'));
        modal.show();
    } catch (e) {
        showToast('Lỗi tải danh sách kho: ' + e.message, 'error');
    }
}

function renderChartWarehouseModalList(khoList) {
    const container = document.getElementById('chartWarehouseModalList');
    if (!container) return;

    if (!khoList || khoList.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">Không tìm thấy kho nào.</div>';
        updateChartWarehouseBadge();
        return;
    }

    container.innerHTML = khoList.map(k => {
        const isChecked = _selectedChartKhoIds.length === 0 || _selectedChartKhoIds.includes(k.id);
        const loaiStr = k.loaiKho === 'KHO_ME' ? 'Kho Mẹ' : 'Kho Con';
        return `
            <div class="p-3 mb-2 bg-white d-flex align-items-center justify-content-between text-start" style="border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer;" onclick="toggleChartWarehouseRow(this, event)">
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="form-check-input me-3 chart-warehouse-chk" value="${k.id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px; border-radius: 4px; cursor: pointer;" onclick="event.stopPropagation(); updateChartWarehouseBadge();">
                    <div>
                        <div class="fw-bold text-dark mb-0 fs-6">${escapeHtml(k.tenKho)}</div>
                        <small class="text-muted">${loaiStr}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateChartWarehouseBadge();
}

function toggleChartWarehouseRow(rowEl, event) {
    const chk = rowEl.querySelector('.chart-warehouse-chk');
    if (chk && event.target !== chk) {
        chk.checked = !chk.checked;
        updateChartWarehouseBadge();
    }
}

function selectAllChartWarehouses() {
    document.querySelectorAll('.chart-warehouse-chk').forEach(c => c.checked = true);
    updateChartWarehouseBadge();
}

function deselectAllChartWarehouses() {
    document.querySelectorAll('.chart-warehouse-chk').forEach(c => c.checked = false);
    updateChartWarehouseBadge();
}

function updateChartWarehouseBadge() {
    const chks = document.querySelectorAll('.chart-warehouse-chk:checked');
    const badge = document.getElementById('badgeChartWarehouseSelected');
    if (badge) badge.textContent = `${chks.length} kho`;
}

function applyChartWarehouseFilter() {
    const chks = document.querySelectorAll('.chart-warehouse-chk:checked');
    const totalChks = document.querySelectorAll('.chart-warehouse-chk');

    if (chks.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 kho để xem thống kê', 'warning');
        return;
    }

    if (chks.length === totalChks.length) {
        _selectedChartKhoIds = [];
        const lbl = document.getElementById('lblChartWarehouseCount');
        if (lbl) lbl.textContent = 'Tất cả kho';
    } else {
        _selectedChartKhoIds = Array.from(chks).map(c => parseInt(c.value));
        const lbl = document.getElementById('lblChartWarehouseCount');
        if (lbl) lbl.textContent = `${chks.length} kho đã chọn`;
    }

    const modalEl = document.getElementById('modalChartWarehouseFilter');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    const inputTu = document.getElementById('chartTuNgay')?.value;
    const inputDen = document.getElementById('chartDenNgay')?.value;
    loadOverviewCharts(inputTu, inputDen);
}

/* ── Low Stock Warning Data & Pagination ──── */
let _rawLowStockList = [];
let _lowStockCurrentPage = 1;
const _lowStockPageSize = 10;
let _selectedLowStockKhoIds = [];
let _lowStockSearchDebounce = null;
let _isLowStockUserSearching = false;

async function loadLowStockWarningData() {
    try {
        const input = document.getElementById('lowStockSearchInput');
        if (input && !_isLowStockUserSearching) {
            input.value = '';
        }
        const search = input?.value || '';
        _rawLowStockList = await AdminAPI.getCanhBaoTonKho(search, _selectedLowStockKhoIds) || [];
        _lowStockCurrentPage = 1;
        renderLowStockTablePage();
    } catch (e) {
        console.error('Lỗi tải cảnh báo tồn kho:', e);
    }
}

function onLowStockSearchInput() {
    _isLowStockUserSearching = true;
    clearTimeout(_lowStockSearchDebounce);
    _lowStockSearchDebounce = setTimeout(() => {
        loadLowStockWarningData();
    }, 300);
}

function renderLowStockTablePage() {
    const stat = document.getElementById('statLowStockCount');
    const badge = document.getElementById('badgeLowStockCount');
    const tbody = document.getElementById('overviewLowStockTableBody');
    const info = document.getElementById('lowStockPageInfo');
    const paginationContainer = document.getElementById('lowStockPaginationButtons');

    const totalItems = _rawLowStockList.length;
    if (stat) stat.textContent = totalItems;
    if (badge) badge.textContent = `${totalItems} cảnh báo`;

    if (!tbody) return;

    if (totalItems === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-check-circle me-1 text-success"></i>Không có vật tư nào chạm mức tồn kho tối thiểu.</td></tr>`;
        if (info) info.textContent = `Hiển thị 0 - 0 trên tổng số 0 mục`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalItems / _lowStockPageSize);
    if (_lowStockCurrentPage > totalPages) _lowStockCurrentPage = totalPages;
    if (_lowStockCurrentPage < 1) _lowStockCurrentPage = 1;

    const startIndex = (_lowStockCurrentPage - 1) * _lowStockPageSize;
    const endIndex = Math.min(startIndex + _lowStockPageSize, totalItems);
    const pageItems = _rawLowStockList.slice(startIndex, endIndex);

    tbody.innerHTML = pageItems.map(item => {
        let badgeStatus = '<span class="badge bg-danger" style="border-radius: 6px;">Hết hàng (Tồn 0)</span>';
        if (item.mucDoCanhBao === 'SAP_HET' || item.soLuongTon > 0) {
            badgeStatus = '<span class="badge bg-warning text-dark" style="border-radius: 6px;"><i class="bi bi-exclamation-triangle me-1"></i>Tồn thấp</span>';
        }

        return `
            <tr>
                <td class="ps-3"><strong class="text-primary">${escapeHtml(item.maVatLieu)}</strong></td>
                <td><span class="fw-semibold">${escapeHtml(item.tenVatLieu)}</span></td>
                <td class="text-center">${escapeHtml(item.donViTinh || '-')}</td>
                <td><span class="badge bg-light text-dark border" style="border-radius: 6px;">${escapeHtml(item.tenKho || '-')}</span></td>
                <td class="text-end font-monospace fw-bold ${item.soLuongTon === 0 ? 'text-danger' : 'text-dark'}">${item.soLuongTon.toLocaleString('vi-VN')}</td>
                <td class="text-end font-monospace text-muted">${item.mucToiThieu.toLocaleString('vi-VN')}</td>
                <td class="text-center">${badgeStatus}</td>
            </tr>
        `;
    }).join('');

    if (info) info.textContent = `Hiển thị ${startIndex + 1} - ${endIndex} trên tổng số ${totalItems} mục`;

    if (paginationContainer) {
        let btnHtml = '';

        // Nút Prev <
        btnHtml += `<button class="btn btn-sm ${!(_lowStockCurrentPage > 1) ? 'btn-light text-muted border disabled' : 'btn-outline-secondary'}" style="border-radius: 8px; width: 36px; height: 36px; padding: 0;" onclick="changeLowStockPage(-1)" ${!(_lowStockCurrentPage > 1) ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;

        // Tính các số trang (hiển thị tối đa 5 nút số)
        let startPage = Math.max(1, _lowStockCurrentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let p = startPage; p <= endPage; p++) {
            if (p === _lowStockCurrentPage) {
                btnHtml += `<button class="btn btn-primary btn-sm fw-bold shadow-sm" style="border-radius: 8px; width: 36px; height: 36px; padding: 0;">${p}</button>`;
            } else {
                btnHtml += `<button class="btn btn-outline-secondary btn-sm bg-white text-dark border" style="border-radius: 8px; width: 36px; height: 36px; padding: 0;" onclick="goToLowStockPage(${p})">${p}</button>`;
            }
        }

        // Nút Next >
        btnHtml += `<button class="btn btn-sm ${!(_lowStockCurrentPage < totalPages) ? 'btn-light text-muted border disabled' : 'btn-outline-secondary'}" style="border-radius: 8px; width: 36px; height: 36px; padding: 0;" onclick="changeLowStockPage(1)" ${!(_lowStockCurrentPage < totalPages) ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;

        // Nếu vượt quá 5 trang -> Thêm ô Đi tới trang chuẩn UX
        if (totalPages > 5) {
            btnHtml += `
                <div class="d-flex align-items-center gap-1 ms-2 border-start ps-2">
                    <span class="small text-muted">Đi tới:</span>
                    <input type="number" id="lowStockGoToPageInput" min="1" max="${totalPages}" placeholder="${_lowStockCurrentPage}" class="form-control form-control-sm text-center" style="width: 55px; border-radius: 8px;" onkeypress="if(event.key==='Enter') jumpToLowStockPage(${totalPages})">
                    <button class="btn btn-outline-primary btn-sm px-2" style="border-radius: 8px;" onclick="jumpToLowStockPage(${totalPages})">Đi</button>
                </div>
            `;
        }

        paginationContainer.innerHTML = btnHtml;
    }
}

function goToLowStockPage(pageNum) {
    _lowStockCurrentPage = pageNum;
    renderLowStockTablePage();
}

function jumpToLowStockPage(maxPages) {
    const input = document.getElementById('lowStockGoToPageInput');
    if (!input || !input.value) return;
    let pageNum = parseInt(input.value);
    if (isNaN(pageNum)) return;
    if (pageNum < 1) pageNum = 1;
    if (pageNum > maxPages) pageNum = maxPages;
    _lowStockCurrentPage = pageNum;
    renderLowStockTablePage();
}

function changeLowStockPage(delta) {
    _lowStockCurrentPage += delta;
    renderLowStockTablePage();
}

/* ── Low Stock Warehouse Filter Modal ────────── */
async function openLowStockWarehouseModal() {
    try {
        if (_allChartWarehouses.length === 0) {
            _allChartWarehouses = await AdminAPI.getKho() || [];
        }
        renderLowStockWarehouseModalList(_allChartWarehouses);
        const modal = new bootstrap.Modal(document.getElementById('modalLowStockWarehouseFilter'));
        modal.show();
    } catch (e) {
        showToast('Lỗi tải danh sách kho: ' + e.message, 'error');
    }
}

function renderLowStockWarehouseModalList(khoList) {
    const container = document.getElementById('lowStockWarehouseModalList');
    if (!container) return;

    if (!khoList || khoList.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">Không tìm thấy kho nào.</div>';
        updateLowStockWarehouseBadge();
        return;
    }

    container.innerHTML = khoList.map(k => {
        const isChecked = _selectedLowStockKhoIds.length === 0 || _selectedLowStockKhoIds.includes(k.id);
        const loaiStr = k.loaiKho === 'KHO_ME' ? 'Kho Mẹ' : 'Kho Con';
        return `
            <div class="p-3 mb-2 bg-white d-flex align-items-center justify-content-between text-start" style="border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer;" onclick="toggleLowStockWarehouseRow(this, event)">
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="form-check-input me-3 low-stock-warehouse-chk" value="${k.id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px; border-radius: 4px; cursor: pointer;" onclick="event.stopPropagation(); updateLowStockWarehouseBadge();">
                    <div>
                        <div class="fw-bold text-dark mb-0 fs-6">${escapeHtml(k.tenKho)}</div>
                        <small class="text-muted">${loaiStr}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateLowStockWarehouseBadge();
}

function toggleLowStockWarehouseRow(rowEl, event) {
    const chk = rowEl.querySelector('.low-stock-warehouse-chk');
    if (chk && event.target !== chk) {
        chk.checked = !chk.checked;
        updateLowStockWarehouseBadge();
    }
}

function selectAllLowStockWarehouses() {
    document.querySelectorAll('.low-stock-warehouse-chk').forEach(c => c.checked = true);
    updateLowStockWarehouseBadge();
}

function deselectAllLowStockWarehouses() {
    document.querySelectorAll('.low-stock-warehouse-chk').forEach(c => c.checked = false);
    updateLowStockWarehouseBadge();
}

function updateLowStockWarehouseBadge() {
    const chks = document.querySelectorAll('.low-stock-warehouse-chk:checked');
    const badge = document.getElementById('badgeLowStockWarehouseSelected');
    if (badge) badge.textContent = `${chks.length} kho`;
}

function applyLowStockWarehouseFilter() {
    const chks = document.querySelectorAll('.low-stock-warehouse-chk:checked');
    const totalChks = document.querySelectorAll('.low-stock-warehouse-chk');

    if (chks.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 kho để xem cảnh báo', 'warning');
        return;
    }

    if (chks.length === totalChks.length) {
        _selectedLowStockKhoIds = [];
        const lbl = document.getElementById('lblLowStockWarehouseCount');
        if (lbl) lbl.textContent = 'Tất cả kho';
    } else {
        _selectedLowStockKhoIds = Array.from(chks).map(c => parseInt(c.value));
        const lbl = document.getElementById('lblLowStockWarehouseCount');
        if (lbl) lbl.textContent = `${chks.length} kho đã chọn`;
    }

    const modalEl = document.getElementById('modalLowStockWarehouseFilter');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    loadLowStockWarningData();
}

/* ══════════════════════════════════════════
   TÀI KHOẢN
   ══════════════════════════════════════════ */
async function loadTaiKhoan() {
    try {
        _accounts = await AdminAPI.getTaiKhoan() || [];
        renderTaiKhoanTable(_accounts);
        // Also pre-load roles
        if (_roles.length === 0) {
            _roles = await AdminAPI.getVaiTro() || [];
        }
    } catch (e) {
        showToast('Lỗi tải danh sách tài khoản: ' + e.message, 'error');
    }
}

function openCreateTaiKhoan() {
    document.getElementById('formTaiKhoanTitle').textContent = 'Tạo Tài Khoản Mới';
    document.getElementById('formTaiKhoanId').value = '';
    document.getElementById('formTenDangNhap').value = '';
    document.getElementById('formTenDangNhap').readOnly = false;
    document.getElementById('formMatKhau').value = '';
    document.getElementById('formMatKhauGroup').style.display = '';
    document.getElementById('formHoTen').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formSoDienThoai').value = '';
    renderVaiTroDropdown('formVaiTroId', _roles, null);
    new bootstrap.Modal(document.getElementById('taiKhoanModal')).show();
}

function openEditTaiKhoan(id) {
    const tk = _accounts.find(a => a.id === id);
    if (!tk) return;

    document.getElementById('formTaiKhoanTitle').textContent = 'Cập Nhật Tài Khoản';
    document.getElementById('formTaiKhoanId').value = tk.id;
    document.getElementById('formTenDangNhap').value = tk.tenDangNhap;
    document.getElementById('formTenDangNhap').readOnly = true;
    document.getElementById('formMatKhau').value = '';
    document.getElementById('formMatKhauGroup').style.display = 'none';
    document.getElementById('formHoTen').value = tk.hoTen;
    document.getElementById('formEmail').value = tk.email || '';
    document.getElementById('formSoDienThoai').value = tk.soDienThoai || '';

    // Find role ID from maVaiTro
    const role = _roles.find(r => r.maVaiTro === tk.maVaiTro);
    renderVaiTroDropdown('formVaiTroId', _roles, role ? role.id : null);

    new bootstrap.Modal(document.getElementById('taiKhoanModal')).show();
}

async function saveTaiKhoan() {
    const id = document.getElementById('formTaiKhoanId').value;
    const isEdit = !!id;

    try {
        let result;
        if (isEdit) {
            result = await AdminAPI.updateTaiKhoan({
                id: parseInt(id),
                hoTen: document.getElementById('formHoTen').value.trim(),
                email: document.getElementById('formEmail').value.trim() || null,
                soDienThoai: document.getElementById('formSoDienThoai').value.trim() || null,
                vaiTroId: parseInt(document.getElementById('formVaiTroId').value)
            });
        } else {
            result = await AdminAPI.createTaiKhoan({
                tenDangNhap: document.getElementById('formTenDangNhap').value.trim(),
                matKhau: document.getElementById('formMatKhau').value,
                hoTen: document.getElementById('formHoTen').value.trim(),
                email: document.getElementById('formEmail').value.trim() || null,
                soDienThoai: document.getElementById('formSoDienThoai').value.trim() || null,
                vaiTroId: parseInt(document.getElementById('formVaiTroId').value)
            });
        }

        if (result && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('taiKhoanModal'))?.hide();
            showToast(result.message, 'success');
            await loadTaiKhoan();
        } else {
            showToast(result?.message || 'Lỗi không xác định', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

async function toggleTaiKhoanStatus(id) {
    const tk = _accounts.find(a => a.id === id);
    if (!tk) return;

    const action = tk.trangThai === 'Hoạt động' ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn muốn ${action} tài khoản "${tk.tenDangNhap}"?`)) return;

    try {
        const result = await AdminAPI.toggleStatus(id);
        if (result && result.success) {
            showToast(result.message, 'success');
            await loadTaiKhoan();
        } else {
            showToast(result?.message || 'Thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

function openResetPassword(id, tenDangNhap) {
    document.getElementById('resetPasswordTaiKhoanId').value = id;
    document.getElementById('resetPasswordUsername').textContent = tenDangNhap;
    document.getElementById('resetPasswordInput').value = '';
    new bootstrap.Modal(document.getElementById('resetPasswordModal')).show();
}

async function doResetPassword() {
    const id = parseInt(document.getElementById('resetPasswordTaiKhoanId').value);
    const newPass = document.getElementById('resetPasswordInput').value;

    if (!newPass || newPass.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }

    try {
        const result = await AdminAPI.resetPassword(id, { matKhauMoi: newPass });
        if (result && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'))?.hide();
            showToast(result.message, 'success');
        } else {
            showToast(result?.message || 'Thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

async function confirmDeleteTaiKhoan(id, tenDangNhap) {
    if (!confirm(`Bạn chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${tenDangNhap}"?\nHành động này không thể hoàn tác.`)) return;

    try {
        const result = await AdminAPI.deleteTaiKhoan(id);
        if (result && result.success) {
            showToast(result.message, 'success');
            await loadTaiKhoan();
        } else {
            showToast(result?.message || 'Thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

/* ══════════════════════════════════════════
   VẬT LIỆU
   ══════════════════════════════════════════ */
async function loadVatLieu() {
    try {
        _materials = await AdminAPI.getVatLieu() || [];
        renderVatLieuTable(_materials);
    } catch (e) {
        showToast('Lỗi tải danh sách vật liệu: ' + e.message, 'error');
    }
}

let _nhomVatLieuList = [];
let _donViTinhList = [];

async function openCreateVatLieu() {
    // Load dropdowns if not loaded yet
    if (_nhomVatLieuList.length === 0) {
        try { _nhomVatLieuList = await AdminAPI.getNhomVatLieu() || []; } catch (_) { }
    }
    if (_donViTinhList.length === 0) {
        try { _donViTinhList = await AdminAPI.getDonViTinh() || []; } catch (_) { }
    }

    // Populate dropdowns
    const nhomSel = document.getElementById('createVl_NhomVatLieu');
    nhomSel.innerHTML = '<option value="">-- Chọn nhóm --</option>' +
        _nhomVatLieuList.map(n => `<option value="${n.id}">${escapeHtml(n.ten)}</option>`).join('');

    const dvtSel = document.getElementById('createVl_DonViTinh');
    dvtSel.innerHTML = '<option value="">-- Chọn ĐVT --</option>' +
        _donViTinhList.map(d => `<option value="${d.id}">${escapeHtml(d.ten)}</option>`).join('');

    // Reset form
    document.getElementById('createVl_MaVatLieu').value = '';
    document.getElementById('createVl_TenVatLieu').value = '';
    document.getElementById('createVl_DonGia').value = '0';
    document.getElementById('createVl_MucToiThieu').value = '';
    document.getElementById('createVl_TrangThai').value = 'Đang sử dụng';
    document.getElementById('createVl_MoTa').value = '';

    new bootstrap.Modal(document.getElementById('createVatLieuModal')).show();
}

async function saveCreateVatLieu() {
    const maVatLieu = document.getElementById('createVl_MaVatLieu').value.trim();
    const tenVatLieu = document.getElementById('createVl_TenVatLieu').value.trim();
    const nhomVatLieuId = parseInt(document.getElementById('createVl_NhomVatLieu').value) || 0;
    const donViTinhId = parseInt(document.getElementById('createVl_DonViTinh').value) || 0;
    const donGia = parseFloat(document.getElementById('createVl_DonGia').value) || 0;
    const mucToiThieu = parseFloat(document.getElementById('createVl_MucToiThieu').value) || null;
    const moTa = document.getElementById('createVl_MoTa').value.trim() || null;

    if (!maVatLieu || !tenVatLieu || !nhomVatLieuId || !donViTinhId) {
        showToast('Vui lòng điền đầy đủ các trường bắt buộc (*).', 'error');
        return;
    }

    try {
        const btn = document.getElementById('btnSaveCreateVatLieu');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...';

        const result = await AdminAPI.createVatLieu({
            maVatLieu, tenVatLieu, nhomVatLieuId, donViTinhId, donGia,
            khoId: 0, mucToiThieu, moTa
        });

        if (result && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('createVatLieuModal'))?.hide();
            showToast(result.message, 'success');
            await loadVatLieu();
        } else {
            const msg = result?.errors?.join(', ') || result?.message || 'Lỗi không xác định';
            showToast(msg, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Lưu';
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
        const btn = document.getElementById('btnSaveCreateVatLieu');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Lưu';
    }
}

async function openEditVatLieu(id) {
    const vl = _materials.find(m => m.id === id);
    if (!vl) return;

    if (_nhomVatLieuList.length === 0) {
        try { _nhomVatLieuList = await AdminAPI.getNhomVatLieu() || []; } catch (_) { }
    }
    if (_donViTinhList.length === 0) {
        try { _donViTinhList = await AdminAPI.getDonViTinh() || []; } catch (_) { }
    }

    const nhomSel = document.getElementById('editNhomVatLieu');
    if (nhomSel) {
        nhomSel.innerHTML = '<option value="">-- Chọn nhóm --</option>' +
            _nhomVatLieuList.map(n => `<option value="${n.id}" ${n.id === vl.nhomVatLieuId ? 'selected' : ''}>${escapeHtml(n.ten)}</option>`).join('');
    }

    const dvtSel = document.getElementById('editDonViTinh');
    if (dvtSel) {
        dvtSel.innerHTML = '<option value="">-- Chọn ĐVT --</option>' +
            _donViTinhList.map(d => `<option value="${d.id}" ${d.id === vl.donViTinhId ? 'selected' : ''}>${escapeHtml(d.ten)}</option>`).join('');
    }

    const ttSel = document.getElementById('editTrangThai');
    if (ttSel) {
        ttSel.value = vl.trangThai || 'Đang sử dụng';
    }

    document.getElementById('editVatLieuTitle').textContent = `Sửa: ${vl.maVatLieu} — ${vl.tenVatLieu}`;
    document.getElementById('editVatLieuId').value = vl.id;
    document.getElementById('editMaVatLieu').value = vl.maVatLieu;
    document.getElementById('editTenVatLieu').value = vl.tenVatLieu;
    document.getElementById('editDonGia').value = vl.donGia;
    document.getElementById('editMucToiThieu').value = vl.mucToiThieu ?? '';
    document.getElementById('editMucToiDa').value = vl.mucToiDa ?? '';
    document.getElementById('editMoTa').value = vl.moTa ?? '';

    new bootstrap.Modal(document.getElementById('vatLieuModal')).show();
}

async function saveVatLieu() {
    const id = parseInt(document.getElementById('editVatLieuId').value);
    const vl = _materials.find(m => m.id === id);
    if (!vl) return;

    const maVatLieu = document.getElementById('editMaVatLieu').value.trim();
    const tenVatLieu = document.getElementById('editTenVatLieu').value.trim();
    const nhomVatLieuId = parseInt(document.getElementById('editNhomVatLieu').value) || 0;
    const donViTinhId = parseInt(document.getElementById('editDonViTinh').value) || 0;
    const trangThai = document.getElementById('editTrangThai').value;

    if (!maVatLieu || !tenVatLieu || !nhomVatLieuId || !donViTinhId) {
        showToast('Vui lòng điền đầy đủ các trường bắt buộc (*).', 'error');
        return;
    }

    try {
        const result = await AdminAPI.updateVatLieu({
            id: id,
            maVatLieu: maVatLieu,
            tenVatLieu: tenVatLieu,
            nhomVatLieuId: nhomVatLieuId,
            donViTinhId: donViTinhId,
            trangThai: trangThai,
            donGia: parseFloat(document.getElementById('editDonGia').value) || 0,
            mucToiThieu: parseFloat(document.getElementById('editMucToiThieu').value) || null,
            mucToiDa: parseFloat(document.getElementById('editMucToiDa').value) || null,
            moTa: document.getElementById('editMoTa').value.trim() || null
        });

        if (result && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('vatLieuModal'))?.hide();
            showToast(result.message, 'success');
            await loadVatLieu();
        } else {
            showToast(result?.message || 'Lỗi không xác định', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

async function confirmDeleteVatLieu(id, tenVatLieu) {
    if (!confirm(`Bạn chắc chắn muốn XÓA VĨNH VIỄN vật liệu "${tenVatLieu}"?\nHành động này không thể hoàn tác.`)) return;

    try {
        const result = await AdminAPI.deleteVatLieu(id);
        if (result && result.success) {
            showToast(result.message, 'success');
            await loadVatLieu();
        } else {
            showToast(result?.message || 'Thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

/* ══════════════════════════════════════════
   KHO
   ══════════════════════════════════════════ */
async function loadKho() {
    try {
        _khoList = await AdminAPI.getKho() || [];
        renderKhoTable(_khoList);
    } catch (e) {
        showToast('Lỗi tải danh sách kho: ' + e.message, 'error');
    }
}

function openCreateKho() {
    document.getElementById('formKhoTitle').textContent = 'Thêm Kho Mới';
    document.getElementById('formKhoId').value = '';
    document.getElementById('formTenKho').value = '';
    document.getElementById('formDiaChiKho').value = '';
    document.getElementById('formGhiChuKho').value = '';
    new bootstrap.Modal(document.getElementById('khoModal')).show();
}

function openEditKho(id) {
    const k = _khoList.find(x => x.id === id);
    if (!k) return;

    document.getElementById('formKhoTitle').textContent = 'Cập Nhật Kho';
    document.getElementById('formKhoId').value = k.id;
    document.getElementById('formTenKho').value = k.tenKho;
    document.getElementById('formDiaChiKho').value = k.diaChi || '';
    document.getElementById('formGhiChuKho').value = k.moTa || '';
    new bootstrap.Modal(document.getElementById('khoModal')).show();
}

async function saveKho() {
    const id = document.getElementById('formKhoId').value;
    const tenKho = document.getElementById('formTenKho').value.trim();
    const diaChi = document.getElementById('formDiaChiKho').value.trim() || null;
    const moTa = document.getElementById('formGhiChuKho').value.trim() || null;

    if (!tenKho) {
        showToast('Tên kho không được để trống.', 'error');
        return;
    }

    try {
        let result;
        if (id) {
            result = await AdminAPI.updateKho({ id: parseInt(id), tenKho, diaChi, moTa });
        } else {
            result = await AdminAPI.createKho({ tenKho, diaChi, moTa });
        }

        if (result && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('khoModal'))?.hide();
            showToast(result.message, 'success');
            await loadKho();
        } else {
            showToast(result?.message || 'Lỗi không xác định', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

async function confirmDeleteKho(id, tenKho) {
    if (!confirm(`Bạn chắc chắn muốn XÓA kho "${tenKho}"?\nHành động này không thể hoàn tác.`)) return;

    try {
        const result = await AdminAPI.deleteKho(id);
        if (result && result.success) {
            showToast(result.message, 'success');
            await loadKho();
        } else {
            showToast(result?.message || 'Thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

/* ══════════════════════════════════════════
   THÊM VẬT LIỆU VÀO KHO
   ══════════════════════════════════════════ */
let _addVlList = []; // full list from API

async function openAddVatLieuToKho(khoId, tenKho) {
    document.getElementById('addVlKhoId').value = khoId;
    document.getElementById('addVlKhoTenKho').textContent = tenKho;
    document.getElementById('addVlSearchInput').value = '';
    document.getElementById('addVlSelectAll').checked = false;
    document.getElementById('addVlTableBody').innerHTML =
        '<tr><td colspan="5" class="text-center text-muted py-4">Đang tải...</td></tr>';
    document.getElementById('addVlSummary').textContent = '';

    new bootstrap.Modal(document.getElementById('addVatLieuKhoModal')).show();

    try {
        _addVlList = await AdminAPI.getVatLieuForKho(khoId) || [];
        _renderAddVlTable(_addVlList);
    } catch (e) {
        showToast('Lỗi tải danh sách vật liệu: ' + e.message, 'error');
    }
}

function _renderAddVlTable(items) {
    const tbody = document.getElementById('addVlTableBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Không có vật liệu nào</td></tr>';
        document.getElementById('addVlSummary').textContent = '';
        return;
    }

    tbody.innerHTML = items.map(v => `
        <tr class="${v.daTonTai ? 'table-secondary' : ''}">
            <td class="text-center">
                <input class="form-check-input addVlCheckbox" type="checkbox"
                       value="${v.id}" ${v.daTonTai ? 'disabled checked' : ''}>
            </td>
            <td>${escapeHtml(v.maVatLieu)}</td>
            <td>${escapeHtml(v.tenVatLieu)}</td>
            <td>${escapeHtml(v.tenDonViTinh)}</td>
            <td class="text-center">
                ${v.daTonTai
            ? '<span class="badge bg-secondary">Đã có</span>'
            : '<span class="badge bg-light text-dark border">Chưa có</span>'}
            </td>
        </tr>
    `).join('');

    _updateAddVlSummary();
}

function _updateAddVlSummary() {
    const total = document.querySelectorAll('.addVlCheckbox:not(:disabled)').length;
    const checked = document.querySelectorAll('.addVlCheckbox:not(:disabled):checked').length;
    const existing = document.querySelectorAll('.addVlCheckbox:disabled').length;
    document.getElementById('addVlSummary').textContent =
        `Đã chọn ${checked}/${total} vật liệu chưa có trong kho. (${existing} vật liệu đã có)`;
}

// Search filter
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('addVlSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const keyword = searchInput.value.trim().toLowerCase();
            if (!keyword) {
                _renderAddVlTable(_addVlList);
                return;
            }
            const filtered = _addVlList.filter(v =>
                v.maVatLieu.toLowerCase().includes(keyword) ||
                v.tenVatLieu.toLowerCase().includes(keyword)
            );
            _renderAddVlTable(filtered);
        });
    }

    const selectAll = document.getElementById('addVlSelectAll');
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const boxes = document.querySelectorAll('.addVlCheckbox:not(:disabled)');
            boxes.forEach(cb => cb.checked = selectAll.checked);
            _updateAddVlSummary();
        });
    }

    // Update summary on individual checkbox change
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('addVlCheckbox') && !e.target.disabled) {
            _updateAddVlSummary();
        }
    });
});

async function submitAddVatLieuToKho() {
    const khoId = parseInt(document.getElementById('addVlKhoId').value);
    const checkedBoxes = document.querySelectorAll('.addVlCheckbox:not(:disabled):checked');
    const vatLieuIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    if (vatLieuIds.length === 0) {
        showToast('Chưa chọn vật liệu nào.', 'error');
        return;
    }

    try {
        const btn = document.getElementById('btnSubmitAddVatLieu');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang thêm...';

        const result = await AdminAPI.addVatLieuToKho(khoId, vatLieuIds);
        if (result && result.success) {
            bootstrap.Modal.getInstance(document.getElementById('addVatLieuKhoModal'))?.hide();
            showToast(result.message, 'success');
        } else {
            showToast(result?.message || 'Lỗi không xác định', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Thêm vào kho';
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
        const btn = document.getElementById('btnSubmitAddVatLieu');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Thêm vào kho';
    }
}

/* ══════════════════════════════════════════
   NHẬT KÝ NHẬP – XUẤT – ĐIỀU CHUYỂN
   ══════════════════════════════════════════ */
let _logKhoLoaded = false;

async function _ensureLogKhoDropdown() {
    if (_logKhoLoaded) return;
    try {
        const list = await AdminAPI.getDanhSachKho() || [];
        const sel = document.getElementById('logKho');
        list.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.id;
            opt.textContent = k.tenKho;
            sel.appendChild(opt);
        });
        _logKhoLoaded = true;
    } catch (_) { /* ignore */ }
}

async function loadSystemLog(page) {
    page = page || 1;
    _logCurrentPage = page;

    await _ensureLogKhoDropdown();

    const params = new URLSearchParams();
    params.set('page', page);
    params.set('pageSize', 20);

    const tuNgay = document.getElementById('logTuNgay')?.value;
    const denNgay = document.getElementById('logDenNgay')?.value;
    const khoId = document.getElementById('logKho')?.value;
    const loai = document.getElementById('logLoaiPhieu')?.value;
    const trangThai = document.getElementById('logTrangThai')?.value;
    const search = document.getElementById('logSearchVatLieu')?.value?.trim();

    if (tuNgay) params.set('tuNgay', tuNgay);
    if (denNgay) params.set('denNgay', denNgay);
    if (khoId) params.set('khoId', khoId);
    if (loai) params.set('loaiThayDoi', loai);
    if (trangThai) params.set('trangThai', trangThai);
    if (search) params.set('searchVatLieu', search);

    try {
        const data = await AdminAPI.getLichSuKho(params.toString());
        renderSystemLogTable(data || { items: [], totalCount: 0, page: 1, pageSize: 20 });
    } catch (e) {
        showToast('Lỗi tải nhật ký: ' + e.message, 'error');
    }
}

function resetLogFilters() {
    if (document.getElementById('logTuNgay')) document.getElementById('logTuNgay').value = '';
    if (document.getElementById('logDenNgay')) document.getElementById('logDenNgay').value = '';
    if (document.getElementById('logKho')) document.getElementById('logKho').value = '';
    if (document.getElementById('logLoaiPhieu')) document.getElementById('logLoaiPhieu').value = '';
    if (document.getElementById('logTrangThai')) document.getElementById('logTrangThai').value = '';
    if (document.getElementById('logSearchVatLieu')) document.getElementById('logSearchVatLieu').value = '';
    loadSystemLog(1);
}

async function showTransactionDetail(phieuId) {
    try {
        const data = await AdminAPI.getChiTietPhieu(phieuId);
        if (!data) { showToast('Không tìm thấy phiếu', 'error'); return; }
        renderTransactionDetailView(data);
        new bootstrap.Modal(document.getElementById('transactionDetailModal')).show();
    } catch (e) {
        showToast('Lỗi tải chi tiết phiếu: ' + e.message, 'error');
    }
}

/* ══════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════ */
function logout() {
    window.location.href = '/Login/Logout';
}

/* ══════════════════════════════════════════
   QUICK NAV FROM OVERVIEW
   ══════════════════════════════════════════ */
function goToSection(sectionId) {
    switchSection(sectionId);
    onSectionEnter(sectionId);
}

/* ══════════════════════════════════════════
   PHÊ DUYỆT PHIẾU GIAO DỊCH (2 BƯỚC)
   ══════════════════════════════════════════ */
let _phieuChoDuyetList = [];

async function loadPhieuChoDuyet() {
    try {
        const list = await AdminAPI.getPhieuChoDuyet() || [];
        _phieuChoDuyetList = list;
        updateBadgePendingCount(list.length);
        renderPhieuChoDuyetTable(list);
    } catch (e) {
        showToast('Lỗi tải danh sách phiếu chờ duyệt: ' + e.message, 'error');
    }
}

function updateBadgePendingCount(count) {
    const badge = document.getElementById('badgePendingCount');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function renderPhieuChoDuyetTable(list) {
    const tbody = document.getElementById('pendingTicketsTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-check-circle me-1 text-success"></i>Không có phiếu nào đang chờ duyệt.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => {
        let loaiBadge = '<span class="badge bg-primary">Nhập kho</span>';
        if (p.loaiPhieu === 'XUAT_KHO' || p.loaiPhieu === 'XUAT') loaiBadge = '<span class="badge bg-danger">Xuất kho</span>';
        else if (p.loaiPhieu === 'CHUYEN_KHO' || p.loaiPhieu === 'DIEUCHUYEN') loaiBadge = '<span class="badge bg-info text-dark">Chuyển kho</span>';

        let khoInfo = p.tenKhoNhap || p.tenKhoNguon || '-';
        if (p.tenKhoNguon && p.tenKhoNhap) khoInfo = `${escapeHtml(p.tenKhoNguon)} ➔ ${escapeHtml(p.tenKhoNhap)}`;

        const itemCount = (p.chiTietList || []).length;
        const ngayTao = p.ngayTao ? new Date(p.ngayTao).toLocaleString('vi-VN') : '-';

        return `
            <tr>
                <td><strong class="text-primary">${escapeHtml(p.maPhieu)}</strong></td>
                <td>${loaiBadge}</td>
                <td><span class="fw-semibold">${escapeHtml(khoInfo)}</span></td>
                <td>${escapeHtml(p.nguoiTao)}</td>
                <td><small class="text-muted">${ngayTao}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="viewChiTietPhieuChoDuyet(${p.id})">
                        <i class="bi bi-list-task me-1"></i>Xem ${itemCount} mặt hàng
                    </button>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-success me-1" onclick="duyetPhieuGiaoDich(${p.id})">
                        <i class="bi bi-check-lg me-1"></i>Duyệt
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="tuChoiPhieuGiaoDich(${p.id})">
                        <i class="bi bi-x-lg me-1"></i>Từ chối
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewChiTietPhieuChoDuyet(id) {
    const p = _phieuChoDuyetList.find(x => x.id === id);
    if (!p) return;

    document.getElementById('modalChiTietPhieuTitle').innerHTML = `<i class="bi bi-receipt me-2"></i>Chi Tiết Phiếu: ${escapeHtml(p.maPhieu)}`;

    let itemsHtml = (p.chiTietList || []).map((ct, idx) => {
        const nsx = ct.ngaySanXuat ? new Date(ct.ngaySanXuat).toLocaleDateString('vi-VN') : '—';
        const hsd = ct.ngayHetHan ? new Date(ct.ngayHetHan).toLocaleDateString('vi-VN') : '—';
        const ncc = p.donViCungCap || '—';
        const soLo = ct.soLo || '—';
        const ghiChu = ct.ghiChu || '—';

        return `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${escapeHtml(ct.maVatLieu)}</strong> - ${escapeHtml(ct.tenVatLieu)}</td>
                <td class="text-center">${escapeHtml(ct.donViTinh || '-')}</td>
                <td class="text-end font-monospace fw-bold">${ct.soLuong.toLocaleString('vi-VN')}</td>
                <td class="text-end">${ct.donGia > 0 ? ct.donGia.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                <td class="text-end fw-bold text-primary">${ct.thanhTien > 0 ? ct.thanhTien.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2 small shadow-none" onclick="toggleItemExtraRow(${idx})" id="btnToggleRow_${idx}" title="Mở rộng/Thu gọn thông tin chi tiết">
                        <i class="bi bi-chevron-down me-1" id="iconToggleRow_${idx}"></i>Chi tiết
                    </button>
                </td>
            </tr>
            <tr id="extraRow_${idx}" class="bg-light d-none">
                <td colspan="7" class="p-3">
                    <div class="card card-body border-0 shadow-sm bg-white rounded-3 small text-dark py-2 px-3">
                        <div class="row g-2">
                            <div class="col-md-3">
                                <div class="text-muted small"><i class="bi bi-layers text-primary me-1"></i>Số Lô (Lot):</div>
                                <div class="fw-bold">${escapeHtml(soLo)}</div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-muted small"><i class="bi bi-calendar-event text-info me-1"></i>Ngày sản xuất:</div>
                                <div class="fw-semibold">${nsx}</div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-muted small"><i class="bi bi-calendar-x text-danger me-1"></i>Ngày hết hạn:</div>
                                <div class="fw-semibold text-danger">${hsd}</div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-muted small"><i class="bi bi-truck text-success me-1"></i>Nhà cung cấp:</div>
                                <div class="fw-semibold">${escapeHtml(ncc)}</div>
                            </div>
                            ${ghiChu !== '—' ? `
                            <div class="col-12 border-top pt-2 mt-1">
                                <span class="text-muted me-2"><i class="bi bi-card-text text-secondary me-1"></i>Ghi chú:</span>
                                <span class="fst-italic text-dark">${escapeHtml(ghiChu)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    let totalVal = (p.chiTietList || []).reduce((sum, item) => sum + (item.thanhTien || 0), 0);

    document.getElementById('modalChiTietPhieuBody').innerHTML = `
        <div class="row mb-3">
            <div class="col-md-6">
                <div><strong>Người lập:</strong> ${escapeHtml(p.nguoiTao)}</div>
                <div><strong>Ngày tạo:</strong> ${p.ngayTao ? new Date(p.ngayTao).toLocaleString('vi-VN') : '-'}</div>
                ${p.donViCungCap ? `<div><strong>Nhà cung cấp:</strong> ${escapeHtml(p.donViCungCap)}</div>` : ''}
            </div>
            <div class="col-md-6 text-md-end">
                <div><strong>Lý do / Ghi chú:</strong> ${escapeHtml(p.lyDo || 'Không có')}</div>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered align-middle small mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="text-center">#</th>
                        <th>Vật tư</th>
                        <th class="text-center">ĐVT</th>
                        <th class="text-end">Số lượng</th>
                        <th class="text-end">Đơn giá</th>
                        <th class="text-end">Thành tiền</th>
                        <th class="text-center">Thông tin</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr class="table-light">
                        <td colspan="5" class="text-end fw-bold">Tổng cộng:</td>
                        <td class="text-end fw-bold text-danger fs-6">${totalVal.toLocaleString('vi-VN')} đ</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    document.getElementById('modalChiTietPhieuFooter').innerHTML = `
        <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
        <button class="btn btn-danger btn-sm" onclick="bootstrap.Modal.getInstance(document.getElementById('modalChiTietPhieu'))?.hide(); tuChoiPhieuGiaoDich(${p.id});">
            <i class="bi bi-x-lg me-1"></i>Từ chối
        </button>
        <button class="btn btn-success btn-sm" onclick="bootstrap.Modal.getInstance(document.getElementById('modalChiTietPhieu'))?.hide(); duyetPhieuGiaoDich(${p.id});">
            <i class="bi bi-check-lg me-1"></i>Duyệt Phiếu Này
        </button>
    `;

    new bootstrap.Modal(document.getElementById('modalChiTietPhieu')).show();
}

function toggleItemExtraRow(idx) {
    const row = document.getElementById(`extraRow_${idx}`);
    const icon = document.getElementById(`iconToggleRow_${idx}`);
    const btn = document.getElementById(`btnToggleRow_${idx}`);

    if (!row) return;

    if (row.classList.contains('d-none')) {
        row.classList.remove('d-none');
        if (icon) icon.className = 'bi bi-chevron-up me-1';
        if (btn) {
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-secondary', 'text-white');
        }
    } else {
        row.classList.add('d-none');
        if (icon) icon.className = 'bi bi-chevron-down me-1';
        if (btn) {
            btn.classList.remove('btn-secondary', 'text-white');
            btn.classList.add('btn-outline-secondary');
        }
    }
}

function duyetPhieuGiaoDich(id) {
    const p = _phieuChoDuyetList.find(x => x.id === id);
    document.getElementById('confirmDuyetPhieuId').value = id;
    document.getElementById('confirmDuyetMaPhieuText').textContent = `Duyệt Phiếu: ${p ? p.maPhieu : id}`;
    new bootstrap.Modal(document.getElementById('modalConfirmDuyetPhieu')).show();
}

async function confirmDuyetPhieuSubmit() {
    const id = parseInt(document.getElementById('confirmDuyetPhieuId').value);
    if (!id) return;

    try {
        const result = await AdminAPI.duyetPhieu(id);
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmDuyetPhieu'))?.hide();

        if (result && result.success) {
            showToast(result.message, 'success');
            await loadPhieuChoDuyet();
        } else {
            showToast(result?.message || 'Không thể duyệt phiếu.', 'error');
        }
    } catch (e) {
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmDuyetPhieu'))?.hide();
        showToast('Lỗi: ' + e.message, 'error');
    }
}

function tuChoiPhieuGiaoDich(id) {
    const p = _phieuChoDuyetList.find(x => x.id === id);
    document.getElementById('confirmTuChoiPhieuId').value = id;
    document.getElementById('confirmTuChoiMaPhieuText').textContent = `Từ Chối Phiếu: ${p ? p.maPhieu : id}`;
    document.getElementById('confirmTuChoiLyDoInput').value = '';
    new bootstrap.Modal(document.getElementById('modalConfirmTuChoiPhieu')).show();
}

async function confirmTuChoiPhieuSubmit() {
    const id = parseInt(document.getElementById('confirmTuChoiPhieuId').value);
    if (!id) return;

    const lyDo = document.getElementById('confirmTuChoiLyDoInput').value.trim();

    try {
        const result = await AdminAPI.tuChoiPhieu(id, lyDo);
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmTuChoiPhieu'))?.hide();

        if (result && result.success) {
            showToast(result.message, 'success');
            await loadPhieuChoDuyet();
        } else {
            showToast(result?.message || 'Không thể từ chối phiếu.', 'error');
        }
    } catch (e) {
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmTuChoiPhieu'))?.hide();
        showToast('Lỗi: ' + e.message, 'error');
    }
}

function openRollbackModal(id, maPhieu) {
    document.getElementById('confirmRollbackPhieuId').value = id;
    document.getElementById('confirmRollbackMaPhieuText').textContent = `Hoàn Tác Phiếu: ${maPhieu || id}`;
    document.getElementById('confirmRollbackLyDoInput').value = '';

    const detailEl = document.getElementById('modalChiTietPhieu');
    const detailModal = bootstrap.Modal.getInstance(detailEl);

    const showRollback = () => {
        const rollbackModal = new bootstrap.Modal(document.getElementById('modalConfirmRollbackPhieu'));
        rollbackModal.show();
    };

    if (detailModal && detailEl.classList.contains('show')) {
        const onHidden = () => {
            detailEl.removeEventListener('hidden.bs.modal', onHidden);
            showRollback();
        };
        detailEl.addEventListener('hidden.bs.modal', onHidden);
        detailModal.hide();
    } else {
        showRollback();
    }
}

async function confirmRollbackPhieuSubmit() {
    const id = parseInt(document.getElementById('confirmRollbackPhieuId').value);
    if (!id) return;

    const lyDo = document.getElementById('confirmRollbackLyDoInput').value.trim();

    try {
        const result = await AdminAPI.rollbackPhieu(id, lyDo);
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmRollbackPhieu'))?.hide();

        if (result && result.success) {
            showToast(result.message, 'success');
            if (typeof loadSystemLog === 'function') {
                loadSystemLog(_logCurrentPage || 1);
            }
            if (typeof loadDashboardOverview === 'function') {
                loadDashboardOverview();
            }
        } else {
            showToast(result?.message || 'Không thể hoàn tác phiếu.', 'error');
        }
    } catch (e) {
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmRollbackPhieu'))?.hide();
        showToast('Lỗi: ' + e.message, 'error');
    }
}
