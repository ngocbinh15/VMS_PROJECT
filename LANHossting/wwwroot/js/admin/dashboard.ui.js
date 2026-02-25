// ═══════════════════════════════════════════
// ADMIN DASHBOARD — UI Rendering
// Pure DOM rendering, ZERO fetch calls.
// ═══════════════════════════════════════════

/* ── Toast ────────────────────────────────── */
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast-custom ${type}`;
    el.innerHTML = `<i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-x-circle' : 'bi-info-circle'} me-2"></i>${msg}`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

/* ── Section Navigation ───────────────────── */
function switchSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(l => l.classList.remove('active'));

    const section = document.getElementById(sectionId);
    const link = document.querySelector(`.admin-sidebar .nav-link[data-section="${sectionId}"]`);
    if (section) section.classList.add('active');
    if (link) link.classList.add('active');
}

/* ── Format helpers ───────────────────────── */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(val) {
    if (val == null || val === '') return '0';
    return Number(val).toLocaleString('vi-VN');
}

function statusBadge(status) {
    if (status === 'Hoạt động')     return `<span class="badge-status badge-active">${status}</span>`;
    if (status === 'Bị khóa')       return `<span class="badge-status badge-locked">${status}</span>`;
    if (status === 'Đã xóa')        return `<span class="badge-status badge-deleted">${status}</span>`;
    if (status === 'Ngừng sử dụng') return `<span class="badge-status badge-locked">${status}</span>`;
    return `<span class="badge-status">${status}</span>`;
}

function actionLabel(action) {
    const map = {
        'TAO': 'Tạo mới', 'SUA': 'Cập nhật', 'XOA': 'Xóa',
        'DOI_ROLE': 'Đổi vai trò', 'RESET_PASS': 'Reset mật khẩu',
        'KHOA': 'Khóa', 'MO_KHOA': 'Mở khóa'
    };
    return map[action] || action;
}

function entityLabel(entity) {
    const map = { 'TAI_KHOAN': 'Tài khoản', 'VAT_LIEU': 'Vật liệu', 'VAI_TRO': 'Vai trò' };
    return map[entity] || entity;
}

/* ══════════════════════════════════════════
   DASHBOARD OVERVIEW
   ══════════════════════════════════════════ */
function renderDashboardStats(accounts, materials) {
    const totalAccounts = accounts ? accounts.length : 0;
    const activeAccounts = accounts ? accounts.filter(a => a.trangThai === 'Hoạt động').length : 0;
    const totalMaterials = materials ? materials.length : 0;

    document.getElementById('statTotalAccounts').textContent = totalAccounts;
    document.getElementById('statActiveAccounts').textContent = activeAccounts;
    document.getElementById('statTotalMaterials').textContent = totalMaterials;
}

/* ══════════════════════════════════════════
   TÀI KHOẢN TABLE
   ══════════════════════════════════════════ */
