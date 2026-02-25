// ═══════════════════════════════════════════
// ADMIN DASHBOARD — Events & Orchestration
// Binds UI events → calls API → updates UI.
// ═══════════════════════════════════════════

/* ── State ────────────────────────────────── */
let _accounts = [];
let _materials = [];
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
    if (!confirm(`Bạn chắc chắn muốn XÓA tài khoản "${tenDangNhap}"?\nHành động này không thể hoàn tác.`)) return;

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

function openEditVatLieu(id) {
    const vl = _materials.find(m => m.id === id);
    if (!vl) return;

    document.getElementById('editVatLieuTitle').textContent = `Sửa: ${vl.maVatLieu} — ${vl.tenVatLieu}`;
    document.getElementById('editVatLieuId').value = vl.id;
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
    if (!confirm(`Bạn chắc chắn muốn NGỪNG SỬ DỤNG vật liệu "${tenVatLieu}"?`)) return;

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
   NHẬT KÝ HỆ THỐNG
   ══════════════════════════════════════════ */
async function loadSystemLog(page) {
    page = page || 1;
    _logCurrentPage = page;

    const params = { page: page, pageSize: 20 };

    const tuNgay = document.getElementById('logTuNgay')?.value;
    const denNgay = document.getElementById('logDenNgay')?.value;
    const hanhDong = document.getElementById('logHanhDong')?.value;
    const doiTuong = document.getElementById('logDoiTuong')?.value;

    if (tuNgay) params.tuNgay = tuNgay;
    if (denNgay) params.denNgay = denNgay;
    if (hanhDong) params.hanhDong = hanhDong;
    if (doiTuong) params.doiTuong = doiTuong;

    try {
        const data = await AdminAPI.getSystemLog(params);
        renderSystemLogTable(data || { items: [], totalCount: 0, page: 1, pageSize: 20 });
    } catch (e) {
        showToast('Lỗi tải nhật ký: ' + e.message, 'error');
    }
}

function resetLogFilters() {
    document.getElementById('logTuNgay').value = '';
    document.getElementById('logDenNgay').value = '';
    document.getElementById('logHanhDong').value = '';
    document.getElementById('logDoiTuong').value = '';
    loadSystemLog(1);
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
