// ═══════════════════════════════════════════════════════════════════════════
// PHAO EDIT PAGE — Main Script (Technical info only)
// Trạng thái vận hành (trạng thái hoạt động, tuyến, vị trí) được quản lý
// qua chức năng Điều Phối, KHÔNG còn ở trang Chỉnh sửa.
// ═══════════════════════════════════════════════════════════════════════════

// ── Flatpickr (dd/MM/yyyy) ──────────────────────────────────────────────
document.querySelectorAll('input[type="date"]').forEach(function(el) {
    flatpickr(el, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        allowInput: true
    });
});
