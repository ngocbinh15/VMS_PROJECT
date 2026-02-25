/* ═══════════════════════════════════════════════════════
   KHO DASHBOARD — Events & Orchestration Layer
   Module: Quản Lý Kho
   addEventListener, bind event, gọi API, gọi UI
   ═══════════════════════════════════════════════════════ */
'use strict';

console.log('%c[Dashboard] JS loaded successfully', 'color: green; font-weight: bold');

// ═══ GLOBAL STATE ══════════════════════════════════════
var currentWarehouseId = null;
var currentAction = null;
var draftTransactions = [];
var allWarehouses = [];
var allNhomVatLieu = [];
var allDonViTinh = [];
var stockData = [];
var currentPage = 1;
var itemsPerPage = 20;
var _searchTimer = null;
var _modalSearchTimer = null;
var nkCurrentPage = 1;

// ═══ DEBOUNCE HELPER ═══════════════════════════════════
function debounce(fn, timerId, delay) {
    if (delay === undefined) delay = 300;
    if (timerId === 'main') { clearTimeout(_searchTimer); _searchTimer = setTimeout(fn, delay); }
    else { clearTimeout(_modalSearchTimer); _modalSearchTimer = setTimeout(fn, delay); }
}

// ═══ INITIALIZATION ════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {
    await loadWarehouses();
    await loadNhomVatLieu();
    await loadDonViTinh();

    // Setup add material modal events
    var addModal = document.getElementById('addMaterialModal');
    addModal.addEventListener('show.bs.modal', populateAddMaterialDropdowns);
    addModal.addEventListener('hidden.bs.modal', resetAddMaterialForm);
    addModal.querySelectorAll('.form-control, .form-select').forEach(function (el) {
        el.addEventListener('input', function () { el.classList.remove('is-invalid'); });
        el.addEventListener('change', function () { el.classList.remove('is-invalid'); });
    });
});

// ═══ DATA LOADING (API → State) ════════════════════════
async function loadWarehouses() {
    try {
        allWarehouses = await KhoAPI.getDanhSachKho();
        var selector = document.getElementById('warehouseSelector');
        var transferSelector = document.getElementById('transferToWarehouse');
        selector.innerHTML = '<option value="">-- Ch\u1ecdn Kho --</option>';
        transferSelector.innerHTML = '<option value="">-- Ch\u1ecdn kho \u0111\u00edch --</option>';
        allWarehouses.forEach(function (wh) {
            var prefix = wh.loaiKho === 'KHO_ME' ? '\u2605 ' : '  \u2514 ';
            selector.innerHTML += '<option value="' + wh.id + '">' + prefix + wh.tenKho + '</option>';
            transferSelector.innerHTML += '<option value="' + wh.id + '">' + wh.tenKho + '</option>';
        });
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}

async function loadNhomVatLieu() {
    try {
        allNhomVatLieu = await KhoAPI.getNhomVatLieu();
    } catch (error) {
        console.error('Error loading nhom vat lieu:', error);
    }
}

async function loadDonViTinh() {
    try {
        allDonViTinh = await KhoAPI.getDonViTinh();
    } catch (error) {
        console.error('Error loading don vi tinh:', error);
    }
}

async function loadStockData() {
    if (!currentWarehouseId) return;
    try {
        console.log('Loading stock data for warehouse ID:', currentWarehouseId);
        var result = await KhoAPI.getTonKho(currentWarehouseId);
        console.log('Response status:', result.status);
        console.log('Response data:', result.data);

        if (!result.ok) {
            console.error('API Error:', result.data.message || 'Unknown error');
            stockData = [];
            renderTable();
            return;
        }

        if (Array.isArray(result.data)) {
            stockData = result.data;
        } else {
            console.error('Response is not an array:', result.data);
            stockData = [];
        }

        console.log('Stock data loaded:', stockData.length, 'items');
        renderTable();
    } catch (error) {
        console.error('Error loading stock:', error);
        stockData = [];
        renderTable();
    }
}

// ═══ WAREHOUSE SWITCH ══════════════════════════════════
async function switchWarehouse() {
    var selector = document.getElementById('warehouseSelector');
    currentWarehouseId = selector.value ? parseInt(selector.value) : null;
    if (currentWarehouseId) {
        await loadStockData();
        document.getElementById('selectedWarehouseName').textContent = selector.options[selector.selectedIndex].text.trim();
    } else {
        stockData = [];
        renderEmptyTable();
    }
}

// ═══ PAGINATION EVENT ══════════════════════════════════
function goToPage(page) {
    currentPage = page;
    renderTable();
}

// ═══ SEARCH (MAIN TABLE) ══════════════════════════════
function searchMaterial() {
    var query = document.getElementById('searchInput').value.trim();
    if (query.length === 0) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }

    var results = stockData.filter(function (m) {
        return searchMatch(m.maVatLieu, query) || searchMatch(m.tenVatLieu, query);
    });
    var dropdown = document.getElementById('searchResults');
    dropdown.innerHTML = '';
    if (results.length > 0) {
        results.slice(0, 5).forEach(function (mat) {
            dropdown.innerHTML += '<div class="result-item" onclick="selectMaterialFromSearch(' + mat.vatLieuId + ')">' +
                '<span><strong>' + mat.maVatLieu + '</strong> - ' + mat.tenVatLieu + '</span>' +
                '<span class="badge bg-' + (mat.soLuongTon < 10 ? 'danger' : 'success') + '">' + mat.soLuongTon + '</span>' +
                '</div>';
        });
        dropdown.style.display = 'block';
    } else {
        dropdown.innerHTML = '<div class="text-muted text-center p-3">Kh\u00f4ng t\u00ecm th\u1ea5y v\u1eadt t\u01b0</div>';
        dropdown.style.display = 'block';
    }
}

