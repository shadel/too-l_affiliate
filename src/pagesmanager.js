document.addEventListener("DOMContentLoaded", () => {
  const selectAllCheckbox = document.getElementById(
    "selectAllCheckboxmanagerpage"
  );
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
  function renderAccountsTable(accounts) {
    let id = 0;
    const resultsTbody = document.getElementById("results-tbody-manager-pages");
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
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" class="checkboxmanagerpage" /></td>
        <td>${id++}</td>
        <td>${account.name_account || ""}</td>
        <td>${account.uid_account || ""}</td>
        <td title="${account.cookie_account || ""}">${account.cookie_account?.slice(0,20) || ""}...</td>
        <td>${account.name_page || ""}</td>
        <td>${account.uid_page || ""}</td>
        <td title="${account.cookie_page || ""}">${account.cookie_page?.slice(0,20) || ""}...</td>
        <td>${account.url_page || ""}</td>
        <td class="proxy-cell" title="${account.proxy || ""}">${account.proxy || "No proxy"}</td>
        <td><span class="${account.status.toLowerCase() === "live" ? "status-live" : ""}">${account.status}</span></td>
      `;
      
      tr.addEventListener('contextmenu', (e) => {
        if(tr.querySelector('.checkboxmanagerpage').checked) {
          const checkedRows = Array.from(document.querySelectorAll('tr')).filter(row => 
            row.querySelector('.checkboxmanagerpage')?.checked
          );
          showContextMenu(e, checkedRows);
        } else {
          showContextMenu(e, [tr]);
        }
      });
      
      resultsTbody.appendChild(tr);
    });
  }

  function updateGroupSelect(groups) {
    const selects = [
      document.getElementById("managePagesSelect"),
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
        select.id === "managePagesSelect"
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
  function handleSelectAllCheckbox() {
    // Lấy tất cả checkbox trong tbody
    const tableBody = document.querySelector("#results-tbody-manager-pages");
    const checkboxes = tableBody.querySelectorAll(".checkboxmanagerpage");

    // Đặt trạng thái checkbox cá nhân theo trạng thái của "Select All"
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  }

    // Thêm hàm hiển thị context menu
  function showContextMenu(e, rows) {
    e.preventDefault();
    selectedRows = rows;
    
    const contextMenu = document.getElementById('pageContextMenu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
  }

  // Thêm hàm xử lý proxy
  function handleProxy() {
    const proxyModal = document.getElementById('proxyModal');
    const proxyInput = document.getElementById('proxyInput');
    
    // Clear previous input
    proxyInput.value = '';
    
    // Show modal
    proxyModal.classList.add('show');
    
    // Handle save button click
    document.getElementById('saveProxy').onclick = async () => {
      try {
        // Get proxy input and clean it
        const proxyText = proxyInput.value.trim();
        
        // Validate input
        if (!proxyText) {
          alert('Vui lòng nhập proxy!');
          return;
        }
        
        // Split and clean proxies
        const proxies = proxyText.split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 0);
        
        if (proxies.length === 0) {
          alert('Không tìm thấy proxy hợp lệ!');
          return;
        }

        // Validate proxy format
        const invalidProxies = proxies.filter(p => {
          const parts = p.split(':');
          return parts.length < 2 || parts.length > 4;
        });

        if (invalidProxies.length > 0) {
          alert('Một số proxy không đúng định dạng! Vui lòng kiểm tra lại.');
          return;
        }

        // Read JSON file
        const filePath = path.join(__dirname, "data", "sweep_page.json");
        if (!fs.existsSync(filePath)) {
          throw new Error('File sweep_page.json không tồn tại!');
        }

        const fileData = fs.readFileSync(filePath, 'utf8');
        let data = JSON.parse(fileData);

        if (!Array.isArray(data)) {
          throw new Error('Dữ liệu không đúng định dạng!');
        }

        // Update proxies for selected rows
        if (!selectedRows || selectedRows.length === 0) {
          alert('Vui lòng chọn ít nhất một tài khoản để thêm proxy!');
          return;
        }

        let updatedCount = 0;

        // Map through data and update proxies
        data = data.map(group => {
          if (!group.data) return group;

          group.data = group.data.map(acc => {
            const matchingRow = selectedRows.find(row => {
              const uid_page = row.cells[6]?.textContent?.trim();
              return uid_page === acc.uid_page;
            });

            if (matchingRow) {
              acc.proxy = proxies[updatedCount % proxies.length];
              updatedCount++;
              console.log(`Updated proxy for ${acc.uid_page}: ${acc.proxy}`);
            }
            return acc;
          });

          return group;
        });

        if (updatedCount === 0) {
          alert('Không tìm thấy tài khoản nào để cập nhật proxy!');
          return;
        }

        // Save changes
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        // Refresh UI
        await loadAccountGroups(document.getElementById('managePagesSelect').value);
        
        // Clear and close modal
        proxyModal.classList.remove('show');
        proxyInput.value = '';
        
        alert(`Đã cập nhật proxy cho ${updatedCount} tài khoản!`);

      } catch (error) {
        console.error('Error handling proxy:', error);
        alert(`Lỗi: ${error.message || 'Có lỗi xảy ra khi thêm proxy!'}`);
      }
    };
  }

  // Thêm sự kiện cho checkbox "Select All"
  selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);

  document
    .getElementById("deletedataPagesBtn")
    .addEventListener("click", function () {
      // Lấy giá trị của <select>
      const selectedAccount =
        document.getElementById("managePagesSelect").value;

      // Lấy tất cả checkbox
      const checkboxes = document.querySelectorAll(".checkboxmanagerpage");
      const selectedAccounts = [];
      let allAccountsSelected = true;

      checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          // Lấy dòng chứa checkbox
          const row = checkbox.closest("tr");

          // Kiểm tra nếu có dòng và ít nhất 2 cột trong dòng
          if (row && row.cells && row.cells.length > 1) {
            // Kiểm tra nếu dòng không phải là dòng tiêu đề (dòng tiêu đề thường có giá trị cố định)
            const uid = row.cells[1].textContent;
            if (uid === "UID") {
              return; // Bỏ qua dòng tiêu đề
            }
            const name_account = row.cells[2].textContent;
            if (name_account === "Tên account") {
              return; // Bỏ qua dòng tiêu đề
            }
            // Tiếp tục lấy dữ liệu từ các cột
            const uid_account = row.cells[3].textContent.trim();
            const cookie_account =
              row.cells[4].getAttribute("title") ||
              row.cells[4].textContent.trim();
            const name_page = row.cells[5].textContent.trim();
            const uid_page = row.cells[6].textContent.trim();
            const cookie_page =
              row.cells[7].getAttribute("title") ||
              row.cells[7].textContent.trim();
            const url_page = row.cells[8].textContent.trim();
            const Status = row.cells[9].textContent.trim();

            // Thêm dữ liệu vào mảng selectedAccounts
            selectedAccounts.push({
              name_account: name_account,
              uid_account: uid_account,
              cookie_account: cookie_account,
              name_page: name_page,
              uid_page: uid_page,
              cookie_page: cookie_page,
              url_page: url_page,
              status: Status,
            });
          } else {
            console.warn("Dòng không hợp lệ hoặc không đủ cột.");
          }
        } else {
          allAccountsSelected = false; // Có ít nhất một checkbox không được chọn
        }
      });

      if (selectedAccounts.length === 0) {
        alert("Vui lòng chọn ít nhất một tài khoản để xóa.");
        return;
      }

      let confirmationMessage = `Bạn có chắc chắn muốn xóa các tài khoản từ danh mục ${selectedAccount}?`;

      // Kiểm tra nếu tất cả tài khoản trong nhóm được chọn
      if (allAccountsSelected && selectedAccount !== "all") {
        confirmationMessage += `\nLưu ý: Việc xóa tất cả tài khoản sẽ xóa luôn nhóm "${selectedAccount}" khỏi danh sách.`;
      }

      const confirmation = confirm(confirmationMessage);

      if (confirmation) {
        console.log("Đang xóa các tài khoản:", selectedAccounts);

        selectedAccounts.forEach(() => {
          const rows = document.querySelectorAll("tbody tr");
          rows.forEach((row) => {
            // Kiểm tra nếu dòng có checkbox đã được chọn
            const checkbox = row.querySelector(".checkboxmanagerpage");
            if (checkbox && checkbox.checked) {
              row.remove(); // Xóa dòng khỏi bảng
            }
          });
        });

        // Nếu tất cả tài khoản được chọn, xóa nhóm khỏi danh sách
        if (allAccountsSelected && selectedAccount !== "all") {
          const selectElement = document.getElementById("manageAccountsSelect");
          const optionToRemove = Array.from(selectElement.options).find(
            (option) => option.value === selectedAccount
          );
          if (optionToRemove) {
            optionToRemove.remove(); // Xóa nhóm khỏi danh sách
            console.log(`Nhóm "${selectedAccount}" đã bị xóa.`);
          }
        }

        // Sau khi xóa, lưu thông tin vào file JSON
        const fs = require("fs");

        const filePath = path.join(__dirname, "data", "data_delete.json");

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(
          filePath,
          JSON.stringify(
            {
              selectedAccount,
              type_delete: "deletepage",
              accounts: selectedAccounts,
            },
            null,
            2
          ),
          "utf-8"
        );
        console.log("Dữ liệu đã được lưu vào data_delete.json.");

        const scriptPath = path.join(
          __dirname,
          "src_python",
          "delete_groups_data.py"
        );

        exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
          }
          alert(`Dữ liệu đã được xóa thành công`);
        });
      }
    });

  // Thêm sự kiện thay đổi giá trị trên select element
  document
    .getElementById("exportdatapagesBtn")
    .addEventListener("click", function () {
      // Lấy giá trị của <select>
      // Lấy tất cả checkbox
      const checkboxes = document.querySelectorAll(".checkboxmanagerpage");
      const selectedscan = [];
      let allAccountsSelected = true;

      checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          // Lấy dòng chứa checkbox
          const row = checkbox.closest("tr");

          // Kiểm tra nếu có dòng và ít nhất 2 cột trong dòng
          if (row && row.cells && row.cells.length > 1) {
            // Kiểm tra nếu dòng không phải là dòng tiêu đề (dòng tiêu đề thường có giá trị cố định)
            const name_account = row.cells[2].textContent;
            if (name_account === "Tên account") {
              return; // Bỏ qua dòng tiêu đề
            }
            // Tiếp tục lấy dữ liệu từ các cột
            const uid_account = row.cells[3].textContent.trim();
            const cookie_account =
              row.cells[4].getAttribute("title") ||
              row.cells[4].textContent.trim();
            const name_page = row.cells[5].textContent.trim();
            const uid_page = row.cells[6].textContent.trim();
            const cookie_page =
              row.cells[7].getAttribute("title") ||
              row.cells[7].textContent.trim();
            const url_page = row.cells[8].textContent.trim();
            const Status = row.cells[9].textContent.trim();

            // Thêm dữ liệu vào mảng selectedAccounts
            selectedscan.push({
              name_account: name_account,
              uid_account: uid_account,
              cookie_account: cookie_account,
              name_page: name_page,
              uid_page: uid_page,
              cookie_page: cookie_page,
              url_page: url_page,
              status: Status,
            });
            console.log(selectedscan);
          } else {
            console.warn("Dòng không hợp lệ hoặc không đủ cột.");
          }
        } else {
          allAccountsSelected = false; // Có ít nhất một checkbox không được chọn
        }
      });
      if (selectedscan.length > 0) {
        // Lưu dữ liệu vào file JSON
        const fs = require("fs");
        fs.writeFileSync(
          "data/data_export.json",
          JSON.stringify(
            {
              type_export: "export_pages",
              accounts: selectedscan,
            },
            null,
            2
          )
        );
        console.log("Dữ liệu đã được lưu vào data_export.json.");
        exec("python ./src_python/process_data.py", (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
          }
          alert(`Dữ liệu đã được xuất thành công vào file  ${stdout}`);
        });
      } else {
        console.log("Không có checkbox nào được chọn.");
      }
    });
  document
    .getElementById("managePagesSelect")
    .addEventListener("change", function () {
      const selectedGroup = this.value;
      console.log("Nhóm đã chọn:", selectedGroup);
      loadAccountGroups(selectedGroup); // Gọi lại hàm để tải tài khoản theo nhóm đã chọn
    });

  // Đóng context menu khi click ra ngoài
  document.addEventListener('click', () => {
    document.getElementById('pageContextMenu').style.display = 'none';
  });
  
  // Xử lý menu items
  document.getElementById('addProxy').onclick = handleProxy;
  
  document.getElementById('loginPage').onclick = () => {
    // Xử lý đăng nhập tại đây
    alert('Tính năng đăng nhập đang được phát triển');
  };
  
  // Đóng modal proxy
  document.getElementById('closeProxyModal').onclick = () => {
    document.getElementById('proxyModal').classList.remove('show');
  };
  
  document.getElementById('cancelProxy').onclick = () => {
    document.getElementById('proxyModal').classList.remove('show');
  };

  // Tải dữ liệu nhóm và cập nhật giao diện ban đầu
  loadAccountGroups();
});
