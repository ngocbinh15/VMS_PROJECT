    const mockBuoys = [
      { id: "KCHT40861", name: "Phao 1", dia: "2,60", lat: "13°43'59.8\"N", long: "109°15'07.0\"E", date: "23/08/2024", lastMaint: "01/01/2025", status: "inactive" },
      { id: "KCHT40820", name: "Phao 2", dia: "2,60", lat: "10°21'05\"N", long: "107°04'10\"E", date: "08/09/2024", lastMaint: "15/12/2024", status: "active" },
      { id: "KCHT40811", name: "Phao 3", dia: "2,60", lat: "10°21'50\"N", long: "107°04'55\"E", date: "12/09/2024", lastMaint: "--", status: "maintenance" },
      { id: "KCHT40823", name: "Phao 3A", dia: "2,60", lat: "10°22'10\"N", long: "107°05'12\"E", date: "12/09/2024", lastMaint: "20/11/2024", status: "active" },
      { id: "KCHT40796", name: "Phao 4", dia: "2,60", lat: "10°22'45\"N", long: "107°05'40\"E", date: "19/09/2024", lastMaint: "10/10/2024", status: "active" },
      { id: "KCHT40828", name: "Phao 4A", dia: "2,00", lat: "10°23'12\"N", long: "107°06'05\"E", date: "31/08/2024", lastMaint: "--", status: "active" },
      { id: "KCHT40822", name: "Phao 5", dia: "2,60", lat: "10°23'50\"N", long: "107°06'30\"E", date: "20/09/2024", lastMaint: "05/01/2025", status: "active" },
      { id: "KCHT40840", name: "Phao 6", dia: "2,00", lat: "10°24'20\"N", long: "107°07'00\"E", date: "29/08/2024", lastMaint: "12/12/2024", status: "active" },
      { id: "KCHT40795", name: "Phao 7", dia: "2,60", lat: "10°24'55\"N", long: "107°07'25\"E", date: "22/08/2024", lastMaint: "--", status: "maintenance" },
      { id: "KCHT40812", name: "Phao 8", dia: "2,00", lat: "10°25'30\"N", long: "107°08'00\"E", date: "04/09/2024", lastMaint: "28/12/2024", status: "active" }
    ];

    function renderBuoys(data) {
      const tbody = document.getElementById('buoyTableBody');
      tbody.innerHTML = '';

      data.forEach((item, index) => {
        let badge = '';
        if (item.status === 'active') badge = '<span class="badge-status badge-active">HOẠT ĐỘNG</span>';
        else if (item.status === 'inactive') badge = '<span class="badge-status bg-secondary-subtle text-secondary">KHÔNG SỬ DỤNG</span>';
        else badge = '<span class="badge-status badge-maint">BẢO TRÌ</span>';

        // Thêm cột lastMaint vào HTML
        const row = `
                    <tr class="animate-fade-in" style="animation-delay: ${index * 0.05}s">
                        <td class="text-center ps-4 fw-bold text-muted">${index + 1}</td>
                        <td>
                            <div class="fw-bold text-dark">${item.id}</div>
                            <div class="small text-muted" style="font-size: 0.75rem;">Mã ĐB: --</div>
                        </td>
                        <td class="fw-semibold text-primary">${item.name}</td>
                        <td class="text-center font-monospace text-muted">${item.dia}</td>
                        <td>
                            <div class="small fw-bold text-dark"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${item.lat}</div>
                            <div class="small text-muted ms-3">${item.long}</div>
                        </td>
                        <td class="small fw-semibold text-secondary">${item.date}</td>
                        <td class="small fw-bold text-dark">${item.lastMaint}</td> <td class="text-center">${badge}</td>
                        <td class="text-end pe-4">
                            <div class="d-flex justify-content-end gap-1">
                                <button class="action-btn view-btn" title="Xem chi tiết" data-bs-toggle="modal" data-bs-target="#buoyDetailModal"><i class="bi bi-eye"></i></button>
                                <button class="action-btn edit-btn" title="Chỉnh sửa" data-bs-toggle="modal" data-bs-target="#buoyDetailModal"><i class="bi bi-pencil-square"></i></button>
                                <button class="action-btn delete-btn delete" title="Xóa"><i class="bi bi-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
        tbody.insertAdjacentHTML('beforeend', row);
      });
    }

    document.getElementById('searchInput').addEventListener('input', function (e) {
      const val = e.target.value.toLowerCase();
      const filtered = mockBuoys.filter(b => b.name.toLowerCase().includes(val) || b.id.toLowerCase().includes(val));
      renderBuoys(filtered);
    });

    renderBuoys(mockBuoys);

    // Lưu trữ dữ liệu gốc và chế độ modal
    const originalModalData = {};
    let currentMode = 'add'; // 'add', 'view', 'edit'

    function saveOriginalModalData() {
      const inputs = document.querySelectorAll('#buoyDetailModal input[type="text"], #buoyDetailModal input[type="number"], #buoyDetailModal input[type="date"], #buoyDetailModal input[type="file"]');
      inputs.forEach((input, idx) => {
        originalModalData[`input-${idx}`] = input.value;
      });

      const selects = document.querySelectorAll('#buoyDetailModal select');
      selects.forEach((select, idx) => {
        originalModalData[`select-${idx}`] = select.selectedIndex;
      });
    }

    function setFormDisabled(disabled) {
      const inputs = document.querySelectorAll('#buoyDetailModal input, #buoyDetailModal select');
      inputs.forEach(input => {
        input.disabled = disabled;
      });
    }

    function updateSaveButton() {
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.style.display = currentMode === 'view' ? 'none' : 'inline-block';
    }

    saveOriginalModalData();

    // Xử lý nút "Thêm Phao"
    document.querySelector('button[data-bs-target="#buoyDetailModal"]:not(.action-btn)').addEventListener('click', function () {
      currentMode = 'add';
      clearBuoyModal();
      setFormDisabled(false);
      updateSaveButton();
    });

    // Xử lý nút "Xem chi tiết" (eye button)
    document.addEventListener('click', function (e) {
      if (e.target.closest('.view-btn')) {
        currentMode = 'view';
        populateBuoyModal();
        setFormDisabled(true);
        updateSaveButton();
      }
    });

    // Xử lý nút "Sửa" (pencil button)
    document.addEventListener('click', function (e) {
      if (e.target.closest('.edit-btn')) {
        currentMode = 'edit';
        populateBuoyModal();
        setFormDisabled(false);
        updateSaveButton();
        document.querySelector('#buoyDetailModal .modal-title').textContent = 'Sửa Thông Tin Phao';
      }
    });

    // Xử lý nút "Xóa" (trash button)
    document.addEventListener('click', function (e) {
      if (e.target.closest('.delete-btn')) {
        if (confirm('Bạn có chắc chắn muốn xóa phao này?')) {
          alert('Phao đã được xóa thành công!');
          // Reload bảng (tạm thời chỉ alert)
        }
      }
    });

    // Xử lý nút "Lưu Thông Tin"
    document.getElementById('saveBtn').addEventListener('click', function () {
      if (currentMode === 'add') {
        alert('Phao mới đã được thêm thành công!');
      } else if (currentMode === 'edit') {
        alert('Thông tin phao đã được cập nhật!');
        currentMode = 'view';
        setFormDisabled(true);
        updateSaveButton();
        document.querySelector('#buoyDetailModal .modal-title').textContent = 'Thông Tin Phao Báo Hiệu';
      }
    });

    function clearBuoyModal() {
      const inputs = document.querySelectorAll('#buoyDetailModal input[type="text"], #buoyDetailModal input[type="number"], #buoyDetailModal input[type="date"], #buoyDetailModal input[type="file"]');
      inputs.forEach(input => {
        input.value = '';
      });

      const selects = document.querySelectorAll('#buoyDetailModal select');
      selects.forEach(select => {
        select.selectedIndex = 0;
      });

      document.querySelector('#buoyDetailModal .modal-title').textContent = 'Thêm Phao Mới';
    }

    function populateBuoyModal() {
      const inputs = document.querySelectorAll('#buoyDetailModal input[type="text"], #buoyDetailModal input[type="number"], #buoyDetailModal input[type="date"], #buoyDetailModal input[type="file"]');
      inputs.forEach((input, idx) => {
        input.value = originalModalData[`input-${idx}`] || '';
      });

      const selects = document.querySelectorAll('#buoyDetailModal select');
      selects.forEach((select, idx) => {
        select.selectedIndex = originalModalData[`select-${idx}`] !== undefined ? originalModalData[`select-${idx}`] : 0;
      });

      document.querySelector('#buoyDetailModal .modal-title').textContent = 'Thông Tin Phao Báo Hiệu';
    }
    // Timeline V2 logic is handled by the inline script in index.html