function selectMaterialFromSearch(id) {
    openActionModal(id);
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').style.display = 'none';
}

// ═══ ACTION MODAL ══════════════════════════════════════
function openActionModal(materialId) {
    if (!currentWarehouseId) {
        showToast('warning', 'Vui l\u00f2ng ch\u1ecdn kho tr\u01b0\u1edbc khi th\u1ef1c hi\u1ec7n giao d\u1ecbch!');
        return;
    }
    var selector = document.getElementById('warehouseSelector');
    var whName = selector.options[selector.selectedIndex] ? selector.options[selector.selectedIndex].text.trim() : '';
    document.getElementById('modalWarehouseName').textContent = whName;

    var modal = new bootstrap.Modal(document.getElementById('actionModal'));
    modal.show();
    if (materialId) {
        var mat = stockData.find(function (m) { return m.vatLieuId === materialId; });
        if (mat) {
            document.getElementById('materialSearch').value = mat.maVatLieu + ' - ' + mat.tenVatLieu;
            document.getElementById('materialSearch').dataset.materialId = materialId;
            document.getElementById('selectedMaterialId').value = materialId;
            document.getElementById('materialSearch').setAttribute('readonly', true);
            document.getElementById('donGiaInput').value = (mat.donGia > 0) ? mat.donGia : 0;
            applyDonGiaReadonly();
        }
    }
}

function applyDonGiaReadonly() {
    var donGiaInput = document.getElementById('donGiaInput');
    if (currentAction === 'NHAP') {
        donGiaInput.removeAttribute('readonly');
        donGiaInput.classList.remove('bg-light');
    } else {
        var materialId = parseInt(document.getElementById('selectedMaterialId').value);
        if (materialId) {
            var stockItem = stockData.find(function (s) { return s.vatLieuId === materialId; });
            if (stockItem && stockItem.donGia > 0) {
                donGiaInput.value = stockItem.donGia;
            }
        }
        donGiaInput.setAttribute('readonly', true);
        donGiaInput.classList.add('bg-light');
    }
}

function clearMaterialSelection() {
    var input = document.getElementById('materialSearch');
    input.dataset.materialId = '';
    document.getElementById('selectedMaterialId').value = '';
    input.value = '';
    document.getElementById('donGiaInput').value = '0';
    input.removeAttribute('readonly');
    input.focus();
}

