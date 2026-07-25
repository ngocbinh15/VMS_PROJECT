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

    // Bind search inputs
    const vatLieuSearch = document.getElementById('vatLieuSearchInput');
    if (vatLieuSearch) {
        vatLieuSearch.addEventListener('input', () => filterVatLieuTable(vatLieuSearch.value));
    }
});

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
        case 'sectionSystemLog':
            _logCurrentPage = 1;
            await loadSystemLog(1);
            break;
    }
}

/* ══════════════════════════════════════════
   DASHBOARD OVERVIEW
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
    } catch (e) {
        showToast('Lỗi tải dữ liệu tổng quan: ' + e.message, 'error');
    }
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
        try { _nhomVatLieuList = await AdminAPI.getNhomVatLieu() || []; } catch (_) {}
    }
    if (_donViTinhList.length === 0) {
        try { _donViTinhList = await AdminAPI.getDonViTinh() || []; } catch (_) {}
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

function openEditVatLieu(id) {
    const vl = _materials.find(m => m.id === id);
    if (!vl) return;

    document.getElementById('editVatLieuTitle').textContent = `Sửa: ${vl.maVatLieu} — ${vl.tenVatLieu}`;
    document.getElementById('editVatLieuId').value = vl.id;
    document.getElementById('editMaVatLieu').value = vl.maVatLieu;
    document.getElementById('editTenVatLieu').value = vl.tenVatLieu;
    document.getElementById('editDonGia').value = vl.donGia;
    document.getElementById('editMucToiThieu').value = vl.mucToiThieu ?? '';
    document.getElementById('editMucToiDa').value = vl.mucToiDa ?? '';
    document.getElementById('editMoTa').value = '';

    new bootstrap.Modal(document.getElementById('vatLieuModal')).show();
}

async function saveVatLieu() {
    const id = parseInt(document.getElementById('editVatLieuId').value);
    const vl = _materials.find(m => m.id === id);
    if (!vl) return;

    try {
        const result = await AdminAPI.updateVatLieu({
            id: id,
            maVatLieu: document.getElementById('editMaVatLieu').value.trim(),
            tenVatLieu: document.getElementById('editTenVatLieu').value.trim(),
            nhomVatLieuId: vl.nhomVatLieuId,
            donViTinhId: vl.donViTinhId,
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
    const search = document.getElementById('logSearchVatLieu')?.value?.trim();

    if (tuNgay) params.set('tuNgay', tuNgay);
    if (denNgay) params.set('denNgay', denNgay);
    if (khoId) params.set('khoId', khoId);
    if (loai) params.set('loaiThayDoi', loai);
    if (search) params.set('searchVatLieu', search);

    try {
        const data = await AdminAPI.getLichSuKho(params.toString());
        renderSystemLogTable(data || { items: [], totalCount: 0, page: 1, pageSize: 20 });
    } catch (e) {
        showToast('Lỗi tải nhật ký: ' + e.message, 'error');
    }
}

function resetLogFilters() {
    document.getElementById('logTuNgay').value = '';
    document.getElementById('logDenNgay').value = '';
    document.getElementById('logKho').value = '';
    document.getElementById('logLoaiPhieu').value = '';
    document.getElementById('logSearchVatLieu').value = '';
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
