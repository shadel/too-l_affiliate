const { console } = require("inspector");

document.addEventListener("DOMContentLoaded", function () {
  const { exec } = require("child_process");
  const scanPagesBtn = document.getElementById("scanPagesBtn");
  const scanGroupsSelectscanPage = document.getElementById(
    "scanGroupsSelectscanPage"
  );
  const thread_scanPage = document.querySelectorAll(
    'input[type="thread_scanPage"]'
  );
  const resultsTbody = document.querySelector("#results-tbody_Page");
  // Chọn checkbox "Select All"
  const selectAllCheckbox = document.getElementById(
    "selectAllCheckboxscanpage"
  );

  // Add stats variables to track counts
  let totalCount = 0;
  let liveCount = 0;
  let dieCount = 0;

  const modalHTML = `
  <div class="modal-overlay" id="addPagemodal" style="display: none;">
      <div class="modal">
          <div class="modal-header">
              <h2 class="modal-title">Nhập Key kích hoạt</h2>
          </div>
          <div class="modal-body">
              <div class="input-group">
                  <input type="text" id="namegroupssavepage" class="text-input" placeholder="Nhập key của bạn vào đây..." />
                  <div id="keyErrorMessage" style="color: #f85149; margin-top: 8px; display: none;">
                      Vui lòng nhập tên nhóm
                  </div>
              </div>
          </div>
          <div class="modal-footer">
              <button class="btn-primary" id="closePageBtn">Đóng</button>
              <button class="btn-primary" id="validatePageBtn">Xác nhận</button>
          </div>
      </div>
  </div>
  `;

  // Hàm xử lý "Select All"
  function handleSelectAllCheckbox() {
    // Lấy tất cả checkbox trong tbody
    const tableBody = document.querySelector("#results-tbody_Page");
    const checkboxes = tableBody.querySelectorAll(".checkboxscanpage");

    // Đặt trạng thái checkbox cá nhân theo trạng thái của "Select All"
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  }

  // Thêm sự kiện cho checkbox "Select All"
  selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);

  // Hàm xử lý thay đổi checkbox cá nhân
  function handleIndividualCheckbox() {
    const tableBody = document.querySelector("#results-tbody_Page");
    const totalCheckboxes =
      tableBody.querySelectorAll(".checkboxscanpage").length;
    const checkedCheckboxes = tableBody.querySelectorAll(
      ".checkboxscanpage:checked"
    ).length;

    // Cập nhật trạng thái "Select All" theo số lượng checkbox đã được chọn
    selectAllCheckbox.checked = totalCheckboxes === checkedCheckboxes;

    // Xử lý trạng thái indeterminate khi một số checkbox được chọn nhưng không phải tất cả
    selectAllCheckbox.indeterminate =
      checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
  }
  function updateStats(forceTotal = null) {
    if (forceTotal !== null) {
      totalCount = forceTotal;
      liveCount = forceTotal;
      dieCount = 0;
    }

    document.querySelector(".stats_page").innerHTML = `
        <div>Tổng số: <span>${totalCount}</span></div>
        <div>Live: <span>${liveCount}</span></div>
        <div>Die: <span class="die">${dieCount}</span></div>
    `;
  }
  async function loadAccountGroups(selectedGroup = "all") {
    const filePath = path.join(__dirname, "data", "sweep_clone.json");

    try {
      if (!fs.existsSync(filePath)) {
        initializeEmptyState();
      } else {
        const fileData = fs.readFileSync(filePath, "utf-8");
        groups = JSON.parse(fileData);
        if (!Array.isArray(groups)) {
          initializeEmptyState();
        }
      }

      let allAccounts = [];
      if (selectedGroup === "all") {
        allAccounts = groups.flatMap((group) => group.data);
      } else {
        const selectedGroupData = groups.find(
          (group) => group.name_groups === selectedGroup
        );
        if (selectedGroupData) {
          allAccounts = selectedGroupData.data;
        }
      }

      // Initialize stats with total accounts
      totalCount = allAccounts.length;
      liveCount = allAccounts.length;
      dieCount = 0;
      updateStats();
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  }
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  document
    .getElementById("closePageBtn")
    .addEventListener("click", function () {
      document.getElementById("addPagemodal").style.display = "none";
    });
  document
    .getElementById("validatePageBtn")
    .addEventListener("click", function () {
      const filePath = "data/sweep_page.json";

      // Đọc dữ liệu cũ từ file JSON
      let existingData = [];
      if (fs.existsSync(filePath)) {
        try {
          const rawData = fs.readFileSync(filePath, "utf-8");
          existingData = JSON.parse(rawData);
        } catch (error) {
          console.error("Lỗi đọc file JSON:", error);
        }
      }
      const namegroupsPage =
        document.getElementById("namegroupssavepage").value;
      document.getElementById("addPagemodal").style.display = "none";
      const checkboxes = document.querySelectorAll(".checkboxscanpage");
      const selectedscan = [];
      if (!namegroupsPage) {
        const missingFields = [];
        if (!namegroupsPage) missingFields.push("namegroupsPage");
        alert(`Vui lòng nhập đầy đủ thông tin: ${missingFields.join(", ")}`);
        return; // Dừng thực thi nếu có giá trị bị bỏ trống
      }
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
        const newEntry = {
          name_groups: namegroupsPage,
          data: selectedscan,
        };

        // Cập nhật dữ liệu mới vào dữ liệu cũ
        existingData.push(newEntry);

        // Ghi dữ liệu đã cập nhật lại vào file JSON
        try {
          fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
          console.log("Dữ liệu đã được lưu thành công vào file JSON.");
        } catch (error) {
          console.error("Lỗi ghi file JSON:", error);
        }
      } else {
        console.log("Không có checkbox nào được chọn.");
      }
    });
  document
    .getElementById("button_addpages")
    .addEventListener("click", function () {
      document.getElementById("addPagemodal").style.display = "flex";
    });
  document
    .getElementById("clearscanGroupsBtn_page")
    .addEventListener("click", function () {
      const resultsTbody = document.getElementById("results-tbody_Page");
      while (resultsTbody.firstChild) {
        resultsTbody.removeChild(resultsTbody.firstChild);
      }
      console.log("Đã xóa sạch dữ liệu trong treeview.");
    });
  document
    .getElementById("export_scanpage")
    .addEventListener("click", function () {
      // Lấy giá trị của <select>
      // Lấy tất cả checkbox
      const checkboxes = document.querySelectorAll(".checkboxscanpage");
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
  scanPagesBtn.addEventListener("click", function () {
    const thread_scanpages = thread_scanPage[0]
      ? thread_scanPage[0].value
      : null;

    const selectedGroup = scanGroupsSelectscanPage
      ? scanGroupsSelectscanPage.value
      : null;
    // Kiểm tra nếu bất kỳ giá trị nào bị bỏ trống
    if (!thread_scanpages) {
      const missingFields = [];
      if (!thread_scanpages) missingFields.push("thread_scanpages");
      alert(`Vui lòng nhập đầy đủ thông tin: ${missingFields.join(", ")}`);
      return; // Dừng thực thi nếu có giá trị bị bỏ trống
    }
    if (thread_scanpages == 0) {
      alert("Số lượng trang phải lớn hơn 0");
      return;
    }
    if (selectedGroup == "all") {
      alert("Vui lòng chọn nhóm tài khoản để tìm kiếm");
      return; // Dừng thực thi nếu nhóm tài khoản không được chọn
    }
    const data = {
      thread_scanpages: parseInt(thread_scanpages),
      selectedGroup: selectedGroup,
    };
    fs.writeFile(
      "data/scanpages.json",
      JSON.stringify(data, null, 2),
      { encoding: "utf8" },
      (err) => {
        if (err) {
          console.error("Lỗi khi ghi dữ liệu vào file:", err);
        } else {
          console.log("Dữ liệu đã được lưu vào file data/scangroups.json");
        }
      }
    );
    const pythonProcess = exec("python ./src_python/scan_pages.py");
    pythonProcess.stdout.on("data", (data) => {
      try {
        console.log(data);
        const parsedData = JSON.parse(data);

        if (parsedData.type === "error") {
          const row = document.createElement("tr");
          row.innerHTML = `
              <td><input type="checkbox" class="checkboxscanpage" /></td>
              <td>${parsedData.id || ""}</td>
              <td>${parsedData.name_account || ""}</td>
              <td>${parsedData.uid || ""}</td>
              <td>${parsedData.cookie_account || ""}</td>
              <td>${parsedData.name_page || ""}</td>
              <td>${parsedData.uid_page || ""}</td>
              <td>${parsedData.cookie_page || ""}</td>
              <td>${parsedData.url_page || ""}</td>
              <td>${parsedData.status || ""}</td>
          `;
          resultsTbody.appendChild(row);

          // Update stats when account is die
          liveCount--;
          dieCount++;
          updateStats();
        } else if (parsedData.type === "success") {
          const row = document.createElement("tr");
          row.innerHTML = `
    <td><input type="checkbox" class="checkboxscanpage" /></td>
    <td>${parsedData.id || ""}</td>
    <td>${parsedData.name_account || ""}</td>
    <td>${parsedData.uid || ""}</td>
    <td title="${parsedData.cookie_account || ""}">
        ${
          parsedData.cookie_account && parsedData.cookie_account.length > 20
            ? parsedData.cookie_account.slice(0, 20) + "..."
            : parsedData.cookie_account || ""
        }
    </td>
    <td>${parsedData.name_page || ""}</td>
    <td>${parsedData.uid_page || ""}</td>
    <td title="${parsedData.cookie_page || ""}">
        ${
          parsedData.cookie_page && parsedData.cookie_page.length > 20
            ? parsedData.cookie_page.slice(0, 20) + "..."
            : parsedData.cookie_page || ""
        }
    </td>
    <td>${parsedData.url_page || ""}</td>
    <td>live</td>
`;

          resultsTbody.appendChild(row);
        }
      } catch (e) {
        console.error("Lỗi khi parse dữ liệu từ Python:", e);
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });
    pythonProcess.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
    });

    console.log(data);
  });
  document
    .getElementById("scanGroupsSelectscanPage")
    .addEventListener("change", function () {
      const selectedGroup = this.value;
      console.log(selectedGroup);
      loadAccountGroups(selectedGroup); // Gọi lại hàm với nhóm tài khoản đã chọn
    });
});