function renderTaiKhoanTable(accounts) {
    const tbody = document.getElementById('taiKhoanTableBody');
    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">
            <i class="bi bi-people d-block mb-2" style="font-size:2rem;opacity:.3"></i>Chưa có tài khoản nào</td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map((tk, i) => `
        <tr>
            <td class="text-center">${i + 1}</td>
            <td><strong>${escapeHtml(tk.tenDangNhap)}</strong></td>
            <td>${escapeHtml(tk.hoTen)}</td>
            <td>${escapeHtml(tk.email || '-')}</td>
            <td>${escapeHtml(tk.soDienThoai || '-')}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary" style="font-size:.75rem">${escapeHtml(tk.tenVaiTro)}</span></td>
            <td>${statusBadge(tk.trangThai)}</td>
            <td class="text-nowrap">
                <button class="btn btn-action btn-outline-primary me-1" title="Sửa" onclick="openEditTaiKhoan(${tk.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-action btn-outline-warning me-1" title="${tk.trangThai === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}" onclick="toggleTaiKhoanStatus(${tk.id})">
                    <i class="bi bi-${tk.trangThai === 'Hoạt động' ? 'lock' : 'unlock'}"></i>
                </button>
                <button class="btn btn-action btn-outline-secondary me-1" title="Reset mật khẩu" onclick="openResetPassword(${tk.id}, '${escapeHtml(tk.tenDangNhap)}')">
                    <i class="bi bi-key"></i>
                </button>
                <button class="btn btn-action btn-outline-danger" title="Xóa" onclick="confirmDeleteTaiKhoan(${tk.id}, '${escapeHtml(tk.tenDangNhap)}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/* ══════════════════════════════════════════
   VẬT LIỆU TABLE
   ══════════════════════════════════════════ */
function renderVatLieuTable(materials) {
    const tbody = document.getElementById('vatLieuTableBody');
    if (!materials || materials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">
            <i class="bi bi-box d-block mb-2" style="font-size:2rem;opacity:.3"></i>Chưa có vật liệu nào</td></tr>`;
        return;
    }

    tbody.innerHTML = materials.map((vl, i) => `
        <tr>
            <td class="text-center">${i + 1}</td>
            <td><strong>${escapeHtml(vl.maVatLieu)}</strong></td>
            <td>${escapeHtml(vl.tenVatLieu)}</td>
            <td>${escapeHtml(vl.tenNhomVatLieu || '-')}</td>
            <td>${escapeHtml(vl.tenDonViTinh)}</td>
            <td class="text-end">${formatCurrency(vl.donGia)}</td>
            <td class="text-end">${vl.mucToiThieu != null ? formatCurrency(vl.mucToiThieu) : '-'}</td>
            <td>${statusBadge(vl.trangThai)}</td>
            <td class="text-nowrap">
                <button class="btn btn-action btn-outline-primary me-1" title="Sửa" onclick="openEditVatLieu(${vl.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-action btn-outline-danger" title="Ngừng sử dụng" onclick="confirmDeleteVatLieu(${vl.id}, '${escapeHtml(vl.tenVatLieu)}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/* ══════════════════════════════════════════
   VẬT LIỆU SEARCH/FILTER
   ══════════════════════════════════════════ */
function filterVatLieuTable(searchText) {
    const rows = document.querySelectorAll('#vatLieuTableBody tr');
    const term = (searchText || '').toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

/* ══════════════════════════════════════════
   NHẬT KÝ HỆ THỐNG TABLE
   ══════════════════════════════════════════ */
function renderSystemLogTable(data) {
    const tbody = document.getElementById('systemLogTableBody');
    const items = data.items || [];

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-journal d-block mb-2" style="font-size:2rem;opacity:.3"></i>Không có nhật ký</td></tr>`;
        renderLogPagination(data);
        return;
    }

    tbody.innerHTML = items.map(log => `
        <tr>
            <td class="text-nowrap">${formatDateTime(log.thoiGian)}</td>
            <td>${escapeHtml(log.nguoiThucHien)}</td>
            <td><span class="badge bg-secondary bg-opacity-10 text-dark" style="font-size:.75rem">${actionLabel(log.hanhDong)}</span></td>
            <td>${entityLabel(log.doiTuong)}</td>
            <td class="text-center">${log.doiTuongId || '-'}</td>
            <td>${escapeHtml(log.moTa || '-')}</td>
            <td class="text-muted">${escapeHtml(log.diaChiIP || '-')}</td>
        </tr>
    `).join('');

    renderLogPagination(data);
}

function renderLogPagination(data) {
    const container = document.getElementById('logPagination');
    const totalPages = Math.ceil((data.totalCount || 0) / (data.pageSize || 20));
    const currentPage = data.page || 1;

    let html = `<span>Trang ${currentPage}/${totalPages || 1} — ${data.totalCount || 0} bản ghi</span>`;
    html += `<div class="d-flex gap-1">`;
    html += `<button class="btn btn-sm btn-outline-secondary btn-page" ${currentPage <= 1 ? 'disabled' : ''} onclick="loadSystemLog(${currentPage - 1})"><i class="bi bi-chevron-left"></i></button>`;
    html += `<button class="btn btn-sm btn-outline-secondary btn-page" ${currentPage >= totalPages ? 'disabled' : ''} onclick="loadSystemLog(${currentPage + 1})"><i class="bi bi-chevron-right"></i></button>`;
    html += `</div>`;

    container.innerHTML = html;
}

/* ══════════════════════════════════════════
   VAI TRÒ DROPDOWN (for modals)
   ══════════════════════════════════════════ */
function renderVaiTroDropdown(selectId, roles, selectedId) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">-- Chọn vai trò --</option>';
    if (roles) {
        roles.forEach(r => {
            sel.innerHTML += `<option value="${r.id}" ${r.id === selectedId ? 'selected' : ''}>${escapeHtml(r.tenVaiTro)} (${escapeHtml(r.maVaiTro)})</option>`;
        });
    }
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
}
