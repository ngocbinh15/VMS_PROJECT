/**
 * vongdoi.js — Flow Diagram Engine for Vòng Đời Phao  (v4.0)
 * Fetches data from /Phao/GetVongDoiJson and renders the interactive flow diagram.
 *
 * v2.0: Spacer scroll bounds, basic arrow fix, Thu hồi display.
 * v3.0: nodeMap per-element lookup, interaction state machine.
 *
 * v4.0 — DEFINITIVE ARROW FIX:
 *  - Replaced getNodeEdge() (hardcoded edge midpoint) with:
 *    · getNodeRect()      → exact {x,y,w,h,cx,cy} from the .fd-node element
 *    · rectEdgePoint()    → ray from rect-center toward an external point,
 *                           returns the EXACT intersection on the rect boundary.
 *  - Arrow rendering flow:
 *    1. Compute source & dest node centers (cx, cy)
 *    2. Determine bezier control points (cp1, cp2) from direction heuristic
 *    3. Clip source: rectEdgePoint(cp1, srcRect) → curve exits source at edge
 *    4. Clip dest:   rectEdgePoint(cp2, dstRect) → curve enters dest at edge
 *    5. Draw bezier from clipped-start to clipped-end
 *    6. Arrowhead angle = atan2(dstEdge - cp2) — exact bezier tangent at endpoint
 *  - Result: arrows touch the exact bounding-box edge facing the incoming curve.
 *    No pixel offsets, no hardcoded edges, correct at every zoom / scroll / resize.
 *  - Debug mode: red dot at source, blue dot at destination (toggle via DEBUG_DOTS).
 *
 * v4.1 — CROSS-ROUTE RECALL FIX:
 *  - nodeMap key now includes pos: buoyId|yr|sl|pos so same-year same-sl nodes at
 *    different positions (intra-year position change) are distinct.
 *  - Backwards horizontal arc (ci2 < ci1): Thu hồi R-col → new-route deploy L-col
 *    within the same year.  Old hDir=-1 pushed both control points into the narrow
 *    inter-column gap → near-vertical ambiguous line.
 *    New behaviour: both CPs are pushed to the RIGHT of the timeline, forming a
 *    clear C-arc that reads "buoy exited rightward then re-entered at new position".
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
    // NOTE: panX/panY removed — panning is done via fdViewport.scrollLeft/scrollTop.
    var scale = 1.0;
    var isDragging = false, dragStartX = 0, dragStartY = 0, dragStartSL = 0, dragStartST = 0;
    var highlightBuoyId = null;  // mirrors getActiveHighlight() — kept for drawCanvas compat
    var selectedNodeId  = null;  // fixed selection (click-toggle; persists on mouse-out)
    var hoveredNodeId   = null;  // transient hover (only when selectedNodeId === null)
    var nodeClickTimer  = null;  // disambiguate single-click vs double-click
    var nodeMap         = {};    // key: "buoyId|yr|sl" → DOM element (rebuilt on buildGrid)
    var filterQuery = '';
    var gridBuilt = false;
    var isLoading = false;
    // Base content size (unscaled) stored to compute scroll bounds on zoom.
    var baseW = 0, baseH = 0;

    // Debug: draw coloured dots at arrow start/end to verify coordinates.
    // Set to false for production.
    var DEBUG_DOTS = true;

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
                    // Parse ALL steps from API (backend sends full history, sorted by NgayBatDau ASC)
                    var allSteps = (b.steps || []).map(function (s) {
                        return {
                            yr: s.yr,
                            pos: s.pos,
                            sl: s.sl || 'L',
                            type: s.type || 'active',
                            note: s.note || '',
                            date: s.date || ''
                        };
                    });

                    // ── DATA PIPELINE: dedup ───────────────────────────────────────
                    // Rule: 1 year + 1 position + 1 buoy = 1 node
                    // Group by (yr, pos), keep LAST event (most recent since backend sorts ASC).
                    // The last event's sl/type/note become the render attributes.
                    var latestMap = {};  // key: "yr|pos" → step
                    allSteps.forEach(function (s) {
                        latestMap[s.yr + '|' + s.pos] = s;  // overwrites with later event
                    });
                    var steps = [];
                    // Preserve chronological order
                    var seen = {};
                    allSteps.forEach(function (s) {
                        var k = s.yr + '|' + s.pos;
                        if (latestMap[k] === s && !seen[k]) {
                            seen[k] = true;
                            steps.push(s);
                        }
                    });
                    // ── END dedup ──────────────────────────────────────────────

                    return {
                        id: b.id,
                        steps: steps,       // deduped — used for rendering & arrows
                        allSteps: allSteps  // full — used for double-click modal
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
                    // draggable="false" ngăn trình duyệt kích hoạt HTML drag & drop mặc định trên node
                    html += '<div class="fd-node" draggable="false" ' +
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
            // Single click: wait 260 ms to distinguish from double-click
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                if (nodeClickTimer) { clearTimeout(nodeClickTimer); nodeClickTimer = null; return; }
                var target = el;
                nodeClickTimer = setTimeout(function () { nodeClickTimer = null; onNodeSingleClick(target); }, 260);
            });
            // Double click: cancel pending single-click, open detail modal
            el.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (nodeClickTimer) { clearTimeout(nodeClickTimer); nodeClickTimer = null; }
                showNodeModal(el);
            });
            el.addEventListener('mouseenter', function () { onNodeMouseEnter(el); });
            el.addEventListener('mouseleave', function () { onNodeMouseLeave(el); });
            // Disable HTML5 drag & drop
            el.addEventListener('dragstart', function (e) { e.preventDefault(); return false; });
            el.addEventListener('dragover',  function (e) { e.preventDefault(); return false; });
            el.addEventListener('drop',      function (e) { e.preventDefault(); return false; });
        });
        // Rebuild node → DOM element cache (used by getNodeRect for arrow coordinates)
        buildNodeMap();

        // Size canvas to match table; update spacer scroll bounds
        setTimeout(function () {
            var table = document.getElementById('fdTable');
            var inner = document.getElementById('fdInner');
            var canvas = document.getElementById('fdCanvas');
            if (table && inner && canvas) {
                baseW = table.scrollWidth;
                baseH = table.scrollHeight;
                inner.style.width  = baseW + 'px';
                inner.style.height = baseH + 'px';
                canvas.width  = baseW;
                canvas.height = baseH;
                updateSpacerSize();
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

    /* ────────────────────────────────────────────────────────
     * Spacer architecture (fixes blank scroll space):
     *
     *  fdViewport  (overflow:auto, position:relative)
     *    fdSpacer  (display:block, width=baseW*scale, height=baseH*scale)
     *              → IN NORMAL FLOW → owns viewport scroll bounds
     *      fdInner (position:absolute, top:0, left:0)
     *              → pure CSS scale transform, doesn't affect fdSpacer layout
     *
     * Scroll bounds  = fdSpacer size  = baseW*scale × baseH*scale  ✓
     * Visual content = fdInner scaled = baseW*scale × baseH*scale  ✓
     * No blank space regardless of zoom level.
     * ─────────────────────────────────────────────────────── */
    function ensureSpacerExists() {
        if (document.getElementById('fdSpacer')) return;
        var vp    = document.getElementById('fdViewport');
        var inner = document.getElementById('fdInner');
        if (!vp || !inner) return;

        var sp = document.createElement('div');
        sp.id = 'fdSpacer';
        sp.style.cssText = 'position:relative;display:block;min-width:1px;min-height:1px;';

        // Insert spacer where inner currently is, then move inner inside spacer
        vp.insertBefore(sp, inner);
        sp.appendChild(inner);

        // fdInner must be position:absolute so it doesn't affect fdSpacer's layout size
        inner.style.position = 'absolute';
        inner.style.top      = '0';
        inner.style.left     = '0';
        inner.style.display  = 'block'; // override inline-block
    }

    function updateSpacerSize() {
        ensureSpacerExists();
        var sp = document.getElementById('fdSpacer');
        if (sp && baseW > 0 && baseH > 0) {
            sp.style.width  = Math.ceil(baseW * scale) + 'px';
            sp.style.height = Math.ceil(baseH * scale) + 'px';
        }
    }

    /* ── Node map & geometry ──────────────────────────────────────────
     *
     * buildNodeMap()   — O(1) lookup: "buoyId|yr|sl" → DOM element.
     * getNodeRect()    — content-space bounding box {x, y, w, h, cx, cy}.
     * rectEdgePoint()  — exact intersection of a ray (from rect center toward
     *                    an external point) with the rect boundary.
     *
     * Math:
     *   fdInner has CSS  transform: scale(S)  with  transform-origin: 0 0.
     *   For any child E at content position (cx, cy):
     *     E.getBCR().left = inner.getBCR().left + cx * S
     *     ⇒  cx = (E.getBCR().left - inner.getBCR().left) / S
     *
     * rectEdgePoint algorithm:
     *   Given rect center C and external point P, compute direction D = P − C.
     *   Find the minimum positive scalar t such that C + t·D lies exactly on a
     *   rect edge:  t_x = halfW / |Dx|,  t_y = halfH / |Dy|,  t = min(t_x, t_y).
     *   Result = C + t·D  — mathematically exact, no hardcoded offsets.
     * ────────────────────────────────────────────────────────────────── */
    function buildNodeMap() {
        nodeMap = {};
        document.querySelectorAll('.fd-node').forEach(function (el) {
            if (el.dataset.buoy && el.dataset.yr && el.dataset.sl && el.dataset.pos) {
                // Key includes pos so same-year same-sl nodes at different positions are distinct
                nodeMap[el.dataset.buoy + '|' + el.dataset.yr + '|' + el.dataset.sl + '|' + el.dataset.pos] = el;
            }
        });
    }

    /**
     * Returns bounding rect of the actual .fd-node element in canvas content-space.
     * Key: buoyId + yr + sl + pos — includes pos so same-year same-sl nodes at
     * different positions (e.g. position change within one year) are distinguished.
     * @returns {{x:number, y:number, w:number, h:number, cx:number, cy:number}|null}
     */
    function getNodeRect(buoyId, yr, sl, pos) {
        var node  = nodeMap[buoyId + '|' + yr + '|' + sl + '|' + pos];
        var inner = document.getElementById('fdInner');
        if (!node || !inner) return null;
        if (node.style.display === 'none') return null;
        var nr = node.getBoundingClientRect();
        var ir = inner.getBoundingClientRect();
        var x = (nr.left - ir.left) / scale;
        var y = (nr.top  - ir.top)  / scale;
        var w = nr.width  / scale;
        var h = nr.height / scale;
        if (w < 1) w = 88;
        if (h < 1) h = 40;
        return { x: x, y: y, w: w, h: h, cx: x + w / 2, cy: y + h / 2 };
    }

    /**
     * Given an external point and a rectangle, shoot a ray from the rect's center
     * toward the external point and return the EXACT intersection on the rect edge.
     *
     * @param {{x:number,y:number}} outsidePt  — point outside (or on) the rect
     * @param {{x:number,y:number,w:number,h:number,cx:number,cy:number}} rect
     * @returns {{x:number,y:number}}
     */
    function rectEdgePoint(outsidePt, rect) {
        var hw = rect.w / 2;
        var hh = rect.h / 2;
        var dx = outsidePt.x - rect.cx;
        var dy = outsidePt.y - rect.cy;

        // Degenerate: external point is exactly at center → default to right edge
        if (dx === 0 && dy === 0) return { x: rect.cx + hw, y: rect.cy };

        // Minimum scale factor to reach an edge from center along direction (dx, dy)
        var tx = (dx !== 0) ? hw / Math.abs(dx) : Infinity;
        var ty = (dy !== 0) ? hh / Math.abs(dy) : Infinity;
        var t  = Math.min(tx, ty);

        return { x: rect.cx + dx * t, y: rect.cy + dy * t };
    }

    /* ── Canvas draw (v4.0 — center → clip → bezier → arrowhead) ────
     *
     * For each consecutive step pair (s1 → s2) of a buoy:
     *   1. Get source rect (r1) and dest rect (r2) via getNodeRect
     *   2. Use centers (c1, c2) + direction heuristic → compute bezier
     *      control points (cp1, cp2)
     *   3. Clip source endpoint: rectEdgePoint(cp1, r1)
     *      → the point on source edge where the curve exits
     *   4. Clip dest endpoint:   rectEdgePoint(cp2, r2)
     *      → the point on dest edge where the curve arrives
     *   5. Draw bezier: clippedStart → cp1 → cp2 → clippedEnd
     *   6. Arrowhead angle = atan2(clippedEnd − cp2) — exact bezier tangent
     * ──────────────────────────────────────────────────────────────── */
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

                // ── Step 1: get exact node rects ──────────────────────
                var r1 = getNodeRect(buoy.id, s1.yr, s1.sl, s1.pos);
                var r2 = getNodeRect(buoy.id, s2.yr, s2.sl, s2.pos);
                if (!r1 || !r2) continue;

                // Centres in content-space
                var c1x = r1.cx, c1y = r1.cy;
                var c2x = r2.cx, c2y = r2.cy;

                // ── Step 2: direction heuristic → control points ──────
                var ci1 = getColIdx(s1.yr, s1.sl);
                var ci2 = getColIdx(s2.yr, s2.sl);
                var pi1 = getPosIdx(s1.pos);
                var pi2 = getPosIdx(s2.pos);
                var isHoriz = (ci2 !== ci1);

                var dx = c2x - c1x;
                var dy = c2y - c1y;
                var cp1x, cp1y, cp2x, cp2y;

                if (isHoriz) {
                    var hArc = Math.max(Math.abs(dx) * 0.45, 32);
                    if (ci2 < ci1) {
                        // ── Backward: Thu hồi R-col → redeploy L-col (same year) ──
                        // hDir=-1 would squash both CPs into the tiny inter-column gap,
                        // making the curve look like a near-vertical line with no clear
                        // direction. Instead, push both CPs to the RIGHT of the R column
                        // so the bezier forms a C-arc:  source →(right)→ right-pad
                        // →(left+up/down)→ dest.  Visually: buoy exits rightward (recall
                        // / off-route), then curves back to the new-route position.
                        var rightPad = Math.abs(c1x - c2x) + 80 + Math.abs(offset) * 3;
                        var rightAnchor = Math.max(c1x, c2x) + rightPad;
                        cp1x = rightAnchor + offset;
                        cp1y = c1y + offset * 0.3;
                        cp2x = rightAnchor + offset;
                        cp2y = c2y + offset * 0.3;
                    } else {
                        // Normal forward arc (ci2 > ci1: going right in time)
                        cp1x = c1x + hArc + offset;
                        cp1y = c1y + offset * 0.3;
                        cp2x = c2x - hArc + offset;
                        cp2y = c2y + offset * 0.3;
                    }
                } else {
                    var vArc = Math.max(Math.abs(dy) * 0.45, 32);
                    var vDir = (pi2 > pi1) ? 1 : -1;
                    cp1x = c1x + offset;
                    cp1y = c1y + vDir * vArc;
                    cp2x = c2x + offset;
                    cp2y = c2y - vDir * vArc;
                }

                // ── Step 3 & 4: clip endpoints to rect edges ─────────
                var cp1 = { x: cp1x, y: cp1y };
                var cp2 = { x: cp2x, y: cp2y };
                var p1 = rectEdgePoint(cp1, r1);   // curve exits source here
                var p2 = rectEdgePoint(cp2, r2);   // curve arrives at dest here

                // ── Step 5: draw bezier curve ────────────────────────
                var dash = LINE_DASH[s2.type] || [];
                var color = (s2.type === 'incident') ? '#ef4444' :
                    (s2.type === 'maintenance') ? '#f97316' : bc;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = color;
                ctx.lineWidth = lw;
                ctx.setLineDash(dash);
                if (isHL) { ctx.shadowColor = color; ctx.shadowBlur = 8; }

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                ctx.stroke();

                // ── Step 6: arrowhead aligned to bezier tangent ──────
                //    Tangent at t=1 is proportional to (endpoint − cp2).
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

                // ── Debug dots ───────────────────────────────────────
                if (DEBUG_DOTS && !isDim) {
                    ctx.globalAlpha = 1.0;
                    // Red dot at source edge-point
                    ctx.beginPath();
                    ctx.arc(p1.x, p1.y, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();
                    // Blue dot at destination edge-point
                    ctx.beginPath();
                    ctx.arc(p2.x, p2.y, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = '#2563eb';
                    ctx.fill();
                }

                ctx.restore();
            }
        });
    }

    /* ── Interactions ─────────────────────────────────────────────────────
     *
     * State machine:
     *   hoveredNodeId  — set on mouseenter, cleared on mouseleave.
     *                    Ignored when selectedNodeId is set.
     *   selectedNodeId — toggled on single-click.  Persists on mouse-out.
     *
     * Active highlight = selectedNodeId ?? hoveredNodeId
     *
     * Events:
     *   mouseenter  → hover highlight (only when nothing selected)
     *   mouseleave  → clear hover (only when nothing selected)
     *   click ×1    → toggle selectedNodeId (260 ms debounce guards dblclick)
     *   click ×2    → cancel pending single-click, open detail modal
     * ──────────────────────────────────────────────────────────────────── */

    function getActiveHighlight() { return selectedNodeId || hoveredNodeId; }

    function applyHighlight() {
        var bid = getActiveHighlight();
        highlightBuoyId = bid;  // sync for drawCanvas
        drawCanvas();
        document.querySelectorAll('.fd-node').forEach(function (n) {
            n.style.opacity = (!bid || n.dataset.buoy === bid) ? '1' : '0.18';
        });
    }

    // showNodeModal: populate and open the detail Bootstrap modal.
    // Shows the latest event at the top, plus full timeline of ALL events
    // in that year at that position for this buoy.
    function showNodeModal(el) {
        var bi      = parseInt(el.dataset.bi);
        var bc      = BUOY_COLORS[bi % BUOY_COLORS.length];
        var type    = el.dataset.type;
        var t       = TYPES[type] || TYPES.active;
        var buoyId  = el.dataset.buoy;
        var yr      = parseInt(el.dataset.yr);
        var pos     = el.dataset.pos;

        document.getElementById('fdNodeDot').style.background = bc;
        document.getElementById('fdNodeTitle').textContent = 'Chi tiết · ' + pos + ' / ' + yr;
        document.getElementById('fdNodeId').textContent    = buoyId;
        document.getElementById('fdNodePos').textContent   = pos;
        document.getElementById('fdNodeYear').textContent  = yr;
        document.getElementById('fdNodeNote').textContent  = el.dataset.note || '(không có ghi chú)';
        var s = document.getElementById('fdNodeStatus');
        s.textContent = t.label; s.style.background = t.bg; s.style.color = t.text;

        // Build full event history for this (buoy, year, position)
        var histEl = document.getElementById('fdNodeHistory');
        if (histEl) {
            var buoy = BUOYS.find(function (b) { return b.id === buoyId; });
            var events = buoy ? buoy.allSteps.filter(function (st) {
                return st.yr === yr && st.pos === pos;
            }) : [];

            if (events.length <= 1) {
                histEl.style.display = 'none';
            } else {
                histEl.style.display = '';
                var html = '<div class="tl-label mb-1">LỊCH SỬ TRONG NĂM ' + yr + '</div>';
                html += '<div class="list-group list-group-flush" style="font-size:.85rem;">';
                // Show most recent first
                for (var i = events.length - 1; i >= 0; i--) {
                    var ev = events[i];
                    var evT = TYPES[ev.type] || TYPES.active;
                    var dateStr = ev.date || '';
                    var isLatest = (i === events.length - 1);
                    html += '<div class="list-group-item px-0 py-1 border-0 d-flex align-items-center gap-2' +
                        (isLatest ? ' fw-bold' : ' text-muted') + '">';
                    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' +
                        evT.bg + ';border:1px solid ' + evT.text + ';"></span>';
                    html += '<span>' + dateStr + '</span>';
                    html += '<span style="padding:1px 8px;border-radius:12px;font-size:.75rem;background:' +
                        evT.bg + ';color:' + evT.text + ';">' + evT.label + '</span>';
                    if (ev.note) html += '<span class="text-secondary" style="font-size:.78rem;">' + escHtml(ev.note) + '</span>';
                    html += '</div>';
                }
                html += '</div>';
                histEl.innerHTML = html;
            }
        }

        new bootstrap.Modal(document.getElementById('fdNodeModal')).show();
    }

    // onNodeSingleClick: toggle fixed selection for a node's buoy.
    function onNodeSingleClick(el) {
        var bid = el.dataset.buoy;
        if (selectedNodeId === bid) {
            selectedNodeId = null;   // second click on same node → deselect
        } else {
            selectedNodeId = bid;    // first click → pin highlight
            hoveredNodeId  = null;   // clear transient hover
        }
        applyHighlight();
    }

    // onNodeMouseEnter: highlight on hover only when no fixed selection exists.
    function onNodeMouseEnter(el) {
        if (selectedNodeId !== null) return;  // selection has priority
        var bid = el.dataset.buoy;
        if (hoveredNodeId === bid) return;
        hoveredNodeId = bid;
        applyHighlight();
    }

    // onNodeMouseLeave: clear hover. Does nothing when a node is selected.
    function onNodeMouseLeave(el) {
        if (selectedNodeId !== null) return;  // selection has priority
        if (!hoveredNodeId) return;
        hoveredNodeId = null;
        applyHighlight();
    }

    /* ── Zoom & Pan ─────────────────────────────────────────── */
    // applyTransform: scale-only CSS transform on fdInner.
    // Pan is done via fdViewport native scroll — no CSS translate.
    function applyTransform() {
        var inner = document.getElementById('fdInner');
        if (!inner) return;
        inner.style.transform       = 'scale(' + scale + ')';
        inner.style.transformOrigin = '0 0';
        var lbl = document.getElementById('fdZoomLabel');
        if (lbl) lbl.textContent = Math.round(scale * 100) + '%';
        updateSpacerSize();
        updateStickyHeader();
    }

    function clampScale(s) { return Math.max(0.35, Math.min(3.0, s)); }

    // Sticky thead: offset in fdInner-content-space = scrollTop / scale
    // (because fdViewport scrolls in visual px, and fdInner is scaled by `scale`)
    function updateStickyHeader() {
        var vp = document.getElementById('fdViewport');
        var thead = document.querySelector('#fdTable thead');
        if (!vp || !thead) return;
        thead.style.transform = 'translateY(' + (vp.scrollTop / scale) + 'px)';
    }

    function setupZoomPan() {
        var vp = document.getElementById('fdViewport');
        if (!vp) return;

        // ── Ctrl+Wheel → zoom centred on cursor ──────────────
        vp.addEventListener('wheel', function (e) {
            if (!e.ctrlKey) return;
            e.preventDefault();

            var prevScale = scale;
            var delta = e.deltaY < 0 ? 0.1 : -0.1;
            scale = clampScale(scale + delta);

            // Keep content under the cursor stationary while zooming.
            // Cursor's position within the viewport (not page):
            var vpRect  = vp.getBoundingClientRect();
            var cursorX = e.clientX - vpRect.left;   // px from viewport left
            var cursorY = e.clientY - vpRect.top;    // px from viewport top

            // Content coordinate under cursor before zoom:
            //   contentX = (scrollLeft + cursorX) / prevScale
            var contentX = (vp.scrollLeft + cursorX) / prevScale;
            var contentY = (vp.scrollTop  + cursorY) / prevScale;

            applyTransform();   // updates spacer size to new scale

            // Scroll so that same content coord is still under cursor:
            vp.scrollLeft = contentX * scale - cursorX;
            vp.scrollTop  = contentY * scale - cursorY;

            drawCanvas();
        }, { passive: false });

        // ── Scroll → update sticky header ───────────────────
        vp.addEventListener('scroll', function () { updateStickyHeader(); });

        // ── Mouse drag → pan (scroll) ────────────────────────
        vp.addEventListener('mousedown', function (e) {
            if (e.target.closest && e.target.closest('.fd-node')) return;
            isDragging      = true;
            dragStartX      = e.clientX;
            dragStartY      = e.clientY;
            dragStartSL     = vp.scrollLeft;
            dragStartST     = vp.scrollTop;
            vp.style.cursor = 'grabbing';
            e.preventDefault();
        });
        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            vp.scrollLeft = dragStartSL - (e.clientX - dragStartX);
            vp.scrollTop  = dragStartST - (e.clientY - dragStartY);
        });
        window.addEventListener('mouseup', function () {
            if (!isDragging) return;
            isDragging = false;
            var vp2 = document.getElementById('fdViewport');
            if (vp2) vp2.style.cursor = 'grab';
        });

        // ── Zoom buttons ─────────────────────────────────────
        var zoomIn    = document.getElementById('fdZoomIn');
        var zoomOut   = document.getElementById('fdZoomOut');
        var zoomReset = document.getElementById('fdZoomReset');

        if (zoomIn) zoomIn.addEventListener('click', function () {
            scale = clampScale(scale + 0.15); applyTransform(); drawCanvas();
        });
        if (zoomOut) zoomOut.addEventListener('click', function () {
            scale = clampScale(scale - 0.15); applyTransform(); drawCanvas();
        });
        if (zoomReset) zoomReset.addEventListener('click', function () {
            scale = 1;
            applyTransform();
            var vpR = document.getElementById('fdViewport');
            if (vpR) { vpR.scrollLeft = 0; vpR.scrollTop = 0; }
            drawCanvas();
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
            // Reset zoom, scroll & interaction state
            scale = 1;
            highlightBuoyId = null;
            selectedNodeId  = null;
            hoveredNodeId   = null;
            if (nodeClickTimer) { clearTimeout(nodeClickTimer); nodeClickTimer = null; }
            nodeMap = {};
            filterQuery = '';
            var fInp = document.getElementById('fdFilterInput');
            if (fInp) fInp.value = '';
            var vp = document.getElementById('fdViewport');
            if (vp) { vp.scrollLeft = 0; vp.scrollTop = 0; }

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
                baseW = table.scrollWidth;
                baseH = table.scrollHeight;
                inner.style.width  = baseW + 'px';
                inner.style.height = baseH + 'px';
                canvas.width  = baseW;
                canvas.height = baseH;
                updateSpacerSize();
                drawCanvas();
            }
        });
    }

    /* ── Init ──────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        // Set up the spacer DOM structure FIRST (before any other setup)
        // so fdViewport scroll bounds are ready when data arrives.
        ensureSpacerExists();

        setupTuyenLuongSelector();
        setupResize();

        // Auto-select first tuyến luồng if available, otherwise load all
        var sel = document.getElementById('fdTuyenLuongSelect');
        var initialTuyenId = null;
        if (sel && sel.options.length > 1) {
            sel.selectedIndex = 1;
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