function selectAction(action) {
    currentAction = action;
    document.querySelectorAll('.btn-action').forEach(function (btn) {
        btn.classList.remove('active-import', 'active-export', 'active-transfer');
    });
    var btn = event.currentTarget;
    if (action === 'NHAP') btn.classList.add('active-import');
    else if (action === 'XUAT') btn.classList.add('active-export');
    else if (action === 'DIEUCHUYEN') btn.classList.add('active-transfer');

    var transferSection = document.getElementById('transferWarehouseSection');
    var nhapExtraFields = document.getElementById('nhapKhoExtraFields');

    if (action === 'DIEUCHUYEN') {
        transferSection.classList.remove('d-none');
        nhapExtraFields.classList.add('d-none');
    } else if (action === 'NHAP') {
        transferSection.classList.add('d-none');
        nhapExtraFields.classList.remove('d-none');
    } else {
        transferSection.classList.add('d-none');
        nhapExtraFields.classList.add('d-none');
    }

    applyDonGiaReadonly();
}

// ═══ SEARCH MATERIAL IN MODAL ══════════════════════════
function searchMaterialInModal() {
    var query = document.getElementById('materialSearch').value.trim();
    var results = stockData.filter(function (m) {
        return searchMatch(m.maVatLieu, query) || searchMatch(m.tenVatLieu, query);
    });
    var dropdown = document.getElementById('modalSearchResults');
    dropdown.innerHTML = '';
    if (query.length > 0 && results.length > 0) {
        results.slice(0, 5).forEach(function (mat) {
            dropdown.innerHTML += '<div class="result-item" onclick="selectMaterialInModal(' + mat.vatLieuId + ', \'' + mat.maVatLieu + '\', \'' + mat.tenVatLieu.replace(/'/g, "\\'") + '\')">' +
                '<span><strong>' + mat.maVatLieu + '</strong> - ' + mat.tenVatLieu + '</span>' +
                '<span class="badge bg-' + (mat.soLuongTon < 10 ? 'danger' : 'success') + '">' + mat.soLuongTon + ' ' + mat.donViTinh + '</span>' +
                '</div>';
        });
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

function selectMaterialInModal(id, code, name) {
    document.getElementById('materialSearch').value = code + ' - ' + name;
    document.getElementById('materialSearch').dataset.materialId = id;
    document.getElementById('selectedMaterialId').value = id;
    document.getElementById('modalSearchResults').style.display = 'none';
    document.getElementById('materialSearch').setAttribute('readonly', true);

    var stockItem = stockData.find(function (s) { return s.vatLieuId === id; });
    if (stockItem && stockItem.donGia > 0) {
        document.getElementById('donGiaInput').value = stockItem.donGia;
    } else {
        document.getElementById('donGiaInput').value = '0';
    }

    applyDonGiaReadonly();
}

// ═══ COMMIT TRANSACTION ════════════════════════════════
function commitAction() {
    if (!currentAction) {
        showToast('warning', 'Vui l\u00f2ng ch\u1ecdn lo\u1ea1i giao d\u1ecbch: NH\u1eacP / XU\u1ea4T / \u0110I\u1ec0U CHUY\u1ec2N');
        return;
    }
    var materialId = parseInt(document.getElementById('materialSearch').dataset.materialId || document.getElementById('selectedMaterialId').value);
    var quantity = parseFloat(document.getElementById('quantityInput').value);
    var donGia = parseFloat(document.getElementById('donGiaInput').value) || 0;
    var note = document.getElementById('noteInput').value;

    var hasErr = false;
    if (!materialId) {
        showInlineError('materialSearch', 'Vui l\u00f2ng ch\u1ecdn v\u1eadt t\u01b0');
        hasErr = true;
    }
    if (!quantity || quantity <= 0) {
        showInlineError('quantityInput', 'S\u1ed1 l\u01b0\u1ee3ng ph\u1ea3i l\u1edbn h\u01a1n 0');
        hasErr = true;
    }
    if (hasErr) return;

    var targetWarehouseId = null;
    if (currentAction === 'DIEUCHUYEN') {
        targetWarehouseId = parseInt(document.getElementById('transferToWarehouse').value);
        if (!targetWarehouseId) {
            showInlineError('transferToWarehouse', 'Vui l\u00f2ng ch\u1ecdn kho \u0111\u00edch');
            return;
        }
    }

    var extraData = {};
    if (currentAction === 'NHAP') {
        extraData = {
            soLo: document.getElementById('soLoInput').value || null,
            ngaySanXuat: document.getElementById('ngaySanXuatInput').value || null,
            ngayHetHan: document.getElementById('ngayHetHanInput').value || null,
            nhaCungCap: document.getElementById('nhaCungCapInput').value || null
        };
    }

    var mat = stockData.find(function (m) { return m.vatLieuId === materialId; });
    var transaction = {
        vatLieuId: materialId,
        maVatLieu: mat ? mat.maVatLieu : '',
        tenVatLieu: mat ? mat.tenVatLieu : 'N/A',
        soLuong: quantity,
        donGia: donGia,
        thanhTien: quantity * donGia,
        loaiPhieu: currentAction,
        khoNhanId: targetWarehouseId,
        ghiChu: note
    };

    // Merge extra data
    for (var key in extraData) {
        if (extraData.hasOwnProperty(key)) transaction[key] = extraData[key];
    }

    draftTransactions.push(transaction);
    renderDraftList();
    resetInputFields();
}

function resetInputFields() {
    var materialInput = document.getElementById('materialSearch');
    materialInput.value = '';
    materialInput.dataset.materialId = '';
    materialInput.setAttribute('readonly', true);
    document.getElementById('selectedMaterialId').value = '';
    document.getElementById('quantityInput').value = '1';
    document.getElementById('donGiaInput').value = '0';
    document.getElementById('donGiaInput').removeAttribute('readonly');
    document.getElementById('donGiaInput').classList.remove('bg-light');
    document.getElementById('noteInput').value = '';
    document.getElementById('soLoInput').value = '';
    document.getElementById('ngaySanXuatInput').value = '';
    document.getElementById('ngayHetHanInput').value = '';
    document.getElementById('nhaCungCapInput').value = '';
    applyDonGiaReadonly();
}

function removeDraft(index) {
    draftTransactions.splice(index, 1);
    renderDraftList();
}

// ═══ FINISH AND SAVE ═══════════════════════════════════
async function finishAndSave() {
    if (draftTransactions.length === 0) {
        showToast('warning', 'Ch\u01b0a c\u00f3 giao d\u1ecbch n\u00e0o trong danh s\u00e1ch d\u1ef1 th\u1ea3o!');
        return;
    }

    try {
        var items = draftTransactions.map(function (t) {
            return {
                vatLieuId: t.vatLieuId,
                loaiPhieu: t.loaiPhieu,
                soLuong: t.soLuong,
                donGia: t.donGia || 0,
                khoNhanId: t.khoNhanId || null,
                soLo: t.soLo || null,
                ngaySanXuat: t.ngaySanXuat || null,
                ngayHetHan: t.ngayHetHan || null,
                nhaCungCap: t.nhaCungCap || null,
                ghiChu: t.ghiChu || null
            };
        });

        var payload = {
            khoId: currentWarehouseId,
            ghiChu: draftTransactions[0] ? (draftTransactions[0].ghiChu || null) : null,
            items: items
        };

        var apiResult = await KhoAPI.postGiaoDich(payload);

        if (apiResult.ok && apiResult.data.success) {
            showToast('success', apiResult.data.message || 'Giao d\u1ecbch ho\u00e0n t\u1ea5t th\u00e0nh c\u00f4ng!');
            draftTransactions = [];
            renderDraftList();
            await loadStockData();
            bootstrap.Modal.getInstance(document.getElementById('actionModal')).hide();
        } else {
            var errorMsg = apiResult.data.message || 'C\u00f3 l\u1ed7i x\u1ea3y ra';
            if (apiResult.data.errors && apiResult.data.errors.length > 0) {
                errorMsg += '<br>' + apiResult.data.errors.join('<br>');
            }
            showToast('error', errorMsg, 6000);
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showToast('error', 'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i \u0111\u1ebfn m\u00e1y ch\u1ee7. Vui l\u00f2ng th\u1eed l\u1ea1i!');
    }
}

// ═══ NHẬT KÝ (AUDIT LOG) ══════════════════════════════
async function showHistory() {
    var khoSelect = document.getElementById('nkFilterKho');
    if (khoSelect.options.length <= 1) {
        allWarehouses.forEach(function (wh) {
            var opt = document.createElement('option');
            opt.value = wh.id;
            opt.textContent = wh.tenKho;
            khoSelect.appendChild(opt);
        });
    }
    await loadNhatKy(1);
    new bootstrap.Modal(document.getElementById('historyModal')).show();
}

function resetNhatKyFilter() {
    document.getElementById('nkFilterTuNgay').value = '';
    document.getElementById('nkFilterDenNgay').value = '';
    document.getElementById('nkFilterKho').value = '';
    document.getElementById('nkFilterLoai').value = '';
    document.getElementById('nkFilterSearch').value = '';
    loadNhatKy(1);
}

async function loadNhatKy(page) {
    nkCurrentPage = page || 1;
    var params = new URLSearchParams();
    params.set('page', nkCurrentPage);
    params.set('pageSize', 20);

    var tuNgay = document.getElementById('nkFilterTuNgay').value;
    var denNgay = document.getElementById('nkFilterDenNgay').value;
    var khoId = document.getElementById('nkFilterKho').value;
    var loai = document.getElementById('nkFilterLoai').value;
    var search = document.getElementById('nkFilterSearch').value.trim();

    if (tuNgay) params.set('tuNgay', tuNgay);
    if (denNgay) params.set('denNgay', denNgay);
    if (khoId) params.set('khoId', khoId);
    if (loai) params.set('loaiThayDoi', loai);
    if (search) params.set('searchVatLieu', search);

    try {
        var data = await KhoAPI.getLichSu(params.toString());
        renderNhatKyTable(data);
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('error', 'Kh\u00f4ng th\u1ec3 t\u1ea3i nh\u1eadt k\u00fd: ' + error.message);
    }
}

async function showTransactionDetail(phieuId) {
    try {
        var data = await KhoAPI.getChiTietPhieu(phieuId);
        renderTransactionDetailView(data);
        new bootstrap.Modal(document.getElementById('transactionDetailModal')).show();
    } catch (error) {
        console.error('Error loading detail:', error);
        showToast('error', 'Kh\u00f4ng th\u1ec3 t\u1ea3i chi ti\u1ebft phi\u1ebfu: ' + error.message);
    }
}

// ═══ EXPORT EXCEL ══════════════════════════════════════
function exportReport() {
    var container = document.getElementById('exportKhoList');
    container.innerHTML = '';
    allWarehouses.forEach(function (wh) {
        var prefix = wh.loaiKho === 'KHO_ME' ? '<i class="bi bi-star-fill text-warning me-1" style="font-size:0.7rem"></i>' : '';
        var checked = (currentWarehouseId && wh.id === currentWarehouseId) ? 'checked' : '';
        container.innerHTML += '<label class="d-flex align-items-center gap-3 p-2 rounded-3 border mb-2" style="cursor:pointer">' +
            '<input type="checkbox" class="form-check-input export-kho-cb" value="' + wh.id + '" ' + checked + ' onchange="updateExportKhoCount()" style="min-width:20px;min-height:20px">' +
            '<div>' + prefix + '<span class="fw-semibold">' + wh.tenKho + '</span>' +
            '<div class="text-muted small">' + (wh.loaiKho === 'KHO_ME' ? 'Kho M\u1eb9' : 'Kho Con') + '</div></div></label>';
    });
    updateExportKhoCount();
    new bootstrap.Modal(document.getElementById('exportExcelModal')).show();
}

function toggleAllExportKho(state) {
    document.querySelectorAll('.export-kho-cb').forEach(function (cb) { cb.checked = state; });
    updateExportKhoCount();
}

function updateExportKhoCount() {
    var count = document.querySelectorAll('.export-kho-cb:checked').length;
    document.getElementById('exportKhoCount').textContent = count + ' kho';
    document.getElementById('btnExecuteExport').disabled = (count === 0);
    var modeSection = document.getElementById('exportModeSection');
    if (modeSection) {
        modeSection.style.display = (count > 1) ? 'block' : 'none';
    }
}

async function executeMultiKhoExport() {
    var selectedIds = [];
    document.querySelectorAll('.export-kho-cb:checked').forEach(function (cb) {
        selectedIds.push(parseInt(cb.value));
    });
    if (selectedIds.length === 0) {
        showToast('warning', 'Vui l\u00f2ng ch\u1ecdn \u00edt nh\u1ea5t 1 kho!');
        return;
    }

    var exportMode = 'per-file';
    if (selectedIds.length > 1) {
        var modeRadio = document.querySelector('input[name="exportMode"]:checked');
        if (modeRadio) exportMode = modeRadio.value;
    }

    var btn = document.getElementById('btnExecuteExport');
    var originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>\u0110ang t\u1ea1o file...';

    try {
        if (exportMode === 'single-file') {
            // MODE 2: All kho in 1 file, each kho = 1 worksheet (MHTML)
            var sheetsArray = [];
            var exportedCount = 0;

            for (var i = 0; i < selectedIds.length; i++) {
                var khoId = selectedIds[i];
                var wh = allWarehouses.find(function (w) { return w.id === khoId; });
                var whName = wh ? wh.tenKho : ('Kho ' + khoId);

                var khoData = [];
                try {
                    var result = await KhoAPI.getTonKho(khoId);
                    if (result.ok && Array.isArray(result.data)) khoData = result.data;
                } catch (e) {
                    console.error('Failed to load kho ' + khoId, e);
                }

                if (khoData.length === 0) continue;

                var sheetHtml = buildExcelHtmlForKho(whName, khoData);
                var safeName = whName.replace(/[\[\]\*\?\/\\:]/g, '').substring(0, 31);
                sheetsArray.push({ name: safeName, html: sheetHtml });
                exportedCount++;
            }

            if (exportedCount > 0) {
                var mhtmlContent = buildMhtmlWorkbook(sheetsArray);
                var blob = new Blob([mhtmlContent], { type: 'application/vnd.ms-excel' });
                var link = document.createElement('a');
                var url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                var d = new Date();
                var dd = String(d.getDate()).padStart(2, '0');
                var mm = String(d.getMonth() + 1).padStart(2, '0');
                var yyyy = d.getFullYear();
                link.setAttribute('download', 'TongHop_KiemKe_' + dd + '-' + mm + '-' + yyyy + '.xls');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showToast('success', '\u0110\u00e3 xu\u1ea5t ' + exportedCount + ' kho v\u00e0o 1 file Excel!');
            } else {
                showToast('warning', 'Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u t\u1ed3n kho \u0111\u1ec3 xu\u1ea5t!');
            }

        } else {
            // MODE 1: Each kho = 1 separate .xls file
            var exportedCount = 0;

            for (var i = 0; i < selectedIds.length; i++) {
                var khoId = selectedIds[i];
                var wh = allWarehouses.find(function (w) { return w.id === khoId; });
                var whName = wh ? wh.tenKho : ('Kho ' + khoId);

                var khoData = [];
                try {
                    var result = await KhoAPI.getTonKho(khoId);
                    if (result.ok && Array.isArray(result.data)) khoData = result.data;
                } catch (e) {
                    console.error('Failed to load kho ' + khoId, e);
                }

                if (khoData.length === 0) continue;

                var h = buildExcelHtmlForKho(whName, khoData);

                var blob = new Blob([h], { type: 'application/vnd.ms-excel' });
                var link = document.createElement('a');
                var url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'BienBanKiemKe_' + khoId + '_' + new Date().toISOString().slice(0, 10) + '.xls');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                exportedCount++;

                if (i < selectedIds.length - 1) {
                    await new Promise(function (resolve) { setTimeout(resolve, 500); });
                }
            }

            if (exportedCount > 0) {
                showToast('success', '\u0110\u00e3 xu\u1ea5t ' + exportedCount + ' kho ra file Excel!');
            } else {
                showToast('warning', 'Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u t\u1ed3n kho \u0111\u1ec3 xu\u1ea5t!');
            }
        }

        var modalEl = document.getElementById('exportExcelModal');
        var modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    } catch (err) {
        console.error('Export error:', err);
        showToast('error', 'L\u1ed7i khi xu\u1ea5t Excel: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// ═══ ADD NEW MATERIAL ══════════════════════════════════
async function saveNewMaterial() {
    var btn = document.getElementById('btnSaveNewMaterial');
    var alertContainer = document.getElementById('addMatAlert');

    var isValid = true;
    var validations = [
        { id: 'addMat_MaVatTu',    check: function (v) { return v.trim() !== ''; } },
        { id: 'addMat_TenVatTu',   check: function (v) { return v.trim() !== ''; } },
        { id: 'addMat_NhomVatLieu', check: function (v) { return v !== ''; } },
        { id: 'addMat_DonViTinh',  check: function (v) { return v !== ''; } },
        { id: 'addMat_DonGia',     check: function (v) { return v !== '' && parseFloat(v) >= 0; } },
        { id: 'addMat_KhoId',      check: function (v) { return v !== ''; } }
    ];
    validations.forEach(function (f) {
        var el = document.getElementById(f.id);
        if (!f.check(el.value)) { el.classList.add('is-invalid'); isValid = false; }
        else { el.classList.remove('is-invalid'); }
    });
    if (!isValid) return;

    var originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>\u0110ang x\u1eed l\u00fd...';

    var mucVal = document.getElementById('addMat_MucToiThieu').value;

    var payload = {
        maVatLieu:     document.getElementById('addMat_MaVatTu').value.trim(),
        tenVatLieu:    document.getElementById('addMat_TenVatTu').value.trim(),
        nhomVatLieuId: parseInt(document.getElementById('addMat_NhomVatLieu').value),
        donViTinhId:   parseInt(document.getElementById('addMat_DonViTinh').value),
        donGia:        parseFloat(document.getElementById('addMat_DonGia').value) || 0,
        khoId:         parseInt(document.getElementById('addMat_KhoId').value),
        moTa:          document.getElementById('addMat_MoTa').value.trim() || null,
        mucToiThieu:   mucVal ? parseFloat(mucVal) : null
    };

    try {
        var apiResult = await KhoAPI.postThemVatTu(payload);

        if (apiResult.ok && apiResult.data.success) {
            alertContainer.innerHTML = '<div class="alert alert-success alert-dismissible rounded-3 mb-3" role="alert">' +
                '<i class="bi bi-check-circle-fill me-2"></i><strong>' + apiResult.data.message + '</strong>' +
                '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
                '</div>';
            document.getElementById('formThemVatTu').reset();
            document.getElementById('addMat_DonGia').value = '0';

            if (currentWarehouseId) await loadStockData();

            setTimeout(function () {
                var m = bootstrap.Modal.getInstance(document.getElementById('addMaterialModal'));
                if (m) m.hide();
            }, 1500);
        } else {
            var errorHtml = '';
            if (apiResult.data.errors && apiResult.data.errors.length > 0) {
                errorHtml = '<ul class="mb-0 mt-1 ps-3 small">';
                apiResult.data.errors.forEach(function (e) { errorHtml += '<li>' + e + '</li>'; });
                errorHtml += '</ul>';
            }
            alertContainer.innerHTML = '<div class="alert alert-danger alert-dismissible rounded-3 mb-3" role="alert">' +
                '<i class="bi bi-exclamation-triangle-fill me-2"></i><strong>' + (apiResult.data.message || 'C\u00f3 l\u1ed7i x\u1ea3y ra.') + '</strong>' +
                errorHtml +
                '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
                '</div>';
        }
    } catch (err) {
        alertContainer.innerHTML = '<div class="alert alert-danger rounded-3 mb-3">' +
            '<i class="bi bi-exclamation-triangle-fill me-2"></i>Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i \u0111\u1ebfn m\u00e1y ch\u1ee7.' +
            '</div>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// ═══ LOGOUT ════════════════════════════════════════════
function logout() {
    showConfirm('\u0110\u0103ng xu\u1ea5t', 'B\u1ea1n c\u00f3 ch\u1eafc ch\u1eafn mu\u1ed1n \u0111\u0103ng xu\u1ea5t kh\u00f4ng?', function () {
        window.location.href = '/Login/Logout';
    });
}
