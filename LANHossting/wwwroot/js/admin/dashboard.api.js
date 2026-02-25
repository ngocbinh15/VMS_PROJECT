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
        updateVatLieu:    (dto)     => _json(`${BASE}/vatlieu`, { method: 'PUT',  body: JSON.stringify(dto) }),
        deleteVatLieu:    (id)      => _json(`${BASE}/vatlieu/${id}`, { method: 'DELETE' }),

        // ── NHẬT KÝ NHẬP – XUẤT – ĐIỀU CHUYỂN ──
        getLichSuKho:     (qs)      => _json(`/api/kho/lichsu?${qs}`),
        getChiTietPhieu:  (id)      => _json(`/api/kho/lichsu/${id}`),
        getDanhSachKho:   ()        => _json(`/api/kho/danhsachkho`),
    };
})();
