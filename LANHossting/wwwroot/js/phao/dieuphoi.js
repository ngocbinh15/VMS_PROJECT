/**
 * dieuphoi.js — Dispatch (Điều Phối) logic for Phao module v2.1
 *
 * Requires DP_CONFIG defined inline (Razor) before this file:
 *   DP_CONFIG.urls.viTriByTuyen  — GET /Phao/GetViTriByTuyenLuong?tuyenLuongId={id}
 *   DP_CONFIG.urls.viTriInfo     — GET /Phao/GetViTriInfo/{id}
 *   DP_CONFIG.urls.submit        — POST /Phao/DieuPhoi
 *
 * Features:
 *  1. Flatpickr date picker for NgàyThựcHiện (mandatory)
 *  2. Loại trạng thái → conditional fields:
 *     - "Trên luồng" → enable Tuyến luồng + Vị trí phao BH (cascading)
 *     - "Thu hồi" → enable Địa điểm
 *     - Others → disable both
 *  3. Cascading: Tuyến luồng → load Vị trí phao BH via AJAX
 *  4. Checkbox batch select + submit
 *  5. Full validation before POST
 *  6. AJAX submit with history record creation
 */
(function () {
    'use strict';

    var TREN_LUONG = 'Trên luồng';
    var THU_HOI = 'Thu hồi';
    var isSubmitting = false;
    var fpInstance = null; // flatpickr instance

    /* ── Init ── */
    document.addEventListener('DOMContentLoaded', function () {
        initDatePicker();
        wireLoaiTrangThaiEvents();
        wireCheckboxEvents();
        wireFilterEvents();
        wireSubmitEvent();
        updateSelectedCount();
    });

    /* ═══════════════════════════════════════════════════════
     * 1. Date picker — Ngày thực hiện sự kiện (BẮT BUỘC)
     * ═══════════════════════════════════════════════════════ */
    function initDatePicker() {
        var el = document.getElementById('dpNgayThucHien');
        if (!el) return;

        // Guard: flatpickr must be loaded from CDN
        if (typeof flatpickr === 'undefined') {
            console.error('[DieuPhoi] flatpickr not loaded — using native datetime-local fallback');
            el.type = 'datetime-local';
            el.removeAttribute('readonly');
            el.addEventListener('change', function () { el.classList.remove('is-invalid'); });
            return;
        }

        fpInstance = flatpickr(el, {
            dateFormat: 'Y-m-d H:i',
            altInput: true,
            altFormat: 'd/m/Y H:i',
            enableTime: true,
            time_24hr: true,
            allowInput: false,
            maxDate: 'today',
            locale: { firstDayOfWeek: 1 },
            onChange: function () {
                el.classList.remove('is-invalid');
                var altInput = el.nextElementSibling;
                if (altInput) altInput.classList.remove('is-invalid');
            }
        });

        // Make alt input more obvious as a date-time picker
        if (fpInstance && fpInstance.altInput) {
            fpInstance.altInput.style.cursor = 'pointer';
            fpInstance.altInput.placeholder = 'Chọn ngày giờ…';
        }
    }

    function getSelectedDate() {
        var el = document.getElementById('dpNgayThucHien');
        return el ? el.value : ''; // format: 'YYYY-MM-DD HH:mm' or '' if empty
    }

    /// Build an ISO datetime string. If user didn't pick, use current datetime.
    function getDateTimeForSubmit() {
        var raw = getSelectedDate();
        if (raw) {
            // flatpickr returns 'YYYY-MM-DD HH:mm', convert to ISO for JSON
            return raw.replace(' ', 'T') + ':00';  // e.g. '2026-03-05T14:30:00'
        }
        // Fallback: current datetime
        return new Date().toISOString();
    }

    /* ═══════════════════════════════════════════════════════
     * 2. Loại trạng thái → conditional enable/disable
     * ═══════════════════════════════════════════════════════ */
    function wireLoaiTrangThaiEvents() {
        document.querySelectorAll('.dp-loai-trang-thai').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var row = sel.closest('.dp-row');
                if (!row) return;
                handleTrangThaiChange(row, sel.value);
                sel.classList.remove('is-invalid');
                if (sel.value) row.classList.add('dp-changed');
                else row.classList.remove('dp-changed');
                updateSelectedCount();
            });
        });
    }

    function handleTrangThaiChange(row, val) {
        var ddlTuyen = row.querySelector('.dp-tuyen-luong');
        var ddlViTri = row.querySelector('.dp-vitri-phao');
        var txtDiaDiem = row.querySelector('.dp-dia-diem');

        if (val === TREN_LUONG) {
            // Enable Tuyến + Vị trí, disable Địa điểm
            if (ddlTuyen) {
                ddlTuyen.disabled = false;
                ddlTuyen.classList.remove('is-invalid');
            }
            // Vị trí stays disabled until Tuyến is selected
            if (ddlViTri) {
                ddlViTri.disabled = !ddlTuyen || !ddlTuyen.value;
                ddlViTri.classList.remove('is-invalid');
            }
            if (txtDiaDiem) {
                txtDiaDiem.disabled = true;
                txtDiaDiem.value = '';
            }
            // Wire cascading tuyến → vị trí for this row
            wireTuyenCascade(row);
        } else if (val === THU_HOI) {
            // Enable Địa điểm, disable Tuyến + Vị trí
            if (ddlTuyen) { ddlTuyen.disabled = true; ddlTuyen.value = ''; }
            if (ddlViTri) { ddlViTri.disabled = true; ddlViTri.innerHTML = '<option value="">-- Chọn vị trí --</option>'; }
            if (txtDiaDiem) {
                txtDiaDiem.disabled = false;
                txtDiaDiem.placeholder = 'Nơi thu hồi… (không bắt buộc)';
            }
        } else {
            // Disable all conditional fields
            if (ddlTuyen) { ddlTuyen.disabled = true; ddlTuyen.value = ''; }
            if (ddlViTri) { ddlViTri.disabled = true; ddlViTri.innerHTML = '<option value="">-- Chọn vị trí --</option>'; }
            if (txtDiaDiem) { txtDiaDiem.disabled = true; txtDiaDiem.value = ''; }
        }
    }

    /* ═══════════════════════════════════════════════════════
     * 3. Cascading: Tuyến luồng → Vị trí phao BH
     * ═══════════════════════════════════════════════════════ */
    function wireTuyenCascade(row) {
        var ddlTuyen = row.querySelector('.dp-tuyen-luong');
        var ddlViTri = row.querySelector('.dp-vitri-phao');
        if (!ddlTuyen || !ddlViTri) return;

        // Avoid double-binding
        if (ddlTuyen._dpBound) return;
        ddlTuyen._dpBound = true;

        ddlTuyen.addEventListener('change', function () {
            var tuyenId = ddlTuyen.value;
            ddlTuyen.classList.remove('is-invalid');
            ddlViTri.classList.remove('is-invalid');

            if (!tuyenId) {
                ddlViTri.disabled = true;
                ddlViTri.innerHTML = '<option value="">-- Chọn vị trí --</option>';
                return;
            }

            ddlViTri.disabled = true;
            ddlViTri.innerHTML = '<option value="">Đang tải…</option>';

            fetch(DP_CONFIG.urls.viTriByTuyen + '?tuyenLuongId=' + tuyenId)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var html = '<option value="">-- Chọn vị trí --</option>';
                    data.forEach(function (v) {
                        html += '<option value="' + v.id + '">' + v.maPhaoBH + '</option>';
                    });
                    ddlViTri.innerHTML = html;
                    ddlViTri.disabled = false;
                })
                .catch(function () {
                    ddlViTri.innerHTML = '<option value="">Lỗi tải vị trí</option>';
                    ddlViTri.disabled = true;
                });
        });
    }

    /* ═══════════════════════════════════════════════════════
     * 4. Checkbox select-all / individual
     * ═══════════════════════════════════════════════════════ */
    function wireCheckboxEvents() {
        var checkAll = document.getElementById('dpCheckAll');
        if (checkAll) {
            checkAll.addEventListener('change', function () {
                document.querySelectorAll('.dp-check').forEach(function (cb) {
                    cb.checked = checkAll.checked;
                });
                updateSelectedCount();
            });
        }

        document.querySelectorAll('.dp-check').forEach(function (cb) {
            cb.addEventListener('change', function () {
                updateSelectedCount();
                if (checkAll) {
                    var total = document.querySelectorAll('.dp-check').length;
                    var checked = document.querySelectorAll('.dp-check:checked').length;
                    checkAll.checked = (checked === total && total > 0);
                    checkAll.indeterminate = (checked > 0 && checked < total);
                }
            });
        });
    }

    function updateSelectedCount() {
        var checked = document.querySelectorAll('.dp-check:checked').length;
        var el = document.getElementById('dpSelectedCount');
        if (el) el.innerHTML = 'Đã chọn: <strong>' + checked + '</strong> phao';
        var btn = document.getElementById('dpSubmitBtn');
        if (btn) btn.disabled = (checked === 0);
    }

    /* ═══════════════════════════════════════════════════════
     * 5. Filter / search
     * ═══════════════════════════════════════════════════════ */
    function wireFilterEvents() {
        var selTuyen = document.getElementById('dpTuyenLuongFilter');
        var inputSearch = document.getElementById('dpSearchInput');
        var btnRefresh = document.getElementById('dpRefreshBtn');

        function applyFilter() {
            var params = new URLSearchParams();
            if (selTuyen && selTuyen.value) params.set('tuyenLuongId', selTuyen.value);
            if (inputSearch && inputSearch.value.trim()) params.set('search', inputSearch.value.trim());
            var qs = params.toString();
            window.location.href = '/Phao/DieuPhoi' + (qs ? '?' + qs : '');
        }

        if (selTuyen) selTuyen.addEventListener('change', applyFilter);
        if (btnRefresh) btnRefresh.addEventListener('click', applyFilter);
        if (inputSearch) {
            inputSearch.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); applyFilter(); }
            });
        }
    }

    /* ═══════════════════════════════════════════════════════
     * 6. Submit dispatch — full validation + AJAX POST
     * ═══════════════════════════════════════════════════════ */
    function wireSubmitEvent() {
        var btn = document.getElementById('dpSubmitBtn');
        if (!btn) return;

        btn.addEventListener('click', function () {
            if (isSubmitting) return;

            // ── Validate ngày ──  (không bắt buộc nữa — nếu bỏ trống sẽ lấy DateTime.Now)
            var ngay = getSelectedDate();
            // Removed: hard-block when empty — now auto-fallback to DateTime.Now

            // ── Collect & validate rows ──
            var rows = [];
            var hasError = false;

            document.querySelectorAll('.dp-check:checked').forEach(function (cb) {
                var tr = cb.closest('.dp-row');
                if (!tr) return;

                var phaoId = parseInt(tr.dataset.phaoId);
                var loaiTrangThai = tr.querySelector('.dp-loai-trang-thai');
                var ghiChu = tr.querySelector('.dp-ghi-chu');
                var diaDiem = tr.querySelector('.dp-dia-diem');
                var ddlTuyen = tr.querySelector('.dp-tuyen-luong');
                var ddlViTri = tr.querySelector('.dp-vitri-phao');

                // Validate Loại trạng thái
                if (!loaiTrangThai || !loaiTrangThai.value) {
                    if (loaiTrangThai) loaiTrangThai.classList.add('is-invalid');
                    hasError = true;
                }

                // Validate Ghi chú
                if (!ghiChu || !ghiChu.value) {
                    if (ghiChu) ghiChu.classList.add('is-invalid');
                    hasError = true;
                }

                var val = loaiTrangThai ? loaiTrangThai.value : '';

                // Validate Tuyến + Vị trí khi "Trên luồng"
                if (val === TREN_LUONG) {
                    if (!ddlTuyen || !ddlTuyen.value) {
                        if (ddlTuyen) ddlTuyen.classList.add('is-invalid');
                        hasError = true;
                    }
                    if (!ddlViTri || !ddlViTri.value) {
                        if (ddlViTri) ddlViTri.classList.add('is-invalid');
                        hasError = true;
                    }
                }

                rows.push({
                    phaoId: phaoId,
                    loaiTrangThai: val,
                    ghiChu: ghiChu ? ghiChu.value : '',
                    diaDiem: (diaDiem && !diaDiem.disabled && diaDiem.value) ? diaDiem.value : null,
                    tuyenLuongId: (val === TREN_LUONG && ddlTuyen && ddlTuyen.value) ? parseInt(ddlTuyen.value) : null,
                    viTriPhaoBHId: (val === TREN_LUONG && ddlViTri && ddlViTri.value) ? parseInt(ddlViTri.value) : null
                });
            });

            if (hasError) {
                showToast('Vui lòng điền đầy đủ các trường bắt buộc cho các phao đã chọn.', 'error');
                return;
            }

            if (rows.length === 0) {
                showToast('Không có phao nào được chọn.', 'error');
                return;
            }

            // ── Confirm ──
            var submitDateTime = getDateTimeForSubmit();
            var displayTime = ngay ? formatDateTimeVN(ngay) : 'Thời gian hiện tại (tự động)';
            var msg = 'Xác nhận điều phối ' + rows.length + ' phao?\n'
                    + 'Thời gian sự kiện: ' + displayTime + '\n'
                    + 'Mỗi phao sẽ tạo 1 bản ghi lịch sử hoạt động mới.';
            if (!confirm(msg)) return;

            // ── POST ──
            isSubmitting = true;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý…';

            var payload = {
                items: rows,
                ngayThucHien: submitDateTime  // ISO datetime string e.g. '2026-03-05T14:30:00'
            };

            fetch(DP_CONFIG.urls.submit, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                isSubmitting = false;
                btn.innerHTML = '<i class="bi bi-send-fill me-1"></i>Thực hiện điều phối';

                if (data.success) {
                    showToast('Điều phối thành công ' + (data.count || rows.length) + ' phao! Lịch sử đã được ghi nhận.', 'success');
                    setTimeout(function () { window.location.reload(); }, 1200);
                } else {
                    showToast(data.error || 'Có lỗi xảy ra.', 'error');
                    btn.disabled = false;
                }
            })
            .catch(function (err) {
                isSubmitting = false;
                btn.innerHTML = '<i class="bi bi-send-fill me-1"></i>Thực hiện điều phối';
                btn.disabled = false;
                showToast('Lỗi kết nối: ' + err.message, 'error');
            });
        });
    }

    /* ═══════════════════════════════════════════════════════
     * 7. Helpers
     * ═══════════════════════════════════════════════════════ */
    function formatDateVN(isoDate) {
        if (!isoDate) return '';
        var parts = isoDate.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    function formatDateTimeVN(val) {
        if (!val) return '';
        // val format: 'YYYY-MM-DD HH:mm'
        var split = val.split(' ');
        var datePart = split[0] || '';
        var timePart = split[1] || '';
        var parts = datePart.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0] + (timePart ? ' ' + timePart : '');
    }

    function showToast(msg, type) {
        var toast = document.getElementById('dpToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = 'dp-toast dp-toast-' + (type || 'success');
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 4000);
    }

})();
