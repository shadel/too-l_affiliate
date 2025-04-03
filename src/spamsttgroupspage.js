document.addEventListener('DOMContentLoaded', function() {
    const modalHTML = `
    <div class="modal-overlay" id="groupUIDModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: none; justify-content: center; align-items: center; z-index: 1000;">
        <div class="modal" style="position: relative; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #0d1117; border-radius: 8px; border: 1px solid #30363d; width: 90%; max-width: 600px;">
            <div class="modal-header">
                <h2 class="modal-title">Nhập UID Groups</h2>
                <button class="close-button" id="closeGroupUIDModal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label class="input-label">Danh sách UID Groups (Mỗi dòng 1 UID)</label>
                    <textarea 
                        id="groupUIDInput"
                        class="text-area"
                        placeholder="Nhập UID groups, mỗi dòng một UID..."></textarea>
                    <div class="format-example">
                        Ví dụ:<br>
                        123456789<br>
                        987654321<br>
                        112233445
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelGroupUID">Hủy</button>
                <button class="btn-primary" id="saveGroupUID">Lưu</button>
            </div>
        </div>
    </div>
    `;

    // Insert modal HTML into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
  
    const selectAllCheckbox = document.getElementById(
        "Checkbox-spam-stt-groups"
      );
    const groupUIDLink = document.querySelector('.link');
    const groupUIDModal = document.getElementById('groupUIDModal');
    const closeGroupUIDModal = document.getElementById('closeGroupUIDModal');
    const cancelGroupUID = document.getElementById('cancelGroupUID');
    const saveGroupUID = document.getElementById('saveGroupUID');
    const groupUIDInput = document.getElementById('groupUIDInput');
    async function loadAccountGroups(selectedGroup = "all") {
        const filePath = path.join(__dirname, "data", "sweep_page.json");
    
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
    function closeModal() {
        groupUIDModal.style.display = 'none';
    }
    function updateGroupSelect(groups) {
        const selects = [
          document.getElementById("scanGroupsSelectspamgroups"),
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
            select.id === "scanGroupsSelectspamgroups"
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
        const resultsTbody = document.getElementById("results-tbody-spam-groups");
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
                <td><input type="checkbox" class="checkboxspamgroups" /></td>
                <td>${id}</td>
                <td title="${account.name_page || ""}">
                ${
                account.name_page && account.name_page.length > 20
                    ? account.name_page.slice(0, 20) + "..."
                    : account.name_page || ""
                }
                </td>
                <td>${account.uid_page || ""}</td>
                `;
    
          resultsTbody.appendChild(tr);
        });
      }
    function handleSelectAllCheckbox() {
        // Lấy tất cả checkbox trong tbody
        const tableBody = document.querySelector("#results-tbody-spam-groups");
        const checkboxes = tableBody.querySelectorAll(".checkboxspamgroups");
    
        // Đặt trạng thái checkbox cá nhân theo trạng thái của "Select All"
        checkboxes.forEach((checkbox) => {
          checkbox.checked = selectAllCheckbox.checked;
        });
      }

    
    // Thêm sự kiện cho checkbox "Select All"
    selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);
    closeGroupUIDModal.addEventListener('click', closeModal);
    cancelGroupUID.addEventListener('click', closeModal);
    groupUIDLink.addEventListener('click', () => {
      // Show the modal by changing display style
      groupUIDModal.style.display = 'block';

      // Load existing UIDs if any
      try {
          const filePath = path.join(__dirname, "data", "uid_groups_spam.json");
          if (fs.existsSync(filePath)) {
              const fileData = fs.readFileSync(filePath, "utf-8");
              const uids = JSON.parse(fileData);
              groupUIDInput.value = uids.join('\n');
          }
      } catch (error) {
          console.error("Error loading UIDs:", error);
      }
    });
    // Save UIDs
    saveGroupUID.addEventListener('click', () => {
        try {
            const uids = groupUIDInput.value
                .split('\n')
                .map(uid => uid.trim())
                .filter(uid => uid); // Remove empty lines

            const filePath = path.join(__dirname, "data", "uid_groups_spam.json");
            
            // Create data directory if it doesn't exist
            const dataDir = path.join(__dirname, "data");
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Save UIDs to file
            fs.writeFileSync(filePath, JSON.stringify(uids, null, 2));
            
            // Show success message
            alert("Đã lưu danh sách UID thành công!");
            closeModal();
        } catch (error) {
            console.error("Error saving UIDs:", error);
            alert("Có lỗi xảy ra khi lưu danh sách UID!");
        }
    });

    // Close modal when clicking outside
    groupUIDModal.addEventListener('click', (e) => {
        if (e.target === groupUIDModal) {
            closeModal();
        }
    });
    document
      .getElementById("scanGroupsSelectspamgroups")
      .addEventListener("change", function () {
        const selectedGroup = this.value;
        console.log("Nhóm đã chọn:", selectedGroup);
        document.getElementById("save-chosse-content").style.display = "flex";
        document.getElementById(
          "save-chosse-content-or-groups-content"
        ).style.display = "none";
        loadAccountGroups(selectedGroup); // Gọi lại hàm để tải tài khoản theo nhóm đã chọn
      });
    loadAccountGroups();
    
});