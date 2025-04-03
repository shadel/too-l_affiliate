document.addEventListener("DOMContentLoaded", function (e) {
  const modalHTML = `
  <div class="modal-overlay" id="statusModal" style="display: none;">
      <div class="modal">
          <div class="modal-header">
              <h2 class="modal-title">Tạo Status</h2>
          </div>
          <div class="modal-body">
              <div class="input-group">
                  <textarea id="statusContentInput" class="text-input" placeholder="Nhập nội dung status của bạn vào đây..." rows="4"></textarea>
              </div>
              <div class="input-group" style="margin-top: 16px;">
                  <label for="mediaFileInput" class="file-input-label" style="
                      padding: 8px 16px;
                      background: #0066cc;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      gap: 5px;
                      font-size: 14px;
                      min-width: 90px;
                  ">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      Chọn ảnh/video
                  </label>
                  <input type="file" id="mediaFileInput" accept="image/*, video/*" style="display: none;" />
              </div>
              <div id="mediaPreview" style="margin-top: 16px; display: none;">
                  <img id="previewImage" src="#" alt="Preview" style="max-width: 100%; max-height: 200px; display: none;" />
                  <video id="previewVideo" controls style="max-width: 100%; max-height: 200px; display: none;"></video>
              </div>
          </div>
          <div class="modal-footer">
              <button class="btn-secondary" id="cancelpostStatusBtn">Hủy</button>
              <button class="btn-primary" id="postStatusBtn">Đăng</button>
          </div>
      </div>
  </div>

  <style>
      .file-input-label:hover {
          background: #0052a3 !important;
      }
      .file-input-label:active {
          background: #004080 !important;
      }
  </style>
`;
  // Add this HTML after the existing modalHTML declaration
  const groupNameModalHTML = `
    <div class="modal-overlay" id="groupNameModal" style="display: none;">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Tạo nhóm content</h2>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <input type="text" id="groupNameInput" class="text-input" placeholder="Nhập tên nhóm content..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="cancelGroupNameBtn">Hủy</button>
          <button class="btn-primary" id="saveGroupNameBtn">Lưu</button>
        </div>
      </div>
    </div>
  `;
  // Add this modal HTML after the existing modalHTML declarations
  const editContentModalHTML = `
  <div class="modal-overlay" id="editContentModal" style="display: none;">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Xem/Chỉnh sửa nội dung</h2>
      </div>
      <div class="modal-body">
        <div class="input-group">
          <label>Status:</label>
          <textarea id="editStatusContent" class="text-input" rows="4"></textarea>
        </div>
        <div class="input-group" style="margin-top: 16px;">
          <label>Path:</label>
          <input type="text" id="editPathContent" class="text-input" readonly />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="cancelEditContentBtn">Hủy</button>
        <button class="btn-primary" id="saveEditContentBtn">Lưu</button>
      </div>
    </div>
  </div>
  `;

  // Add this to your DOMContentLoaded event listener
  document.body.insertAdjacentHTML("beforeend", editContentModalHTML);
  document.body.insertAdjacentHTML("beforeend", groupNameModalHTML);
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const mediaFileInput = document.getElementById("mediaFileInput");
  const mediaPreview = document.getElementById("mediaPreview");
  const previewImage = document.getElementById("previewImage");
  const previewVideo = document.getElementById("previewVideo");
  const statusContentInput = document.getElementById("statusContentInput");
  const resultsTbody = document.getElementById("results-tbody-content");
  // Chọn checkbox "Select All"
  const selectAllCheckbox = document.getElementById(
    "selectAllContent"
  );

  async function loadAccountGroups(selectedGroup = "all") {
    const filePath = path.join(__dirname, "data", "content.json");

    try {
      if (!fs.existsSync(filePath)) {
        // Khởi tạo trạng thái rỗng nếu file không tồn tại
        // initializeEmptyState();
        console.warn("File không tồn tại, khởi tạo trạng thái mặc định.");
        return;
      }

      const fileData = fs.readFileSync(filePath, "utf-8");
      let groups = JSON.parse(fileData);

      // Kiểm tra dữ liệu trong file JSON
      if (!Array.isArray(groups)) {
        console.error("Dữ liệu trong file không hợp lệ, phải là một mảng.");
        // initializeEmptyState();
        return;
      }

      console.log("Danh sách nhóm tài khoản:", groups);

      // Cập nhật danh sách nhóm trong select element
      updateGroupSelect(groups);

      let allAccounts = [];
      if (selectedGroup === "all") {
        // Lấy tất cả tài khoản từ tất cả nhóm
        allAccounts = groups.flatMap((group) => group.data || []);
      } else {
        // Lọc các tài khoản theo nhóm đã chọn
        const selectedGroupData = groups.find(
          (group) => group.name_groups === selectedGroup
        );
        if (selectedGroupData) {
          allAccounts = selectedGroupData.data || [];
        }
      }

      // Gọi các hàm render giao diện nếu cần
      renderAccountsTable(allAccounts);
      // updateStats(allAccounts);
    } catch (error) {
      console.error("Error loading groups:", error);
      // initializeEmptyState();
    }
  }
  function updateGroupSelect(groups) {
    const selects = [
      document.getElementById("contentselect"),
      // Add other select elements here if necessary
      // document.getElementById("scanGroupsSelect"),
    ];

    selects.forEach((select) => {
      if (!select) return;

      // Lưu giá trị đang được chọn
      const currentValue = select.value;

      // Xóa các tùy chọn hiện tại
      select.innerHTML = "";

      // Thêm tùy chọn mặc định
      const defaultText =
        select.id === "contentselect"
          ? "Tất cả tài khoản"
          : "Chọn danh mục tài khoản quét";
      select.appendChild(new Option(defaultText, "all"));

      // Thêm các nhóm từ danh sách `groups`
      groups.forEach((group) => {
        if (group && group.name_groups) {
          const option = new Option(group.name_groups, group.name_groups);
          select.appendChild(option);
        }
      });

      // Khôi phục giá trị đã chọn nếu giá trị đó vẫn tồn tại
      const optionExists = Array.from(select.options).some(
        (option) => option.value === currentValue
      );
      if (optionExists) {
        select.value = currentValue;
      } else {
        select.value = "all"; // Mặc định về "all" nếu không tồn tại
      }
    });
  }
  function renderAccountsTable(accounts) {
    let id = 0;
    const resultsTbody = document.getElementById("results-tbody-content");
    resultsTbody.innerHTML = "";

    if (!accounts || accounts.length === 0) {
      resultsTbody.innerHTML = `        
          <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">
              Chưa có tài khoản nào. Vui lòng thêm tài khoản mới.
            </td>
          </tr>
        `;
      return;
    }

    accounts.forEach((account) => {
      id++;
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td><input type="checkbox" class="checkboxcontent" /></td>
          <td>${id}</td>
          <td title="${account.status || ""}" data-full-status="${account.status || ""}" class="content-cell">
              ${account.status && account.status.length > 20
                  ? account.status.slice(0, 50) + "..."
                  : account.status || ""}
          </td>
          <td title="${account.path || ""}" data-full-path="${account.path || ""}" class="content-cell">
              ${account.path && account.path.length > 20
                  ? account.path.slice(0, 50) + "..."
                  : account.path || ""}
          </td>
      `;

      // Add click event to content cells
      tr.querySelectorAll('.content-cell').forEach(cell => {
          cell.style.cursor = 'pointer';
          cell.addEventListener('click', () => {
              const row = cell.closest('tr');
              const status = row.cells[2].getAttribute('data-full-status');
              const path = row.cells[3].getAttribute('data-full-path');
              
              document.getElementById('editStatusContent').value = status || '';
              document.getElementById('editPathContent').value = path || '';
              document.getElementById('editContentModal').style.display = 'flex';
              
              // Store reference to current row for saving
              document.getElementById('editContentModal').dataset.currentRow = row.rowIndex;
          });
      });

      resultsTbody.appendChild(tr);
    });
  }
  function handleSelectAllCheckbox() {
    // Lấy tất cả checkbox trong tbody
    const tableBody = document.querySelector("#results-tbody-content");
    const checkboxes = tableBody.querySelectorAll(".checkboxcontent");

    // Đặt trạng thái checkbox cá nhân theo trạng thái của "Select All"
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  }
  function saveChangesToFile() {
    const rows = document.querySelectorAll('#results-tbody-content tr');
    const contentData = [];
    
    rows.forEach(row => {
        if (row.cells.length >= 4) { // Kiểm tra row có đủ cells
            const status = row.cells[2].getAttribute('data-full-status');
            const path = row.cells[3].getAttribute('data-full-path');
            
            if (status && path) {
                contentData.push({
                    path: path,
                    status: status
                });
            }
        }
    });

    // Get selected group from contentselect
    const selectedGroup = document.getElementById('contentselect').value;
    const contentFilePath = path.join(__dirname, 'data', 'content.json');
    const chosseContentFilePath = path.join(__dirname, 'data', 'chosse_content.json');

    try {
        if (selectedGroup === 'all') {
            // Save to chosse_content.json
            fs.writeFileSync(chosseContentFilePath, JSON.stringify(contentData, null, 2));
        } else {
            // Update content.json
            let existingContent = [];
            if (fs.existsSync(contentFilePath)) {
                const fileData = fs.readFileSync(contentFilePath, 'utf-8');
                existingContent = JSON.parse(fileData);
            }

            // Find and update the specific group
            const groupIndex = existingContent.findIndex(group => group.name_groups === selectedGroup);
            if (groupIndex !== -1) {
                // Update existing group's data
                existingContent[groupIndex].data = contentData;
            }

            // Write back to content.json
            fs.writeFileSync(contentFilePath, JSON.stringify(existingContent, null, 2));
        }
        
        alert('Đã lưu thay đổi thành công!');
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Có lỗi xảy ra khi lưu thay đổi!');
    }
  }

  function updateContentCount() {
    try {
        const filePath = path.join(__dirname, "data", "chosse_content.json");
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, "utf-8");
            const contents = JSON.parse(fileData);
            const contentCount = Array.isArray(contents) ? contents.length : 0;
            
            // Cập nhật số lượng vào element stats
            const statsSpan = document.getElementById('content-stats');
            if (statsSpan) {
                statsSpan.textContent = `Tổng nọi dung chọn đăng: ${contentCount}`;
            }
        }
    } catch (error) {
        console.error("Error updating content count:", error);
    }
  }

  // Thêm sự kiện cho checkbox "Select All"
  selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);

  document
    .getElementById("btn-select-content")
    .addEventListener("click", function (e) {
      document.getElementById("select-content").style.display = "flex";
    });
  document
    .getElementById("close-select-content")
    .addEventListener("click", function (e) {
      document.getElementById("select-content").style.display = "none";
    });
  document
    .getElementById("scanGroupsSelectspamgroups")
    .addEventListener("change", function () {
      const selectedGroup = this.value;
      console.log("Nhóm đã chọn:", selectedGroup);
      loadAccountGroups(selectedGroup); // Gọi lại hàm để tải tài khoản theo nhóm đã chọn
    });
  document
    .getElementById("bnt-add-groups-content")
    .addEventListener("click", function () {
      document.getElementById("save-chosse-content").style.display = "none";
      document.getElementById(
        "save-chosse-content-or-groups-content"
      ).style.display = "flex";
      const resultsTbody = document.getElementById("results-tbody-content");
      while (resultsTbody.firstChild) {
        resultsTbody.removeChild(resultsTbody.firstChild);
      }
    });
  document
    .getElementById("bnt-add-content")
    .addEventListener("click", function () {
      document.getElementById("statusModal").style.display = "flex";
      mediaFileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            if (file.type.startsWith("image/")) {
              previewImage.src = e.target.result;
              previewImage.style.display = "block";
              previewVideo.style.display = "none";
            } else if (file.type.startsWith("video/")) {
              previewVideo.src = e.target.result;
              previewVideo.style.display = "block";
              previewImage.style.display = "none";
            }
            mediaPreview.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    });
  document
    .getElementById("postStatusBtn")
    .addEventListener("click", async function () {
      const statusContent = statusContentInput.value.trim();
      const file = mediaFileInput.files[0];
      // Đường dẫn đến thư mục 'content'
      const contentDir = path.join(__dirname, "content");

      // Đảm bảo thư mục 'content' tồn tại
      if (!fs.existsSync(contentDir)) {
        fs.mkdirSync(contentDir, { recursive: true });
      }
      if (!statusContent || !file) {
        alert("Vui lòng nhập nội dung và chọn ảnh/video!");
        return;
      }

      try {
        // Tạo tên file duy nhất để tránh ghi đè
        const timestamp = Date.now();
        const fileExtension = path.extname(file.name);
        const fileName = `media-${timestamp}${fileExtension}`;
        const filePath = path.join(contentDir, fileName);

        // Đọc file từ input và ghi vào thư mục 'content'
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const arrayBuffer = fileReader.result;
          const buffer = Buffer.from(arrayBuffer);

          // Ghi file vào thư mục 'content'
          fs.writeFileSync(filePath, buffer);

          console.log("Đường dẫn file:", filePath);
          console.log("Nội dung status:", statusContent);
          const row = document.createElement("tr");
          row.innerHTML = `
                    <td><input type="checkbox" class="checkboxcontent" /></td>
                    <td>${""}</td>
                    <td>${statusContent}</td>
                    <td>${filePath}</td>
                `;

          // Thêm dòng mới vào bảng
          resultsTbody.appendChild(row);
          alert("Đăng status thành công!");
          document.getElementById("statusModal").style.display = "none";
        };

        fileReader.onerror = (error) => {
          console.error("Lỗi khi đọc file:", error);
          alert("Có lỗi xảy ra khi đọc file!");
        };

        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Lỗi khi xử lý file:", error);
        alert("Có lỗi xảy ra khi xử lý file!");
      }
    });
  document.getElementById("cancelpostStatusBtn").addEventListener("click", function () {
    document.getElementById("statusModal").style.display = "none";
  });
  document.getElementById('save-chosse-content-or-groups-content').addEventListener('click', function() {
    document.getElementById('groupNameModal').style.display = 'flex';
  });
  document.getElementById('cancelGroupNameBtn').addEventListener('click', function() {
    document.getElementById('groupNameModal').style.display = 'none';
  } );
  document.getElementById('save-chosse-content').addEventListener('click', function() {
    // Get all checked items
    const checkedRows = document.querySelectorAll('#results-tbody-content .checkboxcontent:checked');
    const contentData = [];

    if (checkedRows.length === 0) {
        alert('Vui lòng chọn ít nhất một nội dung!');
        return;
    }

    checkedRows.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const statusContent = row.cells[2].getAttribute('data-full-status');
        const pathContent = row.cells[3].getAttribute('data-full-path');
        
        contentData.push({
            path: pathContent,
            status: statusContent
        });
    });

    // Save to chosse_content.json
    const contentFilePath = path.join(__dirname, 'data', 'chosse_content.json');

    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save content data, overwriting any existing content
        fs.writeFileSync(contentFilePath, JSON.stringify(contentData, null, 2));
        alert('Đã lưu nội dung thành công!');
        document.getElementById("select-content").style.display = "none";
    } catch (error) {
        console.error('Error saving chosse_content.json:', error);
        alert('Có lỗi xảy ra khi lưu nội dung!');
    }
    updateContentCount();
  })
  document.getElementById('saveGroupNameBtn').addEventListener('click', function() {
    const groupName = document.getElementById('groupNameInput').value.trim();
    
    if (!groupName) {
        alert('Vui lòng nhập tên nhóm content!');
        return;
    }

    // Get all checked items
    const checkedRows = document.querySelectorAll('#results-tbody-content .checkboxcontent:checked');
    const contentData = [];

    checkedRows.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const statusContent = row.cells[2].getAttribute('data-full-status');
        const pathContent = row.cells[3].getAttribute('data-full-path');
        
        contentData.push({
            path: pathContent,
            status: statusContent
        });
    });

    // Create content group object
    const contentGroup = {
        name_groups: groupName,
        data: contentData
    };

    // Read existing content or create new array
    const contentFilePath = path.join(__dirname, 'data', 'content.json');
    let existingContent = [];

    try {
        if (fs.existsSync(contentFilePath)) {
            const fileData = fs.readFileSync(contentFilePath, 'utf-8');
            existingContent = JSON.parse(fileData);
        }
    } catch (error) {
        console.error('Error reading content.json:', error);
    }

    // Add new content group
    existingContent.push(contentGroup);

    // Save to file
    try {
        fs.writeFileSync(contentFilePath, JSON.stringify(existingContent, null, 2));
        alert('Đã lưu nhóm content thành công!');
        document.getElementById('groupNameModal').style.display = 'none';
        document.getElementById('groupNameInput').value = '';
    } catch (error) {
        console.error('Error saving content.json:', error);
        alert('Có lỗi xảy ra khi lưu nhóm content!');
    }
  });
  document
    .getElementById("contentselect")
    .addEventListener("change", function () {
      const selectedGroup = this.value;
      console.log("Nhóm đã chọn:", selectedGroup);
      document.getElementById("save-chosse-content").style.display = "flex";
      document.getElementById(
        "save-chosse-content-or-groups-content"
      ).style.display = "none";
      loadAccountGroups(selectedGroup); // Gọi lại hàm để tải tài khoản theo nhóm đã chọn
    });
  // Tải dữ liệu nhóm và cập nhật giao diện ban đầu
  // Add these event listeners in your DOMContentLoaded event
  document.getElementById('cancelEditContentBtn').addEventListener('click', function() {
    document.getElementById('editContentModal').style.display = 'none';
  });

  document.getElementById('saveEditContentBtn').addEventListener('click', function() {
    const modal = document.getElementById('editContentModal');
    const rowIndex = modal.dataset.currentRow;
    const row = document.getElementById('results-tbody-content').rows[rowIndex - 1];
    
    const newStatus = document.getElementById('editStatusContent').value.trim();
    const path = document.getElementById('editPathContent').value;
      
    // Update the row data
    row.cells[2].setAttribute('data-full-status', newStatus);
    row.cells[2].setAttribute('title', newStatus);
    row.cells[2].textContent = newStatus.length > 50 ? newStatus.slice(0, 50) + '...' : newStatus;

    // Close modal
    modal.style.display = 'none';
    
    // Optional: Save changes to file
    saveChangesToFile();
  });
  loadAccountGroups();
  updateContentCount();
});
