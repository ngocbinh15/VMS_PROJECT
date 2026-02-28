/**
 * vongdoi.js — Flow Diagram Engine for Vòng Đời Phao
 * Fetches data from /Phao/GetVongDoiJson and renders the interactive flow diagram.
 * Based on FE/NePhao flow diagram engine V3.
 */
(function () {
    'use strict';

    /* ── Constants ─────────────────────────────────────────── */
    var TYPES = {
        active:      { bg: '#dcfce7', text: '#166534', label: 'Đang hoạt động' },
        recalled:    { bg: '#fee2e2', text: '#dc2626', label: 'Thu hồi' },
        kho:         { bg: '#fef9c3', text: '#92400e', label: 'Trong kho' },
        incident:    { bg: '#ffedd5', text: '#c2410c', label: 'Sự cố' },
        maintenance: { bg: '#e0f2fe', text: '#0369a1', label: 'Bảo trì' },
        transfer:    { bg: '#ede9fe', text: '#6d28d9', label: 'Chuyển kho' }
    };

    var LINE_DASH = {
        active: [],
        recalled: [9, 5],
        kho: [3, 5],
        incident: [],
        maintenance: [8, 4, 2, 4],
        transfer: []
    };

    var BUOY_COLORS = [
        '#2563eb', '#d97706', '#7c3aed', '#db2777', '#059669',
        '#0891b2', '#dc2626', '#65a30d', '#9333ea', '#0f766e',
        '#c2410c', '#4338ca', '#15803d', '#b45309', '#1d4ed8',
        '#be185d', '#0369a1', '#16a34a', '#7e22ce', '#b91c1c',
        '#0e7490', '#92400e'
    ];

    /* ── Dynamic data (loaded from API) ───────────────────── */
    var YEARS = [];
    var POSITIONS = [];
    var BUOYS = [];
    var DUAL_YEARS = {};
    var COLS = [];
    var colIdx = {};

    /* ── State ──────────────────────────────────────────────── */
    var scale = 1.0, panX = 0, panY = 0;
    var isDragging = false, dragStartX = 0, dragStartY = 0, dragPanX = 0, dragPanY = 0;
    var highlightBuoyId = null;
    var filterQuery = '';
    var gridBuilt = false;
    var isLoading = false;

    /* ── Column computation ────────────────────────────────── */
    function computeColumns() {
        // Determine which years need dual columns (L + R sides)
        // A year needs R column if any step has sl='R' in that year
        DUAL_YEARS = {};
        BUOYS.forEach(function (buoy) {
            buoy.steps.forEach(function (step) {
                if (step.sl === 'R') DUAL_YEARS[step.yr] = true;
            });
        });

        COLS = [];
        YEARS.forEach(function (yr) {
            COLS.push({ yr: yr, sl: 'L' });
            if (DUAL_YEARS[yr]) COLS.push({ yr: yr, sl: 'R' });
        });

        colIdx = {};
        COLS.forEach(function (c, i) { colIdx[c.yr + '_' + c.sl] = i; });
    }

    function getColIdx(yr, sl) {
        var key = yr + '_' + (DUAL_YEARS[yr] ? sl : 'L');
        return (colIdx[key] !== undefined) ? colIdx[key] : 0;
    }

    function getPosIdx(pos) { return POSITIONS.indexOf(pos); }

    /* ── Fetch data from API ──────────────────────────────── */
    function fetchVongDoiData(tuyenLuongId, callback) {
        isLoading = true;
        var url = '/Phao/GetVongDoiJson';
        if (tuyenLuongId) url += '?tuyenLuongId=' + tuyenLuongId;

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                YEARS = data.years || [];
                POSITIONS = data.positions || [];
                BUOYS = (data.buoys || []).map(function (b) {
                    return {
                        id: b.id,
                        steps: (b.steps || []).map(function (s) {
                            return { yr: s.yr, pos: s.pos, sl: s.sl || 'L', type: s.type || 'active', note: s.note || '' };
                        })
                    };
                });
                computeColumns();
                isLoading = false;
                if (callback) callback();
            })
            .catch(function (err) {
                console.error('Lỗi tải dữ liệu vòng đời phao:', err);
                isLoading = false;
                var grid = document.getElementById('fdGrid');
                if (grid) grid.innerHTML = '<div class="fd-loading text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Lỗi tải dữ liệu. Vui lòng thử lại.</div>';
            });
    }

    /* ── Build HTML grid ────────────────────────────────────── */
    function buildGrid() {
        var grid = document.getElementById('fdGrid');
        if (!grid) return;

        if (BUOYS.length === 0) {
            grid.innerHTML = '<div class="fd-loading"><i class="bi bi-info-circle me-2"></i>Không có dữ liệu lịch sử hoạt động phao.</div>';
            updateStatusBar();
            return;
        }

        // Build occupancy map
        var occ = {};
        BUOYS.forEach(function (buoy, bi) {
            buoy.steps.forEach(function (step) {
                var pi = getPosIdx(step.pos);
                var ci = getColIdx(step.yr, step.sl);
                if (pi < 0) return;
                var k = pi + '_' + ci;
                if (!occ[k]) occ[k] = [];
                occ[k].push({ bi: bi, buoy: buoy, step: step });
            });
        });

        var html = '<table class="fd-table" id="fdTable"><colgroup><col style="width:100px;min-width:100px;">';
        COLS.forEach(function () { html += '<col style="width:88px;min-width:80px;">'; });
        html += '</colgroup>';

        // Year group header row
        html += '<thead><tr class="fd-tr-hdr"><th class="fd-th-pos fd-sticky" rowspan="2">VỊ TRÍ</th>';
        YEARS.forEach(function (yr) {
            var span = DUAL_YEARS[yr] ? 2 : 1;
            html += '<th class="fd-th-year" colspan="' + span + '">' + yr + '</th>';
        });
        html += '</tr><tr class="fd-tr-subhdr">';
        COLS.forEach(function (c) {
            html += '<th class="fd-th-sub' + (c.sl === 'R' ? ' fd-sub-r' : '') + '">' +
                (c.sl === 'L' ? 'Trên luồng' : 'Thu hồi về') + '</th>';
        });
        html += '</tr></thead><tbody>';

        POSITIONS.forEach(function (pos, pi) {
            html += '<tr class="fd-tr-pos">';
            html += '<td class="fd-td-pos fd-sticky">' + pos + '</td>';
            COLS.forEach(function (c, ci) {
                var k = pi + '_' + ci;
                var entries = occ[k] || [];
                var slotClass = c.sl === 'R' ? ' fd-td-r' : '';
                html += '<td class="fd-td' + slotClass + '" id="fdc_' + pi + '_' + ci + '">';
                entries.forEach(function (e) {
                    var t = TYPES[e.step.type] || TYPES.active;
                    var bc = BUOY_COLORS[e.bi % BUOY_COLORS.length];
                    var noteHtml = e.step.note ? '<span class="fd-node-note" title="' + escHtml(e.step.note) + '">' + escHtml(e.step.note) + '</span>' : '';
                    html += '<div class="fd-node" ' +
                        'data-bi="' + e.bi + '" data-buoy="' + escAttr(e.buoy.id) + '" data-pos="' + escAttr(pos) + '" ' +
                        'data-yr="' + c.yr + '" data-type="' + e.step.type + '" data-sl="' + c.sl + '" ' +
                        'data-note="' + escAttr(e.step.note || '') + '" ' +
                        'style="border-left:3px solid ' + bc + ';background:' + t.bg + ';color:' + t.text + ';">' +
                        '<span class="fd-node-id">' + escHtml(e.buoy.id) + '</span>' + noteHtml +
                        '</div>';
                });
                html += '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        grid.innerHTML = html;

        // Wire node events
        grid.querySelectorAll('.fd-node').forEach(function (el) {
            el.addEventListener('click', function (e) { e.stopPropagation(); onNodeClick(el); });
            el.addEventListener('mouseenter', function () { onNodeHover(el, true); });
            el.addEventListener('mouseleave', function () { onNodeHover(el, false); });
        });

        // Size canvas to match table
        setTimeout(function () {
            var table = document.getElementById('fdTable');
            var inner = document.getElementById('fdInner');
            var canvas = document.getElementById('fdCanvas');
            if (table && inner && canvas) {
                var tw = table.scrollWidth;
                var th = table.scrollHeight;
                inner.style.width = tw + 'px';
                inner.style.height = th + 'px';
                canvas.width = tw;
                canvas.height = th;
                drawCanvas();
                updateStickyHeader();
            }
        }, 80);

        gridBuilt = true;
        updateStatusBar();
    }

    /* ── Helpers ────────────────────────────────────────────── */
    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }
    function escAttr(s) {
        return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function updateStatusBar() {
        var el = document.getElementById('fdStatusText');
        if (!el) return;
        if (BUOYS.length === 0) {
            el.innerHTML = 'Không có dữ liệu';
            return;
        }
        var minY = YEARS[0] || '?';
        var maxY = YEARS[YEARS.length - 1] || '?';
        el.innerHTML = 'Hiển thị <strong>' + POSITIONS.length + '</strong> vị trí · <strong>' +
            BUOYS.length + '</strong> phao · <strong>' + minY + '–' + maxY + '</strong>';
    }

    /* ── Node edge coordinate (relative to fdInner) ───────── */
    function nodeCenterEdge(posIdx, colIndex, edge) {
        var cell = document.getElementById('fdc_' + posIdx + '_' + colIndex);
        var inner = document.getElementById('fdInner');
        if (!cell || !inner) return null;
        var cr = cell.getBoundingClientRect();
        var ir = inner.getBoundingClientRect();
        var l = cr.left - ir.left, t = cr.top - ir.top;
        var w = cr.width, h = cr.height;
        switch (edge) {
            case 'R': return { x: l + w, y: t + h / 2 };
            case 'L': return { x: l, y: t + h / 2 };
            case 'B': return { x: l + w / 2, y: t + h };
            case 'T': return { x: l + w / 2, y: t };
            default: return { x: l + w / 2, y: t + h / 2 };
        }
    }

    /* ── Canvas draw ─────────────────────────────────────────── */
    function drawCanvas() {
        var canvas = document.getElementById('fdCanvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var active = filterQuery.trim().toLowerCase();

        BUOYS.forEach(function (buoy, bi) {
            if (active && buoy.id.toLowerCase().indexOf(active) < 0) return;
            if (buoy.steps.length < 2) return;

            var bc = BUOY_COLORS[bi % BUOY_COLORS.length];
            var isHL = (highlightBuoyId === buoy.id);
            var isDim = (highlightBuoyId && !isHL);
            var alpha = isDim ? 0.07 : (isHL ? 1.0 : 0.72);
            var lw = isHL ? 2.8 : 1.8;
            var offset = ((bi % 5) - 2) * 2.5;

            for (var si = 0; si < buoy.steps.length - 1; si++) {
                var s1 = buoy.steps[si];
                var s2 = buoy.steps[si + 1];
                var pi1 = getPosIdx(s1.pos), ci1 = getColIdx(s1.yr, s1.sl);
                var pi2 = getPosIdx(s2.pos), ci2 = getColIdx(s2.yr, s2.sl);

                var srcEdge, dstEdge;
                if (ci2 > ci1) { srcEdge = 'R'; dstEdge = 'L'; }
                else if (ci2 < ci1) { srcEdge = 'L'; dstEdge = 'R'; }
                else if (pi2 > pi1) { srcEdge = 'B'; dstEdge = 'T'; }
                else if (pi2 < pi1) { srcEdge = 'T'; dstEdge = 'B'; }
                else { srcEdge = 'C'; dstEdge = 'C'; }

                var p1 = nodeCenterEdge(pi1, ci1, srcEdge);
                var p2 = nodeCenterEdge(pi2, ci2, dstEdge);
                if (!p1 || !p2) continue;

                var dash = LINE_DASH[s2.type] || [];
                var color = (s2.type === 'incident') ? '#ef4444' :
                    (s2.type === 'maintenance') ? '#f97316' : bc;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = color;
                ctx.lineWidth = lw;
                ctx.setLineDash(dash);
                if (isHL) { ctx.shadowColor = color; ctx.shadowBlur = 8; }

                var dx = p2.x - p1.x;
                var dy = p2.y - p1.y;
                var cp1x, cp1y, cp2x, cp2y;
                if (srcEdge === 'R' || srcEdge === 'L') {
                    var hArc = Math.max(Math.abs(dx) * 0.45, 32);
                    var hDir = (srcEdge === 'R') ? 1 : -1;
                    cp1x = p1.x + hDir * hArc + offset;
                    cp1y = p1.y;
                    cp2x = p2.x - hDir * hArc + offset;
                    cp2y = p2.y;
                } else {
                    var vArc = Math.max(Math.abs(dy) * 0.45, 32);
                    var vDir = (srcEdge === 'B') ? 1 : -1;
                    cp1x = p1.x + offset;
                    cp1y = p1.y + vDir * vArc;
                    cp2x = p2.x + offset;
                    cp2y = p2.y - vDir * vArc;
                }

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                ctx.stroke();

                // Arrowhead
                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
                var angle = Math.atan2(p2.y - cp2y, p2.x - cp2x);
                var aLen = isHL ? 12 : 10;
                var aWid = 0.44;
                ctx.beginPath();
                ctx.moveTo(p2.x, p2.y);
                ctx.lineTo(p2.x - aLen * Math.cos(angle - aWid), p2.y - aLen * Math.sin(angle - aWid));
                ctx.lineTo(p2.x - aLen * Math.cos(angle + aWid), p2.y - aLen * Math.sin(angle + aWid));
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.globalAlpha = isDim ? 0.15 : 1.0;
                ctx.fill();
                ctx.restore();
            }
        });
    }

    /* ── Interactions ───────────────────────────────────────── */
    function onNodeClick(el) {
        var bi = parseInt(el.dataset.bi);
        var bc = BUOY_COLORS[bi % BUOY_COLORS.length];
        var type = el.dataset.type;
        var t = TYPES[type] || TYPES.active;
        document.getElementById('fdNodeDot').style.background = bc;
        document.getElementById('fdNodeTitle').textContent = 'Chi tiết · ' + el.dataset.pos + ' / ' + el.dataset.yr;
        document.getElementById('fdNodeId').textContent = el.dataset.buoy;
        document.getElementById('fdNodePos').textContent = el.dataset.pos;
        document.getElementById('fdNodeYear').textContent = el.dataset.yr;
        document.getElementById('fdNodeNote').textContent = el.dataset.note || '(không có ghi chú)';
        var s = document.getElementById('fdNodeStatus');
        s.textContent = t.label; s.style.background = t.bg; s.style.color = t.text;
        new bootstrap.Modal(document.getElementById('fdNodeModal')).show();
    }

    function onNodeHover(el, entering) {
        var bid = entering ? el.dataset.buoy : null;
        if (highlightBuoyId === bid) return;
        highlightBuoyId = bid;
        drawCanvas();
        document.querySelectorAll('.fd-node').forEach(function (n) {
            n.style.opacity = (!bid || n.dataset.buoy === bid) ? '1' : '0.18';
        });
    }

    /* ── Zoom & Pan ─────────────────────────────────────────── */
    function applyTransform() {
        var inner = document.getElementById('fdInner');
        if (!inner) return;
        inner.style.transform = 'scale(' + scale + ') translate(' + panX + 'px,' + panY + 'px)';
        inner.style.transformOrigin = '0 0';
        var lbl = document.getElementById('fdZoomLabel');
        if (lbl) lbl.textContent = Math.round(scale * 100) + '%';
        updateStickyHeader();
    }

    function clampScale(s) { return Math.max(0.35, Math.min(3.0, s)); }

    function updateStickyHeader() {
        var vp = document.getElementById('fdViewport');
        var thead = document.querySelector('#fdTable thead');
        if (!vp || !thead) return;
        var visTopLocal = vp.scrollTop / scale - panY;
        thead.style.transform = 'translateY(' + visTopLocal + 'px)';
    }

    function setupZoomPan() {
        var vp = document.getElementById('fdViewport');
        if (!vp) return;

        vp.addEventListener('wheel', function (e) {
            if (!e.ctrlKey) return;
            e.preventDefault();
            scale = clampScale(scale + (e.deltaY < 0 ? 0.1 : -0.1));
            applyTransform();
            drawCanvas();
        }, { passive: false });

        vp.addEventListener('scroll', function () { updateStickyHeader(); });

        vp.addEventListener('mousedown', function (e) {
            if (e.target.closest && e.target.closest('.fd-node')) return;
            isDragging = true;
            dragStartX = e.clientX; dragStartY = e.clientY;
            dragPanX = panX; dragPanY = panY;
            vp.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            panX = dragPanX + (e.clientX - dragStartX) / scale;
            panY = dragPanY + (e.clientY - dragStartY) / scale;
            applyTransform();
        });
        window.addEventListener('mouseup', function () {
            if (!isDragging) return;
            isDragging = false;
            var vp2 = document.getElementById('fdViewport');
            if (vp2) vp2.style.cursor = 'grab';
        });

        var zoomIn = document.getElementById('fdZoomIn');
        var zoomOut = document.getElementById('fdZoomOut');
        var zoomReset = document.getElementById('fdZoomReset');

        if (zoomIn) zoomIn.addEventListener('click', function () {
            scale = clampScale(scale + 0.15); applyTransform(); drawCanvas();
        });
        if (zoomOut) zoomOut.addEventListener('click', function () {
            scale = clampScale(scale - 0.15); applyTransform(); drawCanvas();
        });
        if (zoomReset) zoomReset.addEventListener('click', function () {
            scale = 1; panX = 0; panY = 0; applyTransform(); drawCanvas();
        });
    }

    /* ── Filter ──────────────────────────────────────────────── */
    function setupFilter() {
        var inp = document.getElementById('fdFilterInput');
        if (!inp) return;
        inp.addEventListener('input', function () {
            filterQuery = inp.value.trim();
            var q = filterQuery.toLowerCase();
            document.querySelectorAll('.fd-node').forEach(function (n) {
                n.style.display = (!q || n.dataset.buoy.toLowerCase().indexOf(q) >= 0) ? '' : 'none';
            });
            drawCanvas();
        });
    }

    /* ── Tuyến luồng selector ──────────────────────────────── */
    function setupTuyenLuongSelector() {
        var sel = document.getElementById('fdTuyenLuongSelect');
        if (!sel) return;
        sel.addEventListener('change', function () {
            var tuyenId = sel.value || null;
            gridBuilt = false;
            // Reset zoom/pan
            scale = 1; panX = 0; panY = 0;
            highlightBuoyId = null;
            filterQuery = '';
            var fInp = document.getElementById('fdFilterInput');
            if (fInp) fInp.value = '';

            var grid = document.getElementById('fdGrid');
            if (grid) grid.innerHTML = '<div class="fd-loading"><i class="bi bi-hourglass-split me-2"></i> Đang tải dữ liệu...</div>';

            fetchVongDoiData(tuyenId, function () {
                buildGrid();
                applyTransform();
            });
        });
    }

    /* ── Window resize ─────────────────────────────────────── */
    function setupResize() {
        window.addEventListener('resize', function () {
            if (!gridBuilt) return;
            var table = document.getElementById('fdTable');
            var inner = document.getElementById('fdInner');
            var canvas = document.getElementById('fdCanvas');
            if (table && inner && canvas) {
                var tw = table.scrollWidth, th = table.scrollHeight;
                inner.style.width = tw + 'px'; inner.style.height = th + 'px';
                canvas.width = tw; canvas.height = th;
                drawCanvas();
            }
        });
    }

    /* ── Init ──────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        setupTuyenLuongSelector();
        setupResize();

        // Auto-select first tuyến luồng if available, otherwise load all
        var sel = document.getElementById('fdTuyenLuongSelect');
        var initialTuyenId = null;
        if (sel && sel.options.length > 1) {
            sel.selectedIndex = 1; // Select first tuyến luồng
            initialTuyenId = sel.value;
        }

        fetchVongDoiData(initialTuyenId, function () {
            buildGrid();
            setupZoomPan();
            setupFilter();
            applyTransform();
        });
    });

})();
