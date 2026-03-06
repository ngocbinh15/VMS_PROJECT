/**
 * dieuphoi.js — Dispatch (Điều Phối) logic for Phao module v3.1
 *
 * Requires DP_CONFIG defined inline (Razor) before this file:
 *   DP_CONFIG.urls.viTriByTuyen     — GET  /Phao/GetViTriByTuyenLuong?tuyenLuongId={id}
 *   DP_CONFIG.urls.viTriInfo        — GET  /Phao/GetViTriInfo/{id}
 *   DP_CONFIG.urls.submit           — POST /Phao/DieuPhoi
 *   DP_CONFIG.urls.checkViTriTrung  — GET  /Phao/CheckViTriTrung?viTriId={id}&excludePhaoId={id}
 *   DP_CONFIG.selectedThoiGian      — 'YYYY-MM-DD HH:mm' or '' (pre-selected time from URL)
 *
 * Features:
 *  1. Flatpickr date-time picker for NgàyThựcHiện (+ historical view reload)
 *  2. Loại trạng thái → conditional fields
 *  3. Cascading: Tuyến luồng → Vị trí phao BH via AJAX
 *  4. Duplicate position check on vị trí selection (AJAX)
 *  5. Checkbox batch select + submit
 *  6. Full validation before POST
 *  7. Custom confirm modal (no native alert/confirm)
 *  8. Toast notifications (success / error / warning)
 *  9. Time-based status: page reloads to show historical status
 */
