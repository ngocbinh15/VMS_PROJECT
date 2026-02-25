/* ═══════════════════════════════════════════════════════
   KHO DASHBOARD — UI Layer
   Module: Quản Lý Kho
   Render table, update UI, format data — Không fetch, không gắn event
   ═══════════════════════════════════════════════════════ */
'use strict';

// ═══ NOTIFICATION SYSTEM ═══════════════════════════════
var _toastIcons = {
    success: 'bi-check-circle-fill',
    error:   'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill'
};

function showToast(type, message, duration) {
    if (duration === undefined) duration = 4000;
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast-custom toast-' + type;
    toast.innerHTML =
        '<i class="bi ' + (_toastIcons[type] || _toastIcons.error) + ' toast-icon"></i>' +
        '<div class="toast-body">' + message + '</div>' +
        '<button class="toast-close" onclick="dismissToast(this.parentElement)">&times;</button>';
    container.appendChild(toast);
    var timer = setTimeout(function () { dismissToast(toast); }, duration);
    toast._timer = timer;
}

function dismissToast(el) {
    if (!el || el.classList.contains('toast-hiding')) return;
    clearTimeout(el._timer);
    el.classList.add('toast-hiding');
    el.addEventListener('animationend', function () { el.remove(); });
}

// ═══ INLINE VALIDATION ═════════════════════════════════
function showInlineError(inputId, message) {
    clearInlineError(inputId);
    var input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('is-invalid-custom');
    var err = document.createElement('div');
    err.className = 'inline-error';
    err.id = inputId + '_err';
    err.innerHTML = '<i class="bi bi-exclamation-circle"></i>' + message;
    var parent = input.closest('.col-md-6, .col-md-3, .col-md-4, .mb-3, .position-relative, .input-group');
    if (parent && parent.parentElement) {
        parent.parentElement.appendChild(err);
    } else {
        input.parentElement.appendChild(err);
    }
    input.addEventListener('input', function handler() {
        clearInlineError(inputId);
        input.removeEventListener('input', handler);
    }, { once: true });
}

function clearInlineError(inputId) {
    var input = document.getElementById(inputId);
    if (input) input.classList.remove('is-invalid-custom');
    var errEl = document.getElementById(inputId + '_err');
    if (errEl) errEl.remove();
}

// ═══ CONFIRM DIALOG ═══════════════════════════════════
function showConfirm(title, message, onYes) {
    var backdrop = document.createElement('div');
    backdrop.className = 'confirm-modal-backdrop';
    backdrop.innerHTML =
        '<div class="confirm-modal-box">' +
            '<h6>' + title + '</h6>' +
            '<p>' + message + '</p>' +
            '<div class="d-flex gap-2 justify-content-center">' +
                '<button class="btn btn-light rounded-3 fw-bold px-4" id="confirmNo">H\u1ee7y</button>' +
                '<button class="btn btn-danger rounded-3 fw-bold px-4" id="confirmYes">\u0110\u1ed3ng \u00fd</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(backdrop);
    backdrop.querySelector('#confirmNo').onclick = function () { backdrop.remove(); };
    backdrop.querySelector('#confirmYes').onclick = function () { backdrop.remove(); onYes(); };
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });
}

// ═══ HELPERS ═══════════════════════════════════════════
function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function searchMatch(text, query) {
    var t = removeDiacritics(text.toLowerCase());
    var q = removeDiacritics(query.toLowerCase());
    return t.includes(q);
}

