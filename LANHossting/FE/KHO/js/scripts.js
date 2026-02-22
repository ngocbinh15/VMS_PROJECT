    const mockData = [
      { id: 'VT000001', name: 'Xăng', unit: 'kg', price: 16048.35, group: 'NHIÊN LIỆU', stocks: { '1': 1000, '2': 50, '3': 20 } },
      { id: 'VT000002', name: 'Diezel', unit: 'kg', price: 23790.08, group: 'NHIÊN LIỆU', stocks: { '1': 20000, '2': 5000, '3': 746 } },
      { id: 'VT000003', name: 'Nhớt HD', unit: 'kg', price: 81371.92, group: 'NHIÊN LIỆU', stocks: { '1': 900, '2': 63, '3': 0 } },
      { id: 'VT000140', name: 'Tấm pin năng lượng mặt trời 12V-45W', unit: 'tấm', price: 5818181.80, group: 'VẬT TƯ KHÁC', stocks: { '1': 20, '2': 5, '3': 5 } },
      { id: 'VT000153', name: 'Đĩa Đèn Lead', unit: 'Cái', price: 1452964.78, group: 'VẬT TƯ KHÁC', stocks: { '1': 10, '2': 8, '3': 0 } },
      { id: 'VT000154', name: 'Mạch Điều khiển', unit: 'Bộ', price: 4110826.13, group: 'VẬT TƯ KHÁC', stocks: { '1': 10, '2': 3, '3': 3 } },
      { id: 'VT000155', name: 'Thấu Kính đèn TRB 220', unit: 'Cái', price: 5151667.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 6, '2': 0, '3': 0 } },
      { id: 'VT000039', name: 'Ma ní 42 (Ma ní nối, neo)', unit: 'Cái', price: 1721920.09, group: 'VẬT TƯ KHÁC', stocks: { '1': 20, '2': 1, '3': 1 } },
      { id: 'VT000040', name: 'Ma ní 45 (Ma ní nối, neo)', unit: 'Cái', price: 1800000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 20, '2': 3, '3': 3 } },
      { id: 'VT000041', name: 'Xích có ngáng cấp 2 f34', unit: 'kg', price: 35051.01, group: 'VẬT TƯ KHÁC', stocks: { '1': 500, '2': 100, '3': 149 } },
      { id: 'VT000042', name: 'Xích có ngáng cấp 2 phi 36', unit: 'kg', price: 38405.24, group: 'VẬT TƯ KHÁC', stocks: { '1': 300, '2': 50, '3': 50 } },
      { id: 'VT000043', name: 'Xích có ngáng cấp 2 phi 38', unit: 'kg', price: 39491.32, group: 'VẬT TƯ KHÁC', stocks: { '1': 200, '2': 40, '3': 40 } },
      { id: 'VT000044', name: 'Xích có ngáng cấp 2 phi 40', unit: 'kg', price: 38443.76, group: 'VẬT TƯ KHÁC', stocks: { '1': 150, '2': 30, '3': 30 } },
      { id: 'VT000045', name: 'Vòng nối phi 50 (Chi tiết liên kết)', unit: 'Cái', price: 1048668.91, group: 'VẬT TƯ KHÁC', stocks: { '1': 50, '2': 10, '3': 10 } },
      { id: 'VT000046', name: 'Vòng nối phi 55 (Chi Tiết Liên Kết)', unit: 'Cái', price: 1211640.96, group: 'VẬT TƯ KHÁC', stocks: { '1': 40, '2': 8, '3': 8 } },
      { id: 'VT000047', name: 'Con quay phi 45 (Chi tiết liên kết)', unit: 'Cái', price: 1058608.54, group: 'VẬT TƯ KHÁC', stocks: { '1': 60, '2': 12, '3': 12 } },
      { id: 'VT000048', name: 'Mắt may 42 (Mắt Cuối)', unit: 'Cái', price: 486876.93, group: 'VẬT TƯ KHÁC', stocks: { '1': 30, '2': 6, '3': 6 } },
      { id: 'VT000049', name: 'Mắt may 45 (Mắt Cuối)', unit: 'Cái', price: 450614.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 25, '2': 5, '3': 5 } },
      { id: 'VT000050', name: 'Con Quay 50 (Mắt Xoay)', unit: 'Cái', price: 2511148.88, group: 'VẬT TƯ KHÁC', stocks: { '1': 15, '2': 3, '3': 3 } },
      { id: 'VT000051', name: 'Quang trở (nhật quang)', unit: 'Cái', price: 104675.50, group: 'VẬT TƯ KHÁC', stocks: { '1': 100, '2': 20, '3': 20 } },
      { id: 'VT000052', name: 'Ron nắp phao 10 ly', unit: 'Cái', price: 125779.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 200, '2': 40, '3': 40 } },
      { id: 'VT000054', name: 'NLMT BP 350-40W', unit: 'tấm', price: 4673625.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 10, '2': 2, '3': 2 } },
      { id: 'VT000056', name: 'Bộ điều khiển nạp 60A-12V DC', unit: 'Bộ', price: 10995391.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000057', name: 'Đế đuôi đèn VMS RB 400', unit: 'Bộ', price: 661500.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 50, '2': 10, '3': 10 } },
      { id: 'VT000058', name: 'Bộ điều khiển VMS SRB 220', unit: 'Bộ', price: 75439212.67, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000060', name: 'Bộ truyền động đèn VMS-RB 220', unit: 'Bộ', price: 46284305.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000061', name: 'Bộ motor VMS- RB 220', unit: 'Bộ', price: 46284305.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000063', name: 'Đèn MS-L133-GSM led lanten', unit: 'Bộ', price: 37648150.80, group: 'VẬT TƯ KHÁC', stocks: { '1': 3, '2': 0, '3': 0 } },
      { id: 'VT000064', name: 'Bộ giám sát BHHH từ xa GSM', unit: 'Bộ', price: 40038322.60, group: 'VẬT TƯ KHÁC', stocks: { '1': 3, '2': 0, '3': 0 } },
      { id: 'VT000066', name: 'Đuôi đèn báo hiệu hàng hải (Inox 304 )', unit: 'Bộ', price: 720000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 20, '2': 4, '3': 4 } },
      { id: 'VT000068', name: 'Bộ đổi bóng đèn TRB - 400', unit: 'Bộ', price: 9931319.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000069', name: 'Đèn MS - L133 led', unit: 'Cái', price: 21441818.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 4, '2': 0, '3': 0 } },
      { id: 'VT000070', name: 'Máy thay bóng VMS-SRB 400', unit: 'Cái', price: 43697273.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000071', name: 'Bộ truyền động và motor VMS. SRB 400', unit: 'Cái', price: 72600000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 1, '2': 0, '3': 0 } },
      { id: 'VT000072', name: 'Đèn Led AECS _NM3 LED lantern', unit: 'Cái', price: 15828057.09, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000073', name: 'Bộ đổi bóng đèn RB400', unit: 'Cái', price: 43636363.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000074', name: 'Bộ điều khiển motor đèn RB400-2017', unit: 'Cái', price: 80181817.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 1, '2': 0, '3': 0 } },
      { id: 'VT000075', name: 'Bộ điều khiển motor đèn RB400-2018', unit: 'Cái', price: 83471818.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 1, '2': 0, '3': 0 } },
      { id: 'VT000077', name: 'Cân Phao (2,4m)', unit: 'Cái', price: 13939877.50, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000079', name: 'Motor đèn RB 400', unit: 'Bộ', price: 22727272.50, group: 'VẬT TƯ KHÁC', stocks: { '1': 3, '2': 0, '3': 0 } },
      { id: 'VT000081', name: 'Rùa BTCT 09Tấn', unit: 'Quả', price: 21460542.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000090', name: 'Pin NL- MT 12V-50W', unit: 'tấm', price: 4662665.18, group: 'VẬT TƯ KHÁC', stocks: { '1': 10, '2': 2, '3': 2 } },
      { id: 'VT000004', name: 'Bóng 12v-10w', unit: 'Cái', price: 660000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 50, '2': 10, '3': 10 } },
      { id: 'VT000005', name: 'Bóng HD 12v-20w', unit: 'Cái', price: 663779.46, group: 'VẬT TƯ KHÁC', stocks: { '1': 60, '2': 12, '3': 12 } },
      { id: 'VT000006', name: 'Bóng HD 12v-100w', unit: 'Cái', price: 673145.59, group: 'VẬT TƯ KHÁC', stocks: { '1': 40, '2': 8, '3': 8 } },
      { id: 'VT000007', name: 'Bóng HD 12v-5A', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000008', name: 'Bóng halogen 24v -180w', unit: 'Cái', price: 514846.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 30, '2': 6, '3': 6 } },
      { id: 'VT000009', name: 'Halogen 12-35w', unit: 'Cái', price: 525766.96, group: 'VẬT TƯ KHÁC', stocks: { '1': 25, '2': 5, '3': 5 } },
      { id: 'VT000010', name: 'Bóng HD 12v-75w', unit: 'Cái', price: 787060.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 35, '2': 7, '3': 7 } },
      { id: 'VT000011', name: 'Bộ chớp 12v-30w-3\' (0,5 +2,5)', unit: 'Bộ', price: 157043.46, group: 'VẬT TƯ KHÁC', stocks: { '1': 15, '2': 3, '3': 3 } },
      { id: 'VT000012', name: 'Bộ chớp 12v Móc A-6\'', unit: 'Bộ', price: 111444.62, group: 'VẬT TƯ KHÁC', stocks: { '1': 10, '2': 2, '3': 2 } },
      { id: 'VT000013', name: 'Bộ chớp 12v -(2+1)-10\'', unit: 'Bộ', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000014', name: 'Bộ chớp 12v -(6+1)-15\'', unit: 'Bộ', price: 90548.71, group: 'VẬT TƯ KHÁC', stocks: { '1': 12, '2': 2, '3': 2 } },
      { id: 'VT000015', name: 'Bộ chớp 12v Móc A-10\'', unit: 'Bộ', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000016', name: 'Máy chớp 12v-30w (0,5+0,5+0,5+0,5+5,5)=10\'', unit: 'Cái', price: 295050.88, group: 'VẬT TƯ KHÁC', stocks: { '1': 8, '2': 1, '3': 1 } },
      { id: 'VT000017', name: 'Máy chớp 12v-30w (nhóm 9) 15\'', unit: 'Cái', price: 602900.75, group: 'VẬT TƯ KHÁC', stocks: { '1': 6, '2': 1, '3': 1 } },
      { id: 'VT000018', name: 'Máy chớp 12v-30w (2+1) 6\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000019', name: 'Máy chớp 12v-30w (0,5+1+0,5+3).5\'', unit: 'Cái', price: 469717.20, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000020', name: 'Máy chớp 12v-30w (0,5+1) 1,5\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000021', name: 'Máy chớp 12v-30w (0,5+0,5) 1\'', unit: 'Cái', price: 173869.36, group: 'VẬT TƯ KHÁC', stocks: { '1': 4, '2': 1, '3': 1 } },
      { id: 'VT000022', name: 'Máy chớp 12v-30w (0,5+4,5) 5\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000023', name: 'Máy chớp 12v-30w (nhóm 3). 15\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000024', name: 'Máy chớp 12v-30w (6+1)..10\'', unit: 'Cái', price: 482926.80, group: 'VẬT TƯ KHÁC', stocks: { '1': 7, '2': 1, '3': 1 } },
      { id: 'VT000025', name: 'Máy chớp 12v-30w (nhóm 9) 10\'', unit: 'Cái', price: 482926.67, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000026', name: 'Máy chớp 12v-30w (3+1)..10\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000027', name: 'Máy chớp 12v-30w (nhóm 2).15\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000028', name: 'Máy chớp 12v-30w (0,5+3,5).4\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000029', name: 'Máy chớp 12v-30w (1+4) .5\'', unit: 'Cái', price: 0, group: 'VẬT TƯ KHÁC', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000030', name: 'Máy chớp 12v-30w (0,25+0,25) 0,5\'', unit: 'Cái', price: 434634.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 3, '2': 1, '3': 1 } },
      { id: 'VT000031', name: 'Máy chớp 12v-30w (nhóm 3) .5\'', unit: 'Cái', price: 579512.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 4, '2': 1, '3': 1 } },
      { id: 'VT000032', name: 'Máy chớp 12v-30w (3+1)=12 s', unit: 'Bộ', price: 743880.67, group: 'VẬT TƯ KHÁC', stocks: { '1': 6, '2': 1, '3': 1 } },
      { id: 'VT000033', name: 'Máy chớp 12v-30w (0,25+0,75)=1 s', unit: 'Bộ', price: 782390.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000037', name: 'Máy chớp điện tử đa năng 12 V - 150W', unit: 'Bộ', price: 3240442.75, group: 'VẬT TƯ KHÁC', stocks: { '1': 8, '2': 2, '3': 2 } },
      { id: 'VT000038', name: 'Máy chớp điện tử đa năng 12 V - 30W', unit: 'Bộ', price: 1200344.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 10, '2': 2, '3': 2 } },
      { id: 'VT000089', name: 'Chớp điện tử đa năng 12V - 50W', unit: 'Bộ', price: 2060000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000035', name: 'Tiết chế nạp pin năng lượng mặt trời 12v - 40A', unit: 'Bộ', price: 11080048.75, group: 'VẬT TƯ KHÁC', stocks: { '1': 3, '2': 1, '3': 1 } },
      { id: 'VT000036', name: 'Tiết chế nạp Pin NLMT 12v-80A', unit: 'Bộ', price: 14605222.40, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000087', name: 'Tiết chế điện tử BPR2-NGT (12V-40A)', unit: 'Bộ', price: 11498000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000088', name: 'Tiết chế điện tử BPR4-NGT (12V- 80A)', unit: 'Bộ', price: 14498000.00, group: 'VẬT TƯ KHÁC', stocks: { '1': 2, '2': 0, '3': 0 } },
      { id: 'VT000141', name: 'P. VT theo phao Con quay phi 50 (Mắt xoay)', unit: 'Cái', price: 0, group: 'VẬT TƯ CẤP THEO PHAO ĐÓNG MỚI', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000142', name: 'P. VT theo phao Vòng nối phi 55 (Chi tiết liên kết)', unit: 'Cái', price: 0, group: 'VẬT TƯ CẤP THEO PHAO ĐÓNG MỚI', stocks: { '1': 0, '2': 0, '3': 0 } },
      { id: 'VT000151', name: 'P. VT theo phao Xích có ngáng cấp 2 F32', unit: 'kg', price: 3782.66, group: 'VẬT TƯ CẤP THEO PHAO ĐÓNG MỚI', stocks: { '1': 50, '2': 10, '3': 10 } },
      { id: 'VT000092', name: 'Rùa 6 Tấn - TP', unit: 'Quả', price: 10201128.33, group: 'VẬT TƯ THÀNH PHẨM', stocks: { '1': 5, '2': 1, '3': 1 } },
      { id: 'VT000094', name: 'Tiết chế 12v - 40A - TP', unit: 'Cái', price: 9880525.50, group: 'VẬT TƯ THÀNH PHẨM', stocks: { '1': 4, '2': 1, '3': 1 } },
      { id: 'VT000097', name: 'Máy chớp đồng bộ điện tử đa năng 12 V- 30W - TP', unit: 'Cái', price: 30448258.00, group: 'VẬT TƯ THÀNH PHẨM', stocks: { '1': 3, '2': 0, '3': 0 } }
    ];

    let currentPage = 1, rowsPerPage = 10, currentAction = 'NHAP';
    // [THÊM MỚI] Biến để lưu danh sách chờ và lịch sử
    let draftTransactions = [];
    let transactionHistory = [];

    // [CẬP NHẬT] Thêm dữ liệu mẫu cho lịch sử (Dạng Phiếu)
    transactionHistory = [
      {
        time: "05/01/2026 09:30:00",
        wh: "Kho Tổng",
        items: [
          { name: "Xăng", qty: 200, type: "NHAP", destName: null, id: "VT000001" },
          { name: "Diezel", qty: 500, type: "NHAP", destName: null, id: "VT000002" }
        ]
      },
      {
        time: "04/01/2026 14:15:00",
        wh: "Trạm Bình Thuận",
        items: [
          { name: "Bóng 12v-10w", qty: 10, type: "XUAT", destName: null, id: "VT000004" }
        ]
      }
    ];

    const whSelect = document.getElementById('currentWarehouse');
    const fmtNum = n => new Intl.NumberFormat('vi-VN').format(n);
    const fmtMoney = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    const getStock = i => i.stocks[whSelect.value] || 0;

    function renderTable() {
      const tbody = document.getElementById('tableBody'); tbody.innerHTML = '';
      const start = (currentPage - 1) * rowsPerPage;
      const items = mockData.slice(start, start + rowsPerPage);
      let totalVal = 0, lowStock = 0;
      mockData.forEach(i => { const s = getStock(i); totalVal += s * i.price; if (s < 10 && s > 0) lowStock++; });
      document.getElementById('totalValueDisplay').innerText = fmtMoney(totalVal);
      document.getElementById('lowStockDisplay').innerText = lowStock;
      document.getElementById('totalItemsDisplay').innerText = mockData.length;
      items.forEach((item, idx) => {
        const s = getStock(item);
        let badge = s === 0 ? 'bg-danger bg-opacity-10 text-danger' : (s < 10 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success');
        tbody.innerHTML += `<tr><td class="ps-4 fw-bold text-muted">${start + idx + 1}</td><td><span class="badge bg-light text-dark border font-monospace">${item.id}</span></td><td class="fw-semibold text-dark">${item.name}</td><td class="text-center small fw-bold text-secondary">${item.unit}</td><td class="text-end text-muted currency-num">${fmtNum(item.price)}</td><td class="text-center"><span class="badge-modern ${badge}">${fmtNum(s)}</span></td><td class="text-end fw-bold text-dark pe-4 currency-num">${fmtNum(s * item.price)}</td></tr>`;
      });
      renderPagination();
    }

    function renderPagination() {
      const total = Math.ceil(mockData.length / rowsPerPage);
      const el = document.getElementById('paginationControl');
      document.getElementById('pageInfo').innerText = `Trang ${currentPage} / ${total}`;
      let html = '';
      for (let i = 1; i <= total; i++) html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><button class="page-link border-0 rounded-2 fw-bold mx-1 ${i === currentPage ? 'bg-primary text-white' : ''}" onclick="changePage(${i})">${i}</button></li>`;
      el.innerHTML = html;
    }
    window.changePage = p => { currentPage = p; renderTable(); };
    whSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });
    document.getElementById('rowsPerPage').addEventListener('change', function () { rowsPerPage = parseInt(this.value); currentPage = 1; renderTable(); });
    renderTable();

    window.selectAction = function (type) {
      currentAction = type;
      document.querySelectorAll('.btn-action').forEach(b => b.className = 'btn-action');
      const map = { 'NHAP': ['btnNhap', 'active-import'], 'XUAT': ['btnXuat', 'active-export'], 'DIEUCHUYEN': ['btnChuyen', 'active-transfer'] };
      document.getElementById(map[type][0]).classList.add(map[type][1]);
      document.getElementById('destWarehouseWrapper').style.display = (type === 'DIEUCHUYEN') ? 'block' : 'none';
    }
    selectAction('NHAP');

    const searchInp = document.getElementById('materialSearchInput');
    const searchRes = document.getElementById('materialSearchResults');
    const selId = document.getElementById('selectedMaterialId');
    const display = document.getElementById('selectedItemDisplay');

    searchInp.addEventListener('input', function () {
      const val = this.value.toLowerCase();
      searchRes.innerHTML = '';
      if (val.length < 1) { searchRes.style.display = 'none'; return; }
      const found = mockData.filter(m => m.id.toLowerCase().includes(val) || m.name.toLowerCase().includes(val));
      searchRes.style.display = 'block';
      if (found.length > 0) {
        found.forEach(item => {
          const s = getStock(item);
          const div = document.createElement('div');
          div.className = 'result-item';
          div.innerHTML = `<div><div class="fw-bold text-dark">${item.name}</div><small class="text-muted font-monospace">${item.id}</small></div><span class="badge bg-light text-dark border">Tồn: ${s}</span>`;
          div.onclick = () => { selectItem(item); };
          searchRes.appendChild(div);
        });
      } else {
        searchRes.innerHTML = `<div class="text-center p-3"><div class="text-muted small mb-2">Không tìm thấy vật tư "${this.value}"</div><button class="btn btn-sm btn-outline-primary fw-bold" onclick="openAddModal('${this.value}')"><i class="bi bi-plus-circle me-1"></i> Thêm mới ngay</button></div>`;
      }
    });
    document.addEventListener('click', e => { if (!searchInp.contains(e.target)) searchRes.style.display = 'none'; });

    function selectItem(item) {
      searchInp.value = item.id; selId.value = item.id;
      const s = getStock(item);
      display.innerHTML = `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill"><i class="bi bi-check-circle-fill me-1"></i> ${item.name} (Tồn: ${s} ${item.unit})</span>`;
      searchRes.style.display = 'none';
    }

    let addModalInstance;
    window.openAddModal = function (name) {
      searchRes.style.display = 'none';
      document.getElementById('newMatName').value = name;
      document.getElementById('newMatCode').value = '';
      document.getElementById('newMatUnit').selectedIndex = 0;
      document.getElementById('newMatGroup').selectedIndex = 0;
      document.getElementById('newMatPrice').value = 0;
      addModalInstance = new bootstrap.Modal(document.getElementById('addMaterialModal'));
      addModalInstance.show();
    }

    window.saveNewMaterial = function () {
      const name = document.getElementById('newMatName').value;
      const code = document.getElementById('newMatCode').value;
      const unit = document.getElementById('newMatUnit').value;
      const group = document.getElementById('newMatGroup').value;
      const price = document.getElementById('newMatPrice').value;
      if (!code) { alert('Vui lòng nhập Mã vật tư!'); return; }
      if (!name) { alert('Vui lòng nhập Tên vật tư!'); return; }
      if (mockData.some(m => m.id === code)) { alert('Mã vật tư này đã tồn tại!'); return; }
      const newItem = { id: code, name: name, unit: unit, price: parseFloat(price) || 0, groupId: group, stocks: { '1': 0, '2': 0, '3': 0 } };
      mockData.push(newItem);
      selectItem(newItem);
      addModalInstance.hide();
      renderTable();
    }

    // [THÊM MỚI] Logic lưu vào danh sách chờ
    window.commitAction = function () {
      const id = selId.value;
      const nameDisplay = display.innerText || searchInp.value;
      const cleanName = nameDisplay.split('(')[0].trim();
      const qty = parseFloat(document.getElementById('inputQty').value);

      if (!id) { alert('Vui lòng chọn vật tư!'); searchInp.focus(); return; }
      if (qty <= 0) { alert('Số lượng phải lớn hơn 0!'); return; }

      // Thêm vào mảng draftTransactions
      const destWhId = document.getElementById('destWarehouse').value;
      const destWhName = document.getElementById('destWarehouse').options[document.getElementById('destWarehouse').selectedIndex].text;

      draftTransactions.push({
        id: id,
        name: cleanName,
        type: currentAction,
        qty: qty,
        dest: currentAction === 'DIEUCHUYEN' ? destWhId : null,
        destName: currentAction === 'DIEUCHUYEN' ? destWhName : null
      });

      renderDraftList();

      // Reset form
      document.getElementById('inputQty').value = 1;
      searchInp.value = ''; selId.value = ''; display.innerHTML = '';
    }

    // Hàm render danh sách chờ từ mảng draftTransactions
    function renderDraftList() {
      const tbody = document.getElementById('sessionListBody');
      tbody.innerHTML = '';

      draftTransactions.forEach((item, index) => {
        let badge = '';
        let desc = '';

        if (item.type === 'NHAP') {
          badge = '<span class="badge bg-success-subtle text-success border border-success fw-bold"><i class="bi bi-arrow-down"></i> NHẬP</span>';
        } else if (item.type === 'XUAT') {
          badge = '<span class="badge bg-danger-subtle text-danger border border-danger fw-bold"><i class="bi bi-arrow-up"></i> XUẤT</span>';
        } else {
          badge = '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning fw-bold"><i class="bi bi-arrow-right"></i> CHUYỂN</span>';
          desc = `<div class="small text-muted fst-italic mt-1" style="font-size:0.75rem">đến ${item.destName}</div>`;
        }

        const row = `<tr class="animate-fade-in border-bottom">
                <td class="ps-3 py-3">
                    <div class="fw-bold text-dark text-truncate" style="max-width: 160px;">${item.name}</div>
                    <div class="small font-monospace text-muted mt-1">${item.id}</div>
                </td>
                <td class="text-end py-3 pe-3">
                    <div class="d-flex flex-column align-items-end gap-1">
                        ${badge}
                        ${desc}
                        <div class="fw-bold fs-5 mt-1 text-dark">${item.qty}</div>
                    </div>
                </td>
                <td class="text-end py-3 pe-3" style="width: 10px; vertical-align: top;">
                    <button class="btn btn-sm btn-light text-danger border-0 rounded-circle p-2" onclick="removeDraft(${index})" title="Xóa">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });

      checkEmpty();
    }

    function removeDraft(index) {
      draftTransactions.splice(index, 1);
      renderDraftList();
    }
    // End Thêm Mới

    window.checkEmpty = function () {
      const count = draftTransactions.length;
      if (count === 0) document.getElementById('emptyState').classList.remove('d-none');
      else document.getElementById('emptyState').classList.add('d-none');
      document.getElementById('itemCountBadge').innerText = count;
    }

    window.clearAllDraft = function () {
      draftTransactions = [];
      renderDraftList();
    }

    // [THÊM MỚI] Hàm xử lý Hoàn Tất & Lưu
    window.finishAndSave = function () {
      if (draftTransactions.length === 0) {
        alert('Chưa có giao dịch nào để lưu!');
        return;
      }

      const currentWhId = whSelect.value;
      const currentWhName = whSelect.options[whSelect.selectedIndex].text;
      const now = new Date().toLocaleString('vi-VN');

      // Tạo đối tượng Phiếu mới (Log Session)
      const newSession = {
        time: now,
        wh: currentWhName,
        items: JSON.parse(JSON.stringify(draftTransactions)) // Copy mảng
      };

      // Cập nhật tồn kho (Logic cũ)
      draftTransactions.forEach(t => {
        const item = mockData.find(m => m.id === t.id);
        if (item) {
          if (t.type === 'NHAP') {
            item.stocks[currentWhId] = (item.stocks[currentWhId] || 0) + t.qty;
          } else if (t.type === 'XUAT') {
            item.stocks[currentWhId] = (item.stocks[currentWhId] || 0) - t.qty;
          } else if (t.type === 'DIEUCHUYEN') {
            item.stocks[currentWhId] = (item.stocks[currentWhId] || 0) - t.qty;
            // Cộng vào kho đích
            if (t.dest) {
              item.stocks[t.dest] = (item.stocks[t.dest] || 0) + t.qty;
            }
          }
        }
      });

      // Lưu phiếu vào lịch sử
      transactionHistory.unshift(newSession);

      // Hoàn tất
      alert('Đã cập nhật tồn kho thành công!');
      draftTransactions = [];
      renderDraftList();
      renderTable(); // Cập nhật lại bảng chính

      // Đóng modal
      const modalEl = document.getElementById('sessionModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    }

    // [CẬP NHẬT] Xem danh sách Log (Level 1)
    window.showHistory = function () {
      const tbody = document.getElementById('historyTableBody');
      tbody.innerHTML = '';
      document.getElementById('emptyHistoryMsg').classList.toggle('d-none', transactionHistory.length > 0);

      transactionHistory.forEach((session, index) => {
        // Tên log = Log - [Thời gian]
        const logName = `Log - ${session.time}`;

        tbody.innerHTML += `<tr>
                <td class="ps-4 fw-bold font-monospace text-primary">${logName}</td>
                <td>${session.wh}</td>
                <td class="text-end pe-4"><button class="btn btn-sm btn-outline-primary fw-bold" onclick="viewSessionDetail(${index})">Xem Chi Tiết</button></td>
            </tr>`;
      });

      const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
      historyModal.show();
    }

    // [CẬP NHẬT] Xem chi tiết Phiếu (Level 2)
    window.viewSessionDetail = function (index) {
      const session = transactionHistory[index];
      const tbody = document.getElementById('detailTableBody');
      tbody.innerHTML = '';

      document.getElementById('detailModalTitle').innerText = `Chi Tiết Giao Dịch`;
      document.getElementById('detailModalSubtitle').innerText = `${session.time} - ${session.wh}`;

      session.items.forEach(t => {
        let badge = '';
        if (t.type === 'NHAP') badge = '<span class="badge bg-success-subtle text-success border border-success">NHẬP</span>';
        else if (t.type === 'XUAT') badge = '<span class="badge bg-danger-subtle text-danger border border-danger">XUẤT</span>';
        else badge = `<span class="badge bg-warning-subtle text-warning border border-warning">CHUYỂN</span> <i class="bi bi-arrow-right small"></i> ${t.destName}`;

        tbody.innerHTML += `<tr>
                <td class="ps-4">
                    <div class="fw-bold text-dark">${t.name}</div>
                    <div class="small text-muted font-monospace">${t.id}</div>
                </td>
                <td class="text-center">${badge}</td>
                <td class="text-end fw-bold fs-6 pe-4">${t.qty}</td>
            </tr>`;
      });

      // Mở Modal chi tiết
      const detailModal = new bootstrap.Modal(document.getElementById('transactionDetailModal'));
      detailModal.show();
    }
    // End Thêm Mới

    // Export Report (GIỮ NGUYÊN CODE V13 CỦA BẠN - ĐÃ CHUẨN)
    function formatNumForExcel(num) {
      if (num === 0 || num === undefined || num === null) return "0";
      return num.toString().replace('.', ',');
    }
    window.exportReport = function () {
      const whId = document.getElementById('currentWarehouse').value;
      const whName = document.getElementById('currentWarehouse').options[document.getElementById('currentWarehouse').selectedIndex].text;
      const date = new Date();
      const dateStr = `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
200
      const startRow = 7;
      const endRow = startRow + mockData.length - 1;

      let tableHTML = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                      xmlns:x="urn:schemas-microsoft-com:office:excel" 
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 11pt;}
                        td, th { border: 1px solid #000000; padding: 5px; text-align: center; vertical-align: middle; }
                        .text-left { text-align: left; } .text-right { text-align: right; }
                        .header-title { font-size: 20px; font-weight: bold; text-transform: uppercase; border: none !important; }
                        .no-border { border: none !important; } .bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <table>
                        <tr><td colspan="17" class="header-title no-border" style="text-align: center;font-weight: bold; font-size: 25px">BIÊN BẢN KIỂM KÊ VẬT TƯ THÀNH PHẨM</td></tr>
                        <tr><td colspan="17" class="no-border" style="text-align: center;font-weight: bold;">Thời điểm kiểm kê: ${dateStr} - Kho: ${whName}</td></tr>
                        <tr><td colspan="17" class="no-border"></td></tr>
                        
                        <tr style="background-color: #f0f0f0; font-weight: bold;">
                            <th rowspan="2">STT</th><th rowspan="2">Mã VT</th><th rowspan="2" style="width: 250px;">Tên nhãn hiệu, quy cách</th><th rowspan="2">ĐVT</th><th rowspan="2">Đơn giá</th>
                            <th colspan="2">Theo sổ kế toán</th><th colspan="2">Kiểm kê</th><th colspan="2">Thừa</th><th colspan="2">Thiếu</th>
                            <th rowspan="2">Còn tốt 100%</th><th rowspan="2">Kém phẩm chất</th><th rowspan="2">Mất phẩm chất</th><th rowspan="2">Ghi chú</th>
                        </tr>
                        <tr style="background-color: #f0f0f0; font-weight: bold;">
                            <th>SL</th><th>Thành tiền</th><th>SL</th><th>Thành tiền</th><th>SL</th><th>Thành tiền</th><th>SL</th><th>Thành tiền</th>
                        </tr>
                        <tr style="font-style: italic; text-align: center;">
                            <td>A</td><td>B</td><td>C</td><td>D</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td><td>13</td>
                        </tr>`;

      // DATA ROWS WITH PER-ROW FORMULAS
      mockData.forEach((item, index) => {
        const stock = item.stocks[whId] || 0;
        const currentRow = startRow + index;
        const displayPrice = item.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        tableHTML += `<tr>
              <td>${index + 1}</td>
              <td class="text-left" style="mso-number-format:'\@'">${item.id}</td>
              <td class="text-left">${item.name}</td>
              <td>${item.unit}</td>
              <td class="text-right" x:num="${item.price}" style="mso-number-format:'#,##0.00'">${item.price}</td>
              <td class="text-center" x:num="${stock}">${stock}</td>
              <td class="text-right" x:num x:fmla="=F${currentRow}*E${currentRow}" style="mso-number-format:'#,##0.00'"></td>
              <td></td>
              <td class="text-right" x:num x:fmla="=H${currentRow}*E${currentRow}" style="mso-number-format:'#,##0.00'"></td>
              <td></td>
              <td class="text-right" x:num x:fmla="=J${currentRow}*E${currentRow}" style="mso-number-format:'#,##0.00'"></td>
              <td></td>
              <td class="text-right" x:num x:fmla="=L${currentRow}*E${currentRow}" style="mso-number-format:'#,##0.00'"></td>
              <td></td><td></td><td></td><td></td>
            </tr>`;
      });

      // TOTAL ROW (SUM G, I, K, M)
      tableHTML += `<tr style="font-weight: bold;">
                <td colspan="5" class="text-center">CỘNG</td>
                <td></td>
                <td x:num x:fmla="=SUM(G${startRow}:G${endRow})" style="mso-number-format:'\#\,\#\#0'; text-align: right;"></td>
                <td></td>
                <td x:num x:fmla="=SUM(I${startRow}:I${endRow})" style="mso-number-format:'\#\,\#\#0'; text-align: right;"></td>
                <td></td>
                <td x:num x:fmla="=SUM(K${startRow}:K${endRow})" style="mso-number-format:'\#\,\#\#0'; text-align: right;"></td>
                <td></td>
                <td x:num x:fmla="=SUM(M${startRow}:M${endRow})" style="mso-number-format:'\#\,\#\#0'; text-align: right;"></td>
                <td></td><td></td><td></td><td></td>
            </tr>`;

      tableHTML += `</table></body></html>`;

      const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `BienBanKiemKe_${whId}_${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }