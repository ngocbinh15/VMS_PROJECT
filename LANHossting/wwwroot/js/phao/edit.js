// ═══════════════════════════════════════════════════════════════════════════
// PHAO EDIT PAGE — Main Script
// Requires: EDIT_CONFIG defined inline (Razor) before this file loads
//   EDIT_CONFIG.urls.viTriByTuyen, EDIT_CONFIG.urls.viTriInfo
//   EDIT_CONFIG.model.currentTuyen, EDIT_CONFIG.model.currentViTri
// ═══════════════════════════════════════════════════════════════════════════

// ── Constants ──────────────────────────────────────────────────────────────
var TREN_LUONG = 'Trên luồng';

// ── Elements ───────────────────────────────────────────────────────────────
var ddlTrangThai = document.getElementById('ddlTrangThaiHoatDong');
var ddlTuyen     = document.getElementById('ddlTuyenLuong');
var ddlViTri     = document.getElementById('ddlViTriPhao');
var txtToaDo     = document.getElementById('txtToaDoThietKe');
var txtTinhTrang = document.getElementById('txtTinhTrangDisplay');

// ── Helpers ────────────────────────────────────────────────────────────────
function setTuyenViTriEnabled(enabled) {
    ddlTuyen.disabled = !enabled;
    ddlViTri.disabled = !enabled;
    document.getElementById('lblTuyenRequired').style.display  = enabled ? '' : 'none';
    document.getElementById('lblViTriRequired').style.display  = enabled ? '' : 'none';
    if (!enabled) {
        ddlTuyen.value = '';
        ddlViTri.innerHTML = '<option value="">— Chọn vị trí —</option>';
        txtToaDo.value = '';
    }
}

function inferTinhTrang(trangThaiHoatDong) {
    return trangThaiHoatDong === TREN_LUONG ? 'Có sử dụng' : 'Không sử dụng';
}

// ── Load ViTri by Tuyến (AJAX) ─────────────────────────────────────────────
function loadViTriByTuyen(tuyenId, selectedViTriId) {
    if (!tuyenId) {
        ddlViTri.innerHTML = '<option value="">— Chọn vị trí —</option>';
        txtToaDo.value = '';
        return;
    }
    fetch(EDIT_CONFIG.urls.viTriByTuyen + '/' + tuyenId)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var html = '<option value="">— Chọn vị trí —</option>';
            data.forEach(function(v) {
                var sel = (selectedViTriId && v.id == selectedViTriId) ? ' selected' : '';
                html += '<option value="' + v.id + '"' + sel + '>' + v.maPhaoBH + '</option>';
            });
            ddlViTri.innerHTML = html;
            // trigger tọa độ nếu có giá trị được chọn
            if (ddlViTri.value) ddlViTri.dispatchEvent(new Event('change'));
        });
}

// ── Load tọa độ khi chọn ViTri ─────────────────────────────────────────────
ddlViTri.addEventListener('change', function() {
    var viTriId = this.value;
    if (!viTriId) { txtToaDo.value = ''; return; }
    fetch(EDIT_CONFIG.urls.viTriInfo + '/' + viTriId)
        .then(function(r) { return r.json(); })
        .then(function(d) { txtToaDo.value = d.toaDoThietKe || '—'; })
        .catch(function() { txtToaDo.value = 'Không lấy được tọa độ'; });
});

// ── Khi TrangThaiHoatDong thay đổi ─────────────────────────────────────────
ddlTrangThai.addEventListener('change', function() {
    var val = this.value;
    txtTinhTrang.value = inferTinhTrang(val);
    if (val === TREN_LUONG) {
        setTuyenViTriEnabled(true);
    } else {
        setTuyenViTriEnabled(false);
        // Clear hidden fields so server receives null
        ddlTuyen.value = '';
    }
});

// ── Khi TuyenLuong thay đổi ────────────────────────────────────────────────
ddlTuyen.addEventListener('change', function() {
    loadViTriByTuyen(this.value, null);
});

// ── Khởi tạo trạng thái ban đầu ────────────────────────────────────────────
(function init() {
    var currentTrangThai = ddlTrangThai.value;
    txtTinhTrang.value = inferTinhTrang(currentTrangThai);

    if (currentTrangThai === TREN_LUONG) {
        setTuyenViTriEnabled(true);
        var currentTuyen  = EDIT_CONFIG.model.currentTuyen;
        var currentViTri  = EDIT_CONFIG.model.currentViTri;
        if (currentTuyen) {
            ddlTuyen.value = currentTuyen;
            loadViTriByTuyen(currentTuyen, currentViTri ? parseInt(currentViTri) : null);
        }
    } else {
        setTuyenViTriEnabled(false);
    }
})();

// ── Flatpickr (dd/MM/yyyy) ──────────────────────────────────────────────
document.querySelectorAll('input[type="date"]').forEach(function(el) {
    flatpickr(el, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        allowInput: true
    });
});