function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══ MAIN TABLE RENDERING ═════════════════════════════
function renderEmptyTable() {
    var tbody = document.getElementById('materialTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">' +
        '<i class="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>' +
        'Vui l\u00f2ng ch\u1ecdn kho \u0111\u1ec3 xem t\u1ed3n kho' +
        '</td></tr>';
    document.getElementById('totalItems').textContent = '0';
    document.getElementById('totalStock').textContent = '0';
    document.getElementById('totalValue').textContent = '0 \u0111';
    document.getElementById('displayCount').textContent = '0';
    document.getElementById('pagination').innerHTML = '';
}

function renderTable() {
    var tbody = document.getElementById('materialTableBody');
    var start = (currentPage - 1) * itemsPerPage;
    var end = start + itemsPerPage;
    var paginatedData = stockData.slice(start, end);

    tbody.innerHTML = '';
    var totalStock = 0;
    var totalValue = 0;

    if (stockData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">' +
            '<i class="bi bi-box-seam fs-1 d-block mb-2 opacity-50"></i>' +
            'Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u t\u1ed3n kho cho kho n\u00e0y' +
            '</td></tr>';
    } else {
        paginatedData.forEach(function (item, index) {
            var stock = item.soLuongTon || 0;
            var khaDung = item.soLuongKhaDung != null ? item.soLuongKhaDung : stock;
            var donGia = item.donGia || 0;
            var thanhTien = stock * donGia;
            totalStock += stock;
            totalValue += thanhTien;
            var stt = start + index + 1;

            var row = '<tr class="animate-fade-in">' +
                '<td class="ps-4 text-center text-muted">' + stt + '</td>' +
                '<td><span class="badge bg-secondary bg-opacity-10 text-dark px-2 py-1">' + item.maVatLieu + '</span></td>' +
                '<td>' + item.tenVatLieu + '</td>' +
                '<td><span class="text-muted">' + item.donViTinh + '</span></td>' +
                '<td class="text-end currency-num">' + donGia.toLocaleString('vi-VN', { minimumFractionDigits: 2 }) + '</td>' +
                '<td class="text-center"><span class="badge ' + (stock < 10 ? 'bg-danger' : 'bg-success') + ' rounded-pill px-3">' + stock.toLocaleString('vi-VN') + '</span></td>' +
                '<td class="text-center"><span class="badge ' + (khaDung < 10 ? 'bg-warning text-dark' : 'bg-info text-dark') + ' rounded-pill px-3">' + khaDung.toLocaleString('vi-VN') + '</span></td>' +
                '<td class="text-end pe-4 fw-bold currency-num">' + thanhTien.toLocaleString('vi-VN') + '</td>' +
                '</tr>';
            tbody.innerHTML += row;
        });
    }

    // Total stats from all stock data (not just paginated)
    totalStock = stockData.reduce(function (sum, i) { return sum + (i.soLuongTon || 0); }, 0);
    totalValue = stockData.reduce(function (sum, i) {
        var qty = i.soLuongTon || 0;
        var price = i.donGia || 0;
        return sum + (qty * price);
    }, 0);

    document.getElementById('totalItems').textContent = stockData.length;
    document.getElementById('totalStock').textContent = totalStock.toLocaleString('vi-VN');
    document.getElementById('totalValue').textContent = totalValue.toLocaleString('vi-VN') + ' \u0111';
    document.getElementById('displayCount').textContent = stockData.length;
    renderPagination();
}

function renderPagination() {
    var totalPages = Math.ceil(stockData.length / itemsPerPage);
    var pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (var i = 1; i <= totalPages; i++) {
        pagination.innerHTML += '<button class="btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-outline-secondary') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
}

// ═══ SEARCH RENDERING ══════════════════════════════════
function renderSearchDropdown(results, containerId, onClickTemplate) {
    var dropdown = document.getElementById(containerId);
    dropdown.innerHTML = '';
    if (results.length > 0) {
        results.slice(0, 5).forEach(function (mat) {
            dropdown.innerHTML += onClickTemplate(mat);
        });
        dropdown.style.display = 'block';
    } else {
        dropdown.innerHTML = '<div class="text-muted text-center p-3">Kh\u00f4ng t\u00ecm th\u1ea5y v\u1eadt t\u01b0</div>';
        dropdown.style.display = 'block';
    }
}

// ═══ DRAFT LIST RENDERING ══════════════════════════════
function renderDraftList() {
    var tbody = document.getElementById('sessionListBody');
    tbody.innerHTML = '';
    var totalQty = 0;
    var totalAmount = 0;

    draftTransactions.forEach(function (item, index) {
        var actionColor = item.loaiPhieu === 'NHAP' ? 'success' : item.loaiPhieu === 'XUAT' ? 'danger' : 'warning';
        var thanhTien = item.soLuong * (item.donGia || 0);
        totalQty += item.soLuong;
        totalAmount += thanhTien;

        var row = '<tr>' +
            '<td class="ps-3">' +
                '<div class="fw-bold">' + item.tenVatLieu + '</div>' +
                '<small class="text-muted">' + item.maVatLieu + '</small>' +
            '</td>' +
            '<td class="text-center"><span class="badge bg-' + actionColor + '">' + item.loaiPhieu + '</span></td>' +
            '<td class="text-end fw-bold">' + item.soLuong.toLocaleString('vi-VN') + '</td>' +
            '<td class="text-end">' + (item.donGia || 0).toLocaleString('vi-VN') + '</td>' +
            '<td class="text-end fw-bold text-primary">' + thanhTien.toLocaleString('vi-VN') + '</td>' +
            '<td class="text-end pe-3"><button class="btn btn-sm btn-outline-danger" onclick="removeDraft(' + index + ')"><i class="bi bi-trash"></i></button></td>' +
            '</tr>';
        tbody.innerHTML += row;
    });

    document.getElementById('draftCount').textContent = draftTransactions.length + ' m\u1ee5c';
    var emptyEl = document.getElementById('emptyState');
    emptyEl.style.display = draftTransactions.length === 0 ? 'flex' : 'none';

    // Cập nhật summary
    var summaryDiv = document.getElementById('draftSummary');
    if (draftTransactions.length > 0) {
        summaryDiv.classList.remove('d-none');
        document.getElementById('summaryCount').textContent = draftTransactions.length;
        document.getElementById('summaryQty').textContent = totalQty.toLocaleString('vi-VN');
        document.getElementById('summaryTotal').textContent = totalAmount.toLocaleString('vi-VN') + ' \u0111';
    } else {
        summaryDiv.classList.add('d-none');
    }
}

// ═══ NHẬT KÝ TABLE RENDERING ═══════════════════════════
function renderNhatKyTable(data) {
    var tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    var emptyMsg = document.getElementById('emptyHistoryMsg');
    var pagArea = document.getElementById('nkPaginationArea');

    if (!data.items || data.items.length === 0) {
        emptyMsg.classList.remove('d-none');
        pagArea.style.display = 'none';
        return;
    }

    emptyMsg.classList.add('d-none');

    data.items.forEach(function (p) {
        var loaiColor = 'secondary';
        var loaiLabel = p.loaiPhieu;
        if (p.loaiPhieu === 'NHAP_KHO') { loaiColor = 'success'; loaiLabel = 'Nh\u1eadp kho'; }
        else if (p.loaiPhieu === 'XUAT_KHO') { loaiColor = 'danger'; loaiLabel = 'Xu\u1ea5t kho'; }
        else if (p.loaiPhieu === 'CHUYEN_KHO') { loaiColor = 'warning'; loaiLabel = 'Chuy\u1ec3n kho'; }

        var khoText = p.tenKhoNguon || '';
        if (p.loaiPhieu === 'CHUYEN_KHO' && p.tenKhoNhap) {
            khoText = p.tenKhoNguon + ' \u2192 ' + p.tenKhoNhap;
        }

        var ngay = p.ngayThucHien ? new Date(p.ngayThucHien) : null;
        var ngayStr = ngay ? (ngay.getDate().toString().padStart(2, '0') + '/' + (ngay.getMonth() + 1).toString().padStart(2, '0') + '/' + ngay.getFullYear() + ' ' + ngay.getHours().toString().padStart(2, '0') + ':' + ngay.getMinutes().toString().padStart(2, '0')) : '';

        var row = '<tr style="cursor:pointer" onclick="showTransactionDetail(' + p.phieuId + ')">';
        row += '<td class="ps-3 fw-semibold text-primary">' + escapeHtml(p.maPhieu) + '</td>';
        row += '<td><span class="badge bg-' + loaiColor + '">' + loaiLabel + '</span></td>';
        row += '<td>' + escapeHtml(khoText) + '</td>';
        row += '<td>' + escapeHtml(p.nguoiThucHien) + '</td>';
        row += '<td>' + ngayStr + '</td>';
        row += '<td class="text-center"><span class="badge bg-light text-dark">' + p.tongSoVatTu + '</span></td>';
        row += '<td class="text-end pe-3"><button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();showTransactionDetail(' + p.phieuId + ')"><i class="bi bi-eye me-1"></i>Xem</button></td>';
        row += '</tr>';
        tbody.innerHTML += row;
    });

    renderNhatKyPagination(data);
}

function renderNhatKyPagination(data) {
    var pagArea = document.getElementById('nkPaginationArea');
    var pagInfo = document.getElementById('nkPaginationInfo');
    var pagList = document.getElementById('nkPaginationList');

    if (data.totalPages <= 1) {
        pagArea.style.display = 'none';
        pagInfo.textContent = 'T\u1ed5ng: ' + data.totalCount + ' phi\u1ebfu';
        if (data.totalCount > 0) {
            pagArea.style.display = '';
            pagArea.classList.remove('d-none');
        }
        pagList.innerHTML = '';
        return;
    }

    pagArea.style.display = '';
    pagArea.classList.remove('d-none');

    var start = (data.page - 1) * data.pageSize + 1;
    var end = Math.min(data.page * data.pageSize, data.totalCount);
    pagInfo.textContent = 'Hi\u1ec3n th\u1ecb ' + start + '-' + end + ' / ' + data.totalCount + ' phi\u1ebfu';

    pagList.innerHTML = '';

    // Previous
    var prevLi = document.createElement('li');
    prevLi.className = 'page-item' + (data.page <= 1 ? ' disabled' : '');
    prevLi.innerHTML = '<a class="page-link" href="#" onclick="event.preventDefault();loadNhatKy(' + (data.page - 1) + ')">\u2039</a>';
    pagList.appendChild(prevLi);

    // Page numbers (show max 5 around current)
    var startPage = Math.max(1, data.page - 2);
    var endPage = Math.min(data.totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (var i = startPage; i <= endPage; i++) {
        var li = document.createElement('li');
        li.className = 'page-item' + (i === data.page ? ' active' : '');
        li.innerHTML = '<a class="page-link" href="#" onclick="event.preventDefault();loadNhatKy(' + i + ')">' + i + '</a>';
        pagList.appendChild(li);
    }

    // Next
    var nextLi = document.createElement('li');
    nextLi.className = 'page-item' + (data.page >= data.totalPages ? ' disabled' : '');
    nextLi.innerHTML = '<a class="page-link" href="#" onclick="event.preventDefault();loadNhatKy(' + (data.page + 1) + ')">\u203a</a>';
    pagList.appendChild(nextLi);
}

// ═══ TRANSACTION DETAIL RENDERING ═══════════════════════
function renderTransactionDetailView(data) {
    // Header
    var loaiColor = 'secondary';
    var loaiLabel = data.loaiPhieu;
    if (data.loaiPhieu === 'NHAP_KHO') { loaiColor = 'success'; loaiLabel = 'NH\u1eacP KHO'; }
    else if (data.loaiPhieu === 'XUAT_KHO') { loaiColor = 'danger'; loaiLabel = 'XU\u1ea4T KHO'; }
    else if (data.loaiPhieu === 'CHUYEN_KHO') { loaiColor = 'warning'; loaiLabel = 'CHUY\u1ec2N KHO'; }

    var headerEl = document.getElementById('detailModalHeader');
    headerEl.className = 'modal-header border-0 px-4 pt-3 pb-2';
    if (loaiColor === 'success') headerEl.style.background = '#d1e7dd';
    else if (loaiColor === 'danger') headerEl.style.background = '#f8d7da';
    else if (loaiColor === 'warning') headerEl.style.background = '#fff3cd';
    else headerEl.style.background = '#e2e3e5';

    document.getElementById('detailModalTitle').textContent = data.maPhieu + ' \u2014 ' + loaiLabel;

    var ngay = data.ngayThucHien ? new Date(data.ngayThucHien) : null;
    var ngayStr = ngay ? (ngay.getDate().toString().padStart(2, '0') + '/' + (ngay.getMonth() + 1).toString().padStart(2, '0') + '/' + ngay.getFullYear() + ' ' + ngay.getHours().toString().padStart(2, '0') + ':' + ngay.getMinutes().toString().padStart(2, '0')) : '';
    document.getElementById('detailModalSubtitle').textContent = ngayStr + ' | ' + data.nguoiThucHien;

    // Info cards
    var cardsHtml = '';
    var khoText = data.tenKhoNguon || '';
    if (data.loaiPhieu === 'CHUYEN_KHO' && data.tenKhoNhap) khoText += ' \u2192 ' + data.tenKhoNhap;
    cardsHtml += '<div class="col-auto"><span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-building me-1"></i>' + escapeHtml(khoText) + '</span></div>';
    cardsHtml += '<div class="col-auto"><span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-person me-1"></i>' + escapeHtml(data.nguoiThucHien) + '</span></div>';
    cardsHtml += '<div class="col-auto"><span class="badge bg-' + loaiColor + ' px-3 py-2">' + loaiLabel + '</span></div>';
    if (data.ghiChu) cardsHtml += '<div class="col-auto"><span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-chat-text me-1"></i>' + escapeHtml(data.ghiChu) + '</span></div>';
    document.getElementById('detailInfoCards').innerHTML = cardsHtml;

    // Detail table
    var tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '';

    if (!data.chiTiet || data.chiTiet.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Kh\u00f4ng c\u00f3 chi ti\u1ebft</td></tr>';
    } else {
        data.chiTiet.forEach(function (item) {
            var actionColor = 'secondary';
            var actionLabel = item.loaiThayDoi;
            if (item.loaiThayDoi === 'NHAP') { actionColor = 'success'; actionLabel = 'NH\u1eacP'; }
            else if (item.loaiThayDoi === 'XUAT') { actionColor = 'danger'; actionLabel = 'XU\u1ea4T'; }
            else if (item.loaiThayDoi === 'CHUYEN_DI') { actionColor = 'warning'; actionLabel = 'CHUY\u1ec2N \u0110I'; }
            else if (item.loaiThayDoi === 'CHUYEN_DEN') { actionColor = 'info'; actionLabel = 'CHUY\u1ec2N \u0110\u1ebeN'; }

            var changeSign = item.soLuongThayDoi >= 0 ? '+' : '';
            var changeColor = item.soLuongThayDoi >= 0 ? 'text-success' : 'text-danger';

            var khoInfo = escapeHtml(item.tenKho);
            if (item.tenKhoLienQuan) {
                if (item.loaiThayDoi === 'CHUYEN_DI') khoInfo += ' \u2192 ' + escapeHtml(item.tenKhoLienQuan);
                else if (item.loaiThayDoi === 'CHUYEN_DEN') khoInfo = escapeHtml(item.tenKhoLienQuan) + ' \u2192 ' + escapeHtml(item.tenKho);
            }

            var tg = item.thoiGian ? new Date(item.thoiGian) : null;
            var tgStr = tg ? (tg.getHours().toString().padStart(2, '0') + ':' + tg.getMinutes().toString().padStart(2, '0') + ':' + tg.getSeconds().toString().padStart(2, '0')) : '';

            var row = '<tr>';
            row += '<td class="ps-3"><div class="fw-semibold">' + escapeHtml(item.tenVatLieu) + '</div><small class="text-muted">' + escapeHtml(item.maVatLieu) + ' | ' + escapeHtml(item.donViTinh) + '</small></td>';
            row += '<td>' + khoInfo + '</td>';
            row += '<td class="text-center"><span class="badge bg-' + actionColor + '">' + actionLabel + '</span></td>';
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

// ═══ EXCEL EXPORT — HTML Builder ═══════════════════════
// Builds HTML-table with Excel xmlns directives, formulas, mso-number-format
// 17 columns — EXACT format from spec
/** Chuẩn hóa tên sheet — giữ nguyên Unicode tiếng Việt, chỉ loại ký tự Excel cấm */
function normalizeSheetName(name) {
    if (!name) return 'Sheet';
    // Loại ký tự không hợp lệ của Excel: \ / ? * [ ]
    name = name.replace(/[\\\/\?\*\[\]]/g, '');
    // Giới hạn 31 ký tự (max của Excel)
    if (name.length > 31) {
        name = name.substring(0, 31);
    }
    return name;
}

function buildExcelHtmlForKho(whName, khoData) {
    var date = new Date();
    var dateStr = 'Ng\u00e0y ' + date.getDate() + ' th\u00e1ng ' + (date.getMonth() + 1) + ' n\u0103m ' + date.getFullYear();

    var startRow = 7;
    var endRow = startRow + khoData.length - 1;

    var h = '';
    h += '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    h += '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><meta charset="UTF-8">';
    h += '<style>';
    h += 'table{border-collapse:collapse;width:100%;font-family:"Times New Roman",Times,serif;font-size:11pt}';
    h += 'td,th{border:1px solid #000;padding:5px;text-align:center;vertical-align:middle}';
    h += '.text-left{text-align:left}.text-right{text-align:right}';
    h += '.header-title{font-size:20px;font-weight:bold;text-transform:uppercase;border:none!important}';
    h += '.no-border{border:none!important}.bold{font-weight:bold}';
    h += 'tr.gray-row th:nth-child(-n+17), tr.gray-row td:nth-child(-n+17){background-color:#f0f0f0;font-weight:bold;}';
    h += '</style>';
    h += '</head>';
    h += '<body><table>';

    h += '<colgroup>';
    h += '<col style="width:35px"/>';
    h += '<col style="width:80px"/>';
    h += '<col style="width:250px"/>';
    h += '<col style="width:50px"/>';
    h += '<col style="width:100px"/>';
    h += '<col style="width:60px"/>';
    h += '<col style="width:120px"/>';
    h += '<col style="width:60px"/>';
    h += '<col style="width:120px"/>';
    h += '<col style="width:60px"/>';
    h += '<col style="width:120px"/>';
    h += '<col style="width:60px"/>';
    h += '<col style="width:120px"/>';
    h += '<col style="width:80px"/>';
    h += '<col style="width:90px"/>';
    h += '<col style="width:90px"/>';
    h += '<col style="width:80px"/>';
    h += '</colgroup>';

    h += '<tr><td colspan="17" class="header-title no-border" style="text-align:center;font-weight:bold;font-size:25px">BI\u00caN B\u1ea2N KI\u1ec2M K\u00ca V\u1eacT T\u01af TH\u00c0NH PH\u1ea8M</td></tr>';
    h += '<tr><td colspan="17" class="no-border" style="text-align:center;font-weight:bold;">Th\u1eddi \u0111i\u1ec3m ki\u1ec3m k\u00ea: ' + dateStr + ' - Kho: ' + whName + '</td></tr>';
    h += '<tr><td colspan="17" class="no-border"></td></tr>';

    h += '<tr class="gray-row">';
    h += '<th rowspan="2">STT</th><th rowspan="2">M\u00e3 VT</th><th rowspan="2" style="width:250px">T\u00ean nh\u00e3n hi\u1ec7u, quy c\u00e1ch</th><th rowspan="2">\u0110VT</th><th rowspan="2">\u0110\u01a1n gi\u00e1</th>';
    h += '<th colspan="2">Theo s\u1ed5 k\u1ebf to\u00e1n</th><th colspan="2">Ki\u1ec3m k\u00ea</th><th colspan="2">Th\u1eeba</th><th colspan="2">Thi\u1ebfu</th>';
    h += '<th rowspan="2">C\u00f2n t\u1ed1t 100%</th><th rowspan="2">K\u00e9m ph\u1ea9m ch\u1ea5t</th><th rowspan="2">M\u1ea5t ph\u1ea9m ch\u1ea5t</th><th rowspan="2">Ghi ch\u00fa</th>';
    h += '</tr>';

    h += '<tr class="gray-row">';
    h += '<th>SL</th><th>Th\u00e0nh ti\u1ec1n</th><th>SL</th><th>Th\u00e0nh ti\u1ec1n</th><th>SL</th><th>Th\u00e0nh ti\u1ec1n</th><th>SL</th><th>Th\u00e0nh ti\u1ec1n</th>';
    h += '</tr>';

    /* Row 6 — Column labels */
    h += '<tr style="font-style:italic;text-align:center">';
    h += '<td>A</td><td>B</td><td>C</td><td>D</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td><td>13</td>';
    h += '</tr>';

    // DATA ROWS
    khoData.forEach(function (item, index) {
        var stock = item.soLuongTon || 0;
        var price = item.donGia || 0;
        var cr = startRow + index;
        h += '<tr>';
        h += '<td>' + (index + 1) + '</td>';
        h += '<td class="text-left" style="mso-number-format:\'\\@@\'">' + item.maVatLieu + '</td>';
        h += '<td class="text-left">' + item.tenVatLieu + '</td>';
        h += '<td>' + item.donViTinh + '</td>';
        h += '<td class="text-right" x:num="' + price + '" style="mso-number-format:\'#,##0.00\'">' + price + '</td>';
        h += '<td class="text-center" x:num="' + stock + '">' + stock + '</td>';
        h += '<td class="text-right" x:num x:fmla="=F' + cr + '*E' + cr + '" style="mso-number-format:\'#,##0.00\'"></td>';
        h += '<td></td>';
        h += '<td class="text-right" x:num x:fmla="=H' + cr + '*E' + cr + '" style="mso-number-format:\'#,##0.00\'"></td>';
        h += '<td></td>';
        h += '<td class="text-right" x:num x:fmla="=J' + cr + '*E' + cr + '" style="mso-number-format:\'#,##0.00\'"></td>';
        h += '<td></td>';
        h += '<td class="text-right" x:num x:fmla="=L' + cr + '*E' + cr + '" style="mso-number-format:\'#,##0.00\'"></td>';
        h += '<td></td><td></td><td></td><td></td>';
        h += '</tr>';
    });

    // TOTAL ROW
    h += '<tr style="font-weight:bold">';
    h += '<td colspan="5" class="text-center">C\u1ed8NG</td>';
    h += '<td></td>';
    h += '<td x:num x:fmla="=SUM(G' + startRow + ':G' + endRow + ')" style="mso-number-format:\'\\#\\,\\#\\#0\';text-align:right"></td>';
    h += '<td></td>';
    h += '<td x:num x:fmla="=SUM(I' + startRow + ':I' + endRow + ')" style="mso-number-format:\'\\#\\,\\#\\#0\';text-align:right"></td>';
    h += '<td></td>';
    h += '<td x:num x:fmla="=SUM(K' + startRow + ':K' + endRow + ')" style="mso-number-format:\'\\#\\,\\#\\#0\';text-align:right"></td>';
    h += '<td></td>';
    h += '<td x:num x:fmla="=SUM(M' + startRow + ':M' + endRow + ')" style="mso-number-format:\'\\#\\,\\#\\#0\';text-align:right"></td>';
    h += '<td></td><td></td><td></td><td></td>';
    h += '</tr>';

    h += '</table></body></html>';
    return h;
}

// ═══ MHTML Multi-sheet Builder ═════════════════════════
// Each sheet is 100% identical to per-file export (reuses buildExcelHtmlForKho)
function buildMhtmlWorkbook(sheets) {
    var boundary = '----=_NextPart_VMS';
    var nl = '\r\n';

    // Sheet definitions for ExcelWorkbook XML
    var sheetDefs = '';
    for (var si = 0; si < sheets.length; si++) {
        sheetDefs += '<x:ExcelWorksheet>';
        sheetDefs += '<x:Name>' + sheets[si].name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</x:Name>';
        sheetDefs += '<x:WorksheetSource HRef="sheet' + (si + 1) + '.htm"/>';
        sheetDefs += '</x:ExcelWorksheet>';
    }

    // Main index document
    var mainDoc = '';
    mainDoc += '<html xmlns:o="urn:schemas-microsoft-com:office:office"';
    mainDoc += ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
    mainDoc += ' xmlns="http://www.w3.org/TR/REC-html40">';
    mainDoc += '<head>';
    mainDoc += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
    mainDoc += '<xml>';
    mainDoc += '<x:ExcelWorkbook>';
    mainDoc += '<x:ExcelWorksheets>';
    mainDoc += sheetDefs;
    mainDoc += '</x:ExcelWorksheets>';
    mainDoc += '<x:FullCalculationOnLoad/>';
    mainDoc += '<x:ActiveSheet>0</x:ActiveSheet>';
    mainDoc += '<x:ProtectStructure>False</x:ProtectStructure>';
    mainDoc += '<x:ProtectWindows>False</x:ProtectWindows>';
    mainDoc += '</x:ExcelWorkbook>';
    mainDoc += '</xml>';
    mainDoc += '</head>';
    mainDoc += '<body>';
    mainDoc += '</body>';
    mainDoc += '</html>';

    // Assemble MHTML
    var mhtml = '';
    mhtml += 'MIME-Version: 1.0' + nl;
    mhtml += 'X-Document-Type: Workbook' + nl;
    mhtml += 'Content-Type: multipart/related; boundary="' + boundary + '"' + nl;
    mhtml += nl;

    // Part 0: Main index document
    mhtml += '--' + boundary + nl;
    mhtml += 'Content-Location: file:///C:/WorkFiles/Book.htm' + nl;
    mhtml += 'Content-Type: text/html; charset="utf-8"' + nl;
    mhtml += nl;
    mhtml += mainDoc + nl;

    // Parts 1..N: Each sheet
    for (var si = 0; si < sheets.length; si++) {
        mhtml += '--' + boundary + nl;
        mhtml += 'Content-Location: file:///C:/WorkFiles/sheet' + (si + 1) + '.htm' + nl;
        mhtml += 'Content-Type: text/html; charset="utf-8"' + nl;
        mhtml += nl;
        mhtml += sheets[si].html + nl;
    }

    mhtml += '--' + boundary + '--';
    return mhtml;
}

// ═══ ADD MATERIAL FORM HELPERS ═════════════════════════
function populateAddMaterialDropdowns() {
    // NhomVatLieu dropdown
    var nhomSelect = document.getElementById('addMat_NhomVatLieu');
    nhomSelect.innerHTML = '<option value="">-- Ch\u1ecdn nh\u00f3m --</option>';
    allNhomVatLieu.forEach(function (n) {
        nhomSelect.innerHTML += '<option value="' + n.id + '">' + n.ten + '</option>';
    });

    // DonViTinh dropdown
    var dvtSelect = document.getElementById('addMat_DonViTinh');
    dvtSelect.innerHTML = '<option value="">-- Ch\u1ecdn \u0110VT --</option>';
    allDonViTinh.forEach(function (d) {
        dvtSelect.innerHTML += '<option value="' + d.id + '">' + d.ten + '</option>';
    });

    // Kho dropdown — pre-select current warehouse
    var khoSelect = document.getElementById('addMat_KhoId');
    khoSelect.innerHTML = '<option value="">-- Ch\u1ecdn kho --</option>';
    allWarehouses.forEach(function (wh) {
        var selected = (currentWarehouseId && wh.id === currentWarehouseId) ? ' selected' : '';
        khoSelect.innerHTML += '<option value="' + wh.id + '"' + selected + '>' + wh.tenKho + '</option>';
    });
}

function resetAddMaterialForm() {
    var form = document.getElementById('formThemVatTu');
    if (form) form.reset();
    var donGiaEl = document.getElementById('addMat_DonGia');
    if (donGiaEl) donGiaEl.value = '0';
    var alertEl = document.getElementById('addMatAlert');
    if (alertEl) alertEl.innerHTML = '';
    document.querySelectorAll('#addMaterialModal .is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
}
