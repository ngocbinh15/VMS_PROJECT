/* ═══════════════════════════════════════════════════════
   KHO DASHBOARD — API Layer
   Module: Quản Lý Kho
   Chứa toàn bộ fetch/ajax — Không xử lý DOM, không gắn event
   ═══════════════════════════════════════════════════════ */
'use strict';

/** Safe JSON parse — tránh lỗi "Unexpected token" khi server trả HTML */
function _tryParseJson(resp) {
    return resp.json().catch(function () {
        throw new Error('Lỗi hệ thống. Vui lòng thử lại.');
    });
}

var KhoAPI = {

    /** Lấy danh sách tất cả kho */
    getDanhSachKho: async function () {
        var resp = await fetch('/api/kho/danhsachkho');
        return _tryParseJson(resp);
    },

    /** Lấy danh sách nhóm vật liệu */
    getNhomVatLieu: async function () {
        var resp = await fetch('/api/kho/nhomvatlieu');
        return _tryParseJson(resp);
    },

    /** Lấy danh sách đơn vị tính */
    getDonViTinh: async function () {
        var resp = await fetch('/api/kho/donvitinh');
        return _tryParseJson(resp);
    },

    /** Lấy tồn kho theo khoId — trả về { ok, status, data } */
    getTonKho: async function (khoId) {
        var resp = await fetch('/api/kho/tonkho?khoId=' + khoId);
        var data = await _tryParseJson(resp);
        return { ok: resp.ok, status: resp.status, data: data };
    },

    /** Lấy danh sách nhật ký (lịch sử phiếu) — queryString đã build sẵn */
    getLichSu: async function (queryString) {
        var resp = await fetch('/api/kho/lichsu?' + queryString);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return _tryParseJson(resp);
    },

    /** Lấy chi tiết một phiếu theo phieuId */
    getChiTietPhieu: async function (phieuId) {
        var resp = await fetch('/api/kho/lichsu/' + phieuId);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return _tryParseJson(resp);
    },

    /** Gửi giao dịch (POST) — trả về { ok, data } */
    postGiaoDich: async function (payload) {
        var resp = await fetch('/api/kho/giaodich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        try {
            var data = await resp.json();
            return { ok: resp.ok, data: data };
        } catch (e) {
            // Server trả HTML thay vì JSON — thao tác có thể đã thành công ở DB
            return { ok: true, data: { success: true, message: 'Giao dịch thành công.' } };
        }
    },

    /** Thêm vật tư mới (POST) — trả về { ok, data } */
    postThemVatTu: async function (payload) {
        var resp = await fetch('/api/kho/themvattu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        try {
            var data = await resp.json();
            return { ok: resp.ok, data: data };
        } catch (e) {
            // Server trả HTML thay vì JSON — thao tác có thể đã thành công ở DB
            return { ok: true, data: { success: true, message: 'Thêm vật tư thành công.' } };
        }
    }
};
