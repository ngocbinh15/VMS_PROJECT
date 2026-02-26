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

function loaiPhieuLabel(loai) {
    if (loai === 'NHAP_KHO')   return 'Nhập kho';
    if (loai === 'XUAT_KHO')   return 'Xuất kho';
    if (loai === 'CHUYEN_KHO') return 'Chuyển kho';
    return loai || '';
}

function loaiPhieuColor(loai) {
    if (loai === 'NHAP_KHO')   return 'success';
    if (loai === 'XUAT_KHO')   return 'danger';
    if (loai === 'CHUYEN_KHO') return 'warning';
    return 'secondary';
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
                    <i class="bi bi-${tk.trangThai === 'Hoạt động' ? 'unlock' : 'lock'}"></i>
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
                <button class="btn btn-action btn-outline-danger" title="Xóa vĩnh viễn" onclick="confirmDeleteVatLieu(${vl.id}, '${escapeHtml(vl.tenVatLieu)}')">
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
   NHẬT KÝ NHẬP – XUẤT – ĐIỀU CHUYỂN TABLE
   ══════════════════════════════════════════ */
function renderSystemLogTable(data) {
    const tbody = document.getElementById('systemLogTableBody');
    const items = data.items || [];

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-journal d-block mb-2" style="font-size:2rem;opacity:.3"></i>Không có phiếu nào</td></tr>`;
        renderLogPagination(data);
        return;
    }

    tbody.innerHTML = items.map(p => {
        let khoText = escapeHtml(p.tenKhoNguon || '');
        if (p.loaiPhieu === 'CHUYEN_KHO' && p.tenKhoNhap) {
            khoText = escapeHtml(p.tenKhoNguon) + ' → ' + escapeHtml(p.tenKhoNhap);
        }
        return `<tr style="cursor:pointer" onclick="showTransactionDetail(${p.phieuId})">
            <td class="ps-3 fw-semibold text-primary">${escapeHtml(p.maPhieu)}</td>
            <td><span class="badge bg-${loaiPhieuColor(p.loaiPhieu)}">${loaiPhieuLabel(p.loaiPhieu)}</span></td>
            <td>${khoText}</td>
            <td>${escapeHtml(p.nguoiThucHien)}</td>
            <td class="text-nowrap">${formatDateTime(p.ngayThucHien)}</td>
            <td class="text-center"><span class="badge bg-light text-dark">${p.tongSoVatTu}</span></td>
            <td>
                <button 
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center px-2 py-1"
                    onclick="event.stopPropagation();showTransactionDetail(${p.phieuId})">
                    <i class="bi bi-eye me-1"></i>
                    <span>Xem</span>
                </button>
            </td>
        </tr>`;
    }).join('');

    renderLogPagination(data);
}

function renderLogPagination(data) {
    const container = document.getElementById('logPagination');
    const totalPages = data.totalPages || Math.ceil((data.totalCount || 0) / (data.pageSize || 20));
    const currentPage = data.page || 1;

    let html = `<span>Trang ${currentPage}/${totalPages || 1} — ${data.totalCount || 0} phiếu</span>`;
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
function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
}

/* ══════════════════════════════════════════
   CHI TIẾT PHIẾU (EXACT same as Kho)
   ══════════════════════════════════════════ */