(function () {
    'use strict';

    var TREN_LUONG = 'Trên luồng';
    var THU_HOI = 'Thu hồi';
    var isSubmitting = false;
    var fpInstance = null;

    /* ── modal promise resolver ── */
    var _modalResolve = null;

    /* ── Pre-selected time from URL (for historical view) ── */
    var _initialThoiGian = (typeof DP_CONFIG !== 'undefined' && DP_CONFIG.selectedThoiGian) || '';

    /* ── Init ── */
    document.addEventListener('DOMContentLoaded', function () {
        initDatePicker();
        wireLoaiTrangThaiEvents();
        wireCheckboxEvents();
        wireFilterEvents();
        wireSubmitEvent();
        wireModalEvents();
        updateSelectedCount();
    });

    /* ═══════════════════════════════════════════════════════
     * 1. Date picker — Ngày thực hiện sự kiện
     * ═══════════════════════════════════════════════════════ */
    function initDatePicker() {
        var el = document.getElementById('dpNgayThucHien');
        if (!el) return;

        if (typeof flatpickr === 'undefined') {
            console.error('[DieuPhoi] flatpickr not loaded — using native datetime-local fallback');
            el.type = 'datetime-local';
            el.removeAttribute('readonly');
            el.addEventListener('change', function () { el.classList.remove('is-invalid'); });
            return;
        }

        fpInstance = flatpickr(el, {
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd/m/Y',
            enableTime: false,
            allowInput: false,
            maxDate: 'today',
            locale: { firstDayOfWeek: 1 },
            defaultDate: _initialThoiGian || null,
            onChange: function () {
                el.classList.remove('is-invalid');
                var altInput = el.nextElementSibling;
                if (altInput) altInput.classList.remove('is-invalid');
            },
            onClose: function (selectedDates, dateStr) {
                // Khi người dùng đóng picker với giá trị khác lần trước → reload để hiển thị trạng thái lịch sử
                if (dateStr !== _initialThoiGian) {
                    reloadWithParams(true);
                }
            }
        });

        if (fpInstance && fpInstance.altInput) {
            fpInstance.altInput.style.cursor = 'pointer';
            fpInstance.altInput.placeholder = 'Chọn ngày…';
        }
    }

    function getSelectedDate() {
        var el = document.getElementById('dpNgayThucHien');
        return el ? el.value : '';
    }

    function getDateTimeForSubmit() {
        var raw = getSelectedDate(); // 'YYYY-MM-DD' or ''
        if (raw) {
            return raw; // Chỉ gửi yyyy-MM-dd, không thêm T00:00:00
        }
        return null; // Server sẽ dùng DateTime.Now
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
        var warnDiv = row.querySelector('.dp-vitri-warn');

        clearViTriWarning(ddlViTri, warnDiv);

        if (val === TREN_LUONG) {
            if (ddlTuyen) {
                ddlTuyen.disabled = false;
                ddlTuyen.classList.remove('is-invalid');
            }
            if (ddlViTri) {
                ddlViTri.disabled = !ddlTuyen || !ddlTuyen.value;
                ddlViTri.classList.remove('is-invalid');
            }
            if (txtDiaDiem) {
                txtDiaDiem.disabled = true;
                txtDiaDiem.value = '';
            }
            wireTuyenCascade(row);
        } else if (val === THU_HOI) {
            if (ddlTuyen) { ddlTuyen.disabled = true; ddlTuyen.value = ''; }
            if (ddlViTri) { ddlViTri.disabled = true; ddlViTri.innerHTML = '<option value="">-- Chọn vị trí --</option>'; }
            if (txtDiaDiem) {
                txtDiaDiem.disabled = false;
                txtDiaDiem.placeholder = 'Nơi thu hồi… (không bắt buộc)';
            }
        } else {
            if (ddlTuyen) { ddlTuyen.disabled = true; ddlTuyen.value = ''; }
            if (ddlViTri) { ddlViTri.disabled = true; ddlViTri.innerHTML = '<option value="">-- Chọn vị trí --</option>'; }
            if (txtDiaDiem) { txtDiaDiem.disabled = true; txtDiaDiem.value = ''; }
        }
    }

    /* ═══════════════════════════════════════════════════════
     * 3. Cascading: Tuyến luồng → Vị trí phao BH
     *    + duplicate position check on Vị trí change
     * ═══════════════════════════════════════════════════════ */
    function wireTuyenCascade(row) {
        var ddlTuyen = row.querySelector('.dp-tuyen-luong');
        var ddlViTri = row.querySelector('.dp-vitri-phao');
        if (!ddlTuyen || !ddlViTri) return;

        if (ddlTuyen._dpBound) return;
        ddlTuyen._dpBound = true;

        ddlTuyen.addEventListener('change', function () {
            var tuyenId = ddlTuyen.value;
            ddlTuyen.classList.remove('is-invalid');
            ddlViTri.classList.remove('is-invalid');
            var warnDiv = row.querySelector('.dp-vitri-warn');
            clearViTriWarning(ddlViTri, warnDiv);

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

        // Wire vị trí change → duplicate check (only once per row)
        if (!ddlViTri._dpBound) {
            ddlViTri._dpBound = true;
            ddlViTri.addEventListener('change', function () {
                ddlViTri.classList.remove('is-invalid');
                var warnDiv = row.querySelector('.dp-vitri-warn');
                clearViTriWarning(ddlViTri, warnDiv);

                var viTriId = ddlViTri.value;
                var phaoId = parseInt(row.dataset.phaoId);
                if (!viTriId) return;

                checkDuplicatePosition(parseInt(viTriId), phaoId, ddlViTri, warnDiv);
            });
        }
    }

    /* ═══════════════════════════════════════════════════════
     * 4. Duplicate position check — AJAX
     * ═══════════════════════════════════════════════════════ */
    function checkDuplicatePosition(viTriId, excludePhaoId, ddlViTri, warnDiv) {
        if (!DP_CONFIG.urls.checkViTriTrung) return;

        var url = DP_CONFIG.urls.checkViTriTrung
            + '?viTriId=' + viTriId
            + '&excludePhaoId=' + excludePhaoId;

        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.trung) {
                    if (ddlViTri) ddlViTri.classList.add('dp-warn-border');
                    if (warnDiv) {
                        warnDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> '
                            + 'Vị trí đã có phao <strong>' + escapeHtml(data.maPhao || data.tenPhao || '') + '</strong> đang hoạt động!';
                        warnDiv.style.display = 'block';
                    }
                    showToast('Vị trí này đã có phao "' + (data.maPhao || data.tenPhao || '') + '" đang trên luồng!', 'warning');
                }
            })
            .catch(function () {
                // Silently fail — server-side will catch it
            });
    }

    function clearViTriWarning(ddlViTri, warnDiv) {
        if (ddlViTri) ddlViTri.classList.remove('dp-warn-border');
        if (warnDiv) { warnDiv.style.display = 'none'; warnDiv.innerHTML = ''; }
    }

    /* ═══════════════════════════════════════════════════════
     * 5. Checkbox select-all / individual
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
     * 6. Filter / search
     * ═══════════════════════════════════════════════════════ */
    var _searchTimer = null;

    function wireFilterEvents() {
        var selTuyen = document.getElementById('dpTuyenLuongFilter');
        var inputSearch = document.getElementById('dpSearchInput');

        // Tuyến: reload trang (giữ thoiGian)
        if (selTuyen) selTuyen.addEventListener('change', function () { reloadWithParams(true); });

        // Search: client-side filter với debounce 300ms
        if (inputSearch) {
            inputSearch.addEventListener('input', function () {
                if (_searchTimer) clearTimeout(_searchTimer);
                _searchTimer = setTimeout(function () {
                    filterTableLocal(inputSearch.value.trim());
                }, 300);
            });
        }
    }

    /**
     * Lọc bảng phao phía client — ẩn/hiện các hàng dựa trên mã phao / tên phao.
     */
    function filterTableLocal(term) {
        var rows = document.querySelectorAll('#dpTableBody .dp-row');
        var lowerTerm = term.toLowerCase();
        var visibleCount = 0;

        rows.forEach(function (row) {
            if (!term) {
                row.style.display = '';
                visibleCount++;
                return;
            }
            var searchText = (row.getAttribute('data-search') || '').toLowerCase();
            if (searchText.indexOf(lowerTerm) !== -1) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Cập nhật số lượng hiển thị
        var countEl = document.getElementById('dpCountInfo');
        if (countEl) countEl.innerHTML = '<strong>' + visibleCount + '</strong> phao';
    }

    /**
     * Reload trang với các query params hiện tại.
     * @param {boolean} includeThoiGian - Nếu true, giữ thoiGian đang chọn; nếu false, reset về hiện tại.
     */
    function reloadWithParams(includeThoiGian) {
        var params = new URLSearchParams();
        var selTuyen = document.getElementById('dpTuyenLuongFilter');
        if (selTuyen && selTuyen.value) params.set('tuyenLuongId', selTuyen.value);
        if (includeThoiGian) {
            var tg = getSelectedDate();
            if (tg) params.set('thoiGian', tg);
        }
        var qs = params.toString();
        window.location.href = '/Phao/DieuPhoi' + (qs ? '?' + qs : '');
    }

    /* ═══════════════════════════════════════════════════════
     * 7. Custom Confirm Modal — returns Promise<boolean>
     * ═══════════════════════════════════════════════════════ */
    function wireModalEvents() {
        var overlay = document.getElementById('dpConfirmOverlay');
        var btnOk = document.getElementById('dpModalOk');
        var btnCancel = document.getElementById('dpModalCancel');

        if (btnOk) btnOk.addEventListener('click', function () { resolveModal(true); });
        if (btnCancel) btnCancel.addEventListener('click', function () { resolveModal(false); });

        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) resolveModal(false);
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && _modalResolve) resolveModal(false);
        });
    }

    function resolveModal(result) {
        var overlay = document.getElementById('dpConfirmOverlay');
        if (overlay) overlay.classList.remove('show');
        if (_modalResolve) {
            var fn = _modalResolve;
            _modalResolve = null;
            fn(result);
        }
    }

    /**
     * Show a custom confirm modal.
     * @param {string} title    — Modal title
     * @param {string} bodyHtml — Body content (supports HTML)
     * @param {object} [opts]   — { okText, cancelText, type: 'confirm'|'warning' }
     * @returns {Promise<boolean>}
     */
    function showConfirmModal(title, bodyHtml, opts) {
        opts = opts || {};
        var overlay = document.getElementById('dpConfirmOverlay');
        var elTitle = document.getElementById('dpModalTitle');
        var elBody = document.getElementById('dpModalBody');
        var elIcon = document.getElementById('dpModalIcon');
        var btnOk = document.getElementById('dpModalOk');
        var btnCancel = document.getElementById('dpModalCancel');

        if (elTitle) elTitle.textContent = title;
        if (elBody) elBody.innerHTML = bodyHtml;

        var isWarning = opts.type === 'warning';
        if (elIcon) {
            elIcon.className = 'dp-modal-icon ' + (isWarning ? 'dp-modal-icon-warning' : 'dp-modal-icon-confirm');
            elIcon.innerHTML = isWarning
                ? '<i class="bi bi-exclamation-triangle-fill"></i>'
                : '<i class="bi bi-question-circle-fill"></i>';
        }

        if (btnOk) {
            btnOk.className = 'dp-modal-btn ' + (isWarning ? 'dp-modal-btn-warn' : 'dp-modal-btn-ok');
            btnOk.textContent = opts.okText || 'Xác nhận';
        }
        if (btnCancel) btnCancel.textContent = opts.cancelText || 'Hủy';

        if (overlay) overlay.classList.add('show');

        return new Promise(function (resolve) {
            _modalResolve = resolve;
        });
    }

    /* ═══════════════════════════════════════════════════════
     * 8. Submit dispatch — full validation + AJAX POST
     * ═══════════════════════════════════════════════════════ */
    function wireSubmitEvent() {
        var btn = document.getElementById('dpSubmitBtn');
        if (!btn) return;

        btn.addEventListener('click', function () {
            if (isSubmitting) return;

            var ngay = getSelectedDate();

            // ── Collect & validate rows ──
            var rows = [];
            var hasError = false;
            var hasDuplicateWarning = false;

            document.querySelectorAll('.dp-check:checked').forEach(function (cb) {
                var tr = cb.closest('.dp-row');
                if (!tr) return;

                var phaoId = parseInt(tr.dataset.phaoId);
                var loaiTrangThai = tr.querySelector('.dp-loai-trang-thai');
                var ghiChu = tr.querySelector('.dp-ghi-chu');
                var diaDiem = tr.querySelector('.dp-dia-diem');
                var ddlTuyen = tr.querySelector('.dp-tuyen-luong');
                var ddlViTri = tr.querySelector('.dp-vitri-phao');
                var warnDiv = tr.querySelector('.dp-vitri-warn');

                if (!loaiTrangThai || !loaiTrangThai.value) {
                    if (loaiTrangThai) loaiTrangThai.classList.add('is-invalid');
                    hasError = true;
                }

                if (!ghiChu || !ghiChu.value) {
                    if (ghiChu) ghiChu.classList.add('is-invalid');
                    hasError = true;
                }

                var val = loaiTrangThai ? loaiTrangThai.value : '';

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

                // Detect duplicate warning
                if (warnDiv && warnDiv.style.display === 'block') {
                    hasDuplicateWarning = true;
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

            // ── Block if duplicate position ──
            if (hasDuplicateWarning) {
                showToast('Có phao bị trùng vị trí trên tuyến! Vui lòng chọn vị trí khác trước khi điều phối.', 'error');
                return;
            }

            // ── Confirm via custom modal ──
            var submitDateTime = getDateTimeForSubmit();
            var displayTime = ngay ? formatDateTimeVN(ngay) : 'Thời gian hiện tại (tự động)';
            var bodyHtml = '<div style="margin-bottom:8px;">'
                + 'Bạn sắp điều phối <strong>' + rows.length + '</strong> phao.'
                + '</div>'
                + '<div style="margin-bottom:8px;">'
                + '<span style="color:#64748b;">Thời gian sự kiện:</span> <strong>' + escapeHtml(displayTime) + '</strong>'
                + '</div>'
                + '<div style="font-size:.82rem;color:#94a3b8;">'
                + 'Mỗi phao sẽ tạo 1 bản ghi lịch sử hoạt động mới. Hành động này không thể hoàn tác.'
                + '</div>';

            showConfirmModal('Xác nhận điều phối', bodyHtml, {
                okText: 'Thực hiện điều phối',
                type: 'confirm'
            }).then(function (confirmed) {
                if (!confirmed) return;
                doSubmit(btn, rows, submitDateTime);
            });
        });
    }

    function doSubmit(btn, rows, submitDateTime) {
        isSubmitting = true;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý…';

        var payload = {
            items: rows,
            ngayThucHien: submitDateTime
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
    }

    /* ═══════════════════════════════════════════════════════
     * 9. Helpers
     * ═══════════════════════════════════════════════════════ */
    function formatDateVN(isoDate) {
        if (!isoDate) return '';
        var parts = isoDate.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    function formatDateTimeVN(val) {
        if (!val) return '';
        var parts = val.split('-');
        if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
        return val;
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
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
