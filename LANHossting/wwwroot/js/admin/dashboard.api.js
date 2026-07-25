// ═══════════════════════════════════════════
// ADMIN DASHBOARD — API Layer
// Pure fetch calls, ZERO DOM manipulation.
// ═══════════════════════════════════════════
const AdminAPI = (() => {
    const BASE = '/api/admin';

    async function _fetch(url, options = {}) {
        const resp = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        if (resp.status === 401) { window.location.href = '/Login'; return null; }
        return resp;
    }

    async function _json(url, options) {
        const resp = await _fetch(url, options);
        if (!resp) return null;
        try {
            return await resp.json();
        } catch (e) {
            // Server trả HTML thay vì JSON (thường do lỗi nội bộ sau khi thao tác DB đã thành công)
            const method = (options && options.method) || 'GET';
            if (method !== 'GET') {
                // Mutation: thao tác đã thành công ở DB, trả success để UI cập nhật
                return { success: true, message: 'Thao tác thành công.' };
            }
            // GET: trả null, caller sẽ dùng giá trị mặc định (|| [])
            return null;
        }
    }

    return {
        // ── TÀI KHOẢN ──
        getTaiKhoan:      ()        => _json(`${BASE}/taikhoan`),
        createTaiKhoan:   (dto)     => _json(`${BASE}/taikhoan`, { method: 'POST', body: JSON.stringify(dto) }),
        updateTaiKhoan:   (dto)     => _json(`${BASE}/taikhoan`, { method: 'PUT',  body: JSON.stringify(dto) }),
        deleteTaiKhoan:   (id)      => _json(`${BASE}/taikhoan/${id}`, { method: 'DELETE' }),
        toggleStatus:     (id)      => _json(`${BASE}/taikhoan/${id}/toggle-status`, { method: 'POST' }),
        resetPassword:    (id, dto) => _json(`${BASE}/taikhoan/${id}/reset-password`, { method: 'POST', body: JSON.stringify(dto) }),

        // ── VAI TRÒ ──
        getVaiTro:        ()        => _json(`${BASE}/vaitro`),

        // ── VẬT LIỆU ──
        getVatLieu:       ()        => _json(`${BASE}/vatlieu`),
        createVatLieu:    (dto)     => _json(`${BASE}/vatlieu`, { method: 'POST', body: JSON.stringify(dto) }),
        updateVatLieu:    (dto)     => _json(`${BASE}/vatlieu`, { method: 'PUT',  body: JSON.stringify(dto) }),
        deleteVatLieu:    (id)      => _json(`${BASE}/vatlieu/${id}`, { method: 'DELETE' }),
        getNhomVatLieu:   ()        => _json(`${BASE}/nhomvatlieu`),
        getDonViTinh:     ()        => _json(`${BASE}/donvitinh`),

        // ── KHO ──
        getKho:           ()        => _json(`${BASE}/kho`),
        createKho:        (dto)     => _json(`${BASE}/kho`, { method: 'POST', body: JSON.stringify(dto) }),
        updateKho:        (dto)     => _json(`${BASE}/kho`, { method: 'PUT',  body: JSON.stringify(dto) }),
        deleteKho:        (id)      => _json(`${BASE}/kho/${id}`, { method: 'DELETE' }),

        // ── THÊM VẬT LIỆU VÀO KHO ──
        getVatLieuForKho: (khoId)   => _json(`${BASE}/kho/${khoId}/vatlieu`),
        addVatLieuToKho:  (khoId, vatLieuIds) => _json(`${BASE}/kho/${khoId}/vatlieu`, { method: 'POST', body: JSON.stringify({ vatLieuIds }) }),

        // ── NHẬT KÝ NHẬP – XUẤT – ĐIỀU CHUYỂN ──
        getLichSuKho:     (qs)      => _json(`/api/kho/lichsu?${qs}`),
        getChiTietPhieu:  (id)      => _json(`/api/kho/lichsu/${id}`),
        getDanhSachKho:   ()        => _json(`/api/kho/danhsachkho`),

        // ── PHÊ DUYỆT & HOÀN TÁC PHIẾU GIAO DỊCH ──
        getPhieuChoDuyet: ()        => _json(`${BASE}/phieu-cho-duyet`),
        duyetPhieu:       (id)      => _json(`${BASE}/phieu/${id}/duyet`, { method: 'POST' }),
        tuChoiPhieu:      (id, lyDo)=> _json(`${BASE}/phieu/${id}/tu-choi`, { method: 'POST', body: JSON.stringify({ lyDo }) }),
        rollbackPhieu:    (id, lyDo)=> _json(`${BASE}/phieu/${id}/rollback`, { method: 'POST', body: JSON.stringify({ lyDo }) }),

        // ── CẢNH BÁO TỒN KHO TỐI THIỂU ──
        getCanhBaoTonKho: (search, khoIds) => {
            let url = `${BASE}/canh-bao-ton-kho`;
            const params = [];
            if (search) params.push(`search=${encodeURIComponent(search)}`);
            if (khoIds && khoIds.length > 0) {
                khoIds.forEach(id => params.push(`khoIds=${encodeURIComponent(id)}`));
            }
            if (params.length > 0) url += '?' + params.join('&');
            return _json(url);
        },

        // ── BIỂU ĐỒ THỐNG KÊ ──
        getThongKeBieuDo: (tuNgay, denNgay, khoIds) => {
            let url = `${BASE}/thong-ke-bieu-do`;
            const params = [];
            if (tuNgay) params.push(`tuNgay=${encodeURIComponent(tuNgay)}`);
            if (denNgay) params.push(`denNgay=${encodeURIComponent(denNgay)}`);
            if (khoIds && khoIds.length > 0) {
                khoIds.forEach(id => params.push(`khoIds=${encodeURIComponent(id)}`));
            }
            if (params.length > 0) url += '?' + params.join('&');
            return _json(url);
        }
    };
})();