function renderTransactionDetailView(data) {
    // Header
    var loaiColor = 'secondary';
    var loaiLabel = data.loaiPhieu;
    if (data.loaiPhieu === 'NHAP_KHO') { loaiColor = 'success'; loaiLabel = 'NHẬP KHO'; }
    else if (data.loaiPhieu === 'XUAT_KHO') { loaiColor = 'danger'; loaiLabel = 'XUẤT KHO'; }
    else if (data.loaiPhieu === 'CHUYEN_KHO') { loaiColor = 'warning'; loaiLabel = 'CHUYỂN KHO'; }

    var headerEl = document.getElementById('detailModalHeader');
    headerEl.className = 'modal-header border-0 px-4 pt-4 pb-3 mb-2';
    if (loaiColor === 'success') headerEl.style.background = '#d1e7dd';
    else if (loaiColor === 'danger') headerEl.style.background = '#f8d7da';
    else if (loaiColor === 'warning') headerEl.style.background = '#fff3cd';
    else headerEl.style.background = '#e2e3e5';

    document.getElementById('detailModalTitle').textContent = data.maPhieu + ' — ' + loaiLabel;

    var ngay = data.ngayThucHien ? new Date(data.ngayThucHien) : null;
    var ngayStr = ngay ? (ngay.getDate().toString().padStart(2, '0') + '/' + (ngay.getMonth() + 1).toString().padStart(2, '0') + '/' + ngay.getFullYear() + ' ' + ngay.getHours().toString().padStart(2, '0') + ':' + ngay.getMinutes().toString().padStart(2, '0')) : '';
    document.getElementById('detailModalSubtitle').textContent = ngayStr + ' | ' + data.nguoiThucHien;

    // Info cards
    var cardsHtml = '';
    var khoText = data.tenKhoNguon || '';
    if (data.loaiPhieu === 'CHUYEN_KHO' && data.tenKhoNhap) khoText += ' → ' + data.tenKhoNhap;
    cardsHtml += '<div class="col-auto"><span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-building me-1"></i>' + escapeHtml(khoText) + '</span></div>';
    cardsHtml += '<div class="col-auto"><span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-person me-1"></i>' + escapeHtml(data.nguoiThucHien) + '</span></div>';
    cardsHtml += '<div class="col-auto"><span class="badge bg-' + loaiColor + ' px-3 py-2">' + loaiLabel + '</span></div>';
    if (data.ghiChu) cardsHtml += '<div class="col-auto"><span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-chat-text me-1"></i>' + escapeHtml(data.ghiChu) + '</span></div>';
    document.getElementById('detailInfoCards').innerHTML = cardsHtml;

    // Detail table
    var tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '';

    if (!data.chiTiet || data.chiTiet.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Không có chi tiết</td></tr>';
    } else {
        data.chiTiet.forEach(function (item) {
            var actionColor = 'secondary';
            var actionLbl = item.loaiThayDoi;
            if (item.loaiThayDoi === 'NHAP') { actionColor = 'success'; actionLbl = 'NHẬP'; }
            else if (item.loaiThayDoi === 'XUAT') { actionColor = 'danger'; actionLbl = 'XUẤT'; }
            else if (item.loaiThayDoi === 'CHUYEN_DI') { actionColor = 'warning'; actionLbl = 'CHUYỂN ĐI'; }
            else if (item.loaiThayDoi === 'CHUYEN_DEN') { actionColor = 'info'; actionLbl = 'CHUYỂN ĐẾN'; }

            var changeSign = item.soLuongThayDoi >= 0 ? '+' : '';
            var changeColor = item.soLuongThayDoi >= 0 ? 'text-success' : 'text-danger';

            var khoInfo = escapeHtml(item.tenKho);
            if (item.tenKhoLienQuan) {
                if (item.loaiThayDoi === 'CHUYEN_DI') khoInfo += ' → ' + escapeHtml(item.tenKhoLienQuan);
                else if (item.loaiThayDoi === 'CHUYEN_DEN') khoInfo = escapeHtml(item.tenKhoLienQuan) + ' → ' + escapeHtml(item.tenKho);
            }

            var tg = item.thoiGian ? new Date(item.thoiGian) : null;
            var tgStr = tg ? (tg.getHours().toString().padStart(2, '0') + ':' + tg.getMinutes().toString().padStart(2, '0') + ':' + tg.getSeconds().toString().padStart(2, '0')) : '';

            var row = '<tr>';
            row += '<td class="ps-3"><div class="fw-semibold">' + escapeHtml(item.tenVatLieu) + '</div><small class="text-muted">' + escapeHtml(item.maVatLieu) + ' | ' + escapeHtml(item.donViTinh) + '</small></td>';
            row += '<td>' + khoInfo + '</td>';
            row += '<td class="text-center"><span class="badge bg-' + actionColor + '">' + actionLbl + '</span></td>';
            row += '<td class="text-end">' + formatNumber(item.soLuongTruoc) + '</td>';
            row += '<td class="text-end fw-bold ' + changeColor + '">' + changeSign + formatNumber(item.soLuongThayDoi) + '</td>';
            row += '<td class="text-end fw-bold">' + formatNumber(item.soLuongSau) + '</td>';
            row += '<td>' + tgStr + '</td>';
            row += '<td class="text-end pe-3">' + escapeHtml(item.nguoiThucHien) + '</td>';
            row += '</tr>';
            tbody.innerHTML += row;
        });
    }
}
