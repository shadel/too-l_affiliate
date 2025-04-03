document.addEventListener("DOMContentLoaded", function () {
  const scanGroupsBtn = document.getElementById("scanGroupsBtn");
  const scanGroupsSelect = document.getElementById("scanGroupsSelect");
  const textInput = document.getElementById("keywords-input");
  const numberInputs = document.querySelectorAll('input[type="number"]');
  const resultsTbody = document.getElementById("results-tbody");
  // Chọn checkbox "Select All"
  const selectAllCheckbox = document.getElementById("selectAllCheckboxscan");

  // Hàm xử lý "Select All"
  function handleSelectAllCheckbox() {
    // Lấy tất cả checkbox trong tbody
    const tableBody = document.querySelector("#results-tbody");
    const checkboxes = tableBody.querySelectorAll(".checkboxscan");

    // Đặt trạng thái checkbox cá nhân theo trạng thái của "Select All"
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  }

  // Thêm sự kiện cho checkbox "Select All"
  selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);

  // Hàm xử lý thay đổi checkbox cá nhân
  function handleIndividualCheckbox() {
    const tableBody = document.querySelector("#results-tbody");
    const totalCheckboxes = tableBody.querySelectorAll(".checkboxscan").length;
    const checkedCheckboxes = tableBody.querySelectorAll(
      ".checkboxscan:checked"
    ).length;

    // Cập nhật trạng thái "Select All" theo số lượng checkbox đã được chọn
    selectAllCheckbox.checked = totalCheckboxes === checkedCheckboxes;

    // Xử lý trạng thái indeterminate khi một số checkbox được chọn nhưng không phải tất cả
    selectAllCheckbox.indeterminate =
      checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
  }

  // Hàm khởi tạo lại các sự kiện checkbox
  function initializeCheckboxes() {
    const tableBody = document.querySelector("#results-tbody");
    const checkboxes = tableBody.querySelectorAll(".checkboxscan");

    checkboxes.forEach((checkbox) => {
      checkbox.removeEventListener("change", handleIndividualCheckbox); // Xóa sự kiện trước khi thêm lại
      checkbox.addEventListener("change", handleIndividualCheckbox);
    });
  }

  // Khởi tạo sự kiện cho các checkbox khi tài liệu được tải xong
  document.addEventListener("DOMContentLoaded", () => {
    // Khởi tạo checkbox ban đầu
    initializeCheckboxes();

    // Quan sát sự thay đổi trong tbody
    const observer = new MutationObserver(() => {
      initializeCheckboxes(); // Khởi tạo lại checkbox mỗi khi có thay đổi
    });

    // Quan sát các thay đổi trong tbody
    observer.observe(document.querySelector("#results-tbody"), {
      childList: true, // Theo dõi việc thêm hoặc xóa các dòng
    });
  });

  // Rest of your code...

  if (!scanGroupsBtn) {
    console.error('Nút "Scan Groups" không tìm thấy!');
  }
  if (!scanGroupsSelect) {
    console.error('Dropdown "scanGroupsSelect" không tìm thấy!');
  }
  if (numberInputs.length < 2) {
    console.error("Không đủ các input số lượng!");
  }
  if (!resultsTbody) {
    console.error("Không tìm thấy phần tử results-tbody!");
    return;
  }

  scanGroupsBtn.addEventListener("click", function () {
    const selectedGroup = scanGroupsSelect ? scanGroupsSelect.value : null;
    const keyword = textInput ? textInput.value : null;
    const maxGroups = numberInputs[0] ? numberInputs[0].value : null;
    const concurrentRuns = numberInputs[1] ? numberInputs[1].value : null;

    // Kiểm tra nếu bất kỳ giá trị nào bị bỏ trống
    if (!selectedGroup || !keyword || !maxGroups || !concurrentRuns) {
      const missingFields = [];
      if (!selectedGroup) missingFields.push("selectedGroup");
      if (!keyword) missingFields.push("keyword");
      if (!maxGroups) missingFields.push("maxGroups");
      if (!concurrentRuns) missingFields.push("concurrentRuns");

      alert(`Vui lòng nhập đầy đủ thông tin: ${missingFields.join(", ")}`);
      return; // Dừng thực thi nếu có giá trị bị bỏ trống
    }

    const data = {
      selectedGroup: selectedGroup,
      keyword: keyword,
      maxGroups: maxGroups,
      concurrentRuns: concurrentRuns,
    };

    // Ghi dữ liệu vào file JSON
    fs.writeFile(
      "data/scangroups.json",
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

    const { exec } = require("child_process");
    const pythonProcess = exec("python ./src_python/scangroups.py");

    // Lắng nghe output từ Python và truyền dữ liệu tới frontend
    pythonProcess.stdout.on("data", (data) => {
      try {
        console.log(data);
        const parsedData = JSON.parse(data); // Parse dữ liệu JSON từ Python
        // Kiểm tra type và status
        if (parsedData.type === "error") {
          // Tạo thông báo lỗi
          const errorMessage = `Error: ${parsedData.status}`;
          alert(errorMessage);
        } else if (parsedData.type === "success") {
          const SuccessMessage = `success: ${parsedData.status}`;
          alert(SuccessMessage);
        } else {
          // Sử dụng innerHTML để thêm dữ liệu nhanh hơn
          const row = document.createElement("tr");
          row.innerHTML = `
                    <td><input type="checkbox" class="checkboxscan" /></td>
                    <td>${parsedData.id || ""}</td>
                    <td>${parsedData.uid || ""}</td>
                    <td>${parsedData.keyword || ""}</td>
                    <td>${parsedData.groupName || ""}</td>
                    <td>${parsedData.groupType || ""}</td>
                    <td>${parsedData.memberCount || ""}</td>
                    <td>${parsedData.PostsperDay || ""}</td>
                    <td>${parsedData.url || ""}</td>
                `;

          // Thêm dòng mới vào bảng
          resultsTbody.appendChild(row);
          // Tạo các cột dữ liệu}
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
  });
  // Thêm sự kiện cho nút clearscanGroupsBtn để xóa dữ liệu trong treeview
  document
    .getElementById("clearscanGroupsBtn")
    .addEventListener("click", function () {
      const resultsTbody = document.getElementById("results-tbody");
      while (resultsTbody.firstChild) {
        resultsTbody.removeChild(resultsTbody.firstChild);
      }
      console.log("Đã xóa sạch dữ liệu trong treeview.");
    });

  document
    .getElementById("export_scangroups")
    .addEventListener("click", function () {
      // Lấy giá trị của <select>
      // Lấy tất cả checkbox
      const checkboxes = document.querySelectorAll(".checkboxscan");
      const selectedscan = [];
      let allAccountsSelected = true;

      checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          // Lấy dòng chứa checkbox
          const row = checkbox.closest("tr");

          // Kiểm tra nếu có dòng và ít nhất 2 cột trong dòng
          if (row && row.cells && row.cells.length > 1) {
            // Kiểm tra nếu dòng không phải là dòng tiêu đề (dòng tiêu đề thường có giá trị cố định)
            const uid = row.cells[2].textContent;
            if (uid === "UID") {
              return; // Bỏ qua dòng tiêu đề
            }

            // Tiếp tục lấy dữ liệu từ các cột
            const keyword = row.cells[3].textContent; // Lấy trạng thái từ cột thứ 3
            const name_groups = row.cells[4].textContent; // Lấy password từ cột thứ 4
            const type_groups = row.cells[5].textContent; // Lấy 2FA từ cột thứ 5
            const member = row.cells[6].textContent; // Lấy cookie từ cột thứ 6
            const status = row.cells[7].textContent;
            const url = row.cells[8].textContent;

            // Thêm dữ liệu vào mảng selectedAccounts
            selectedscan.push({
              uid: uid,
              keyword: keyword,
              name_groups: name_groups,
              type_groups: type_groups,
              member: member,
              status: status,
              url: url,
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
              type_export: "export_groups",
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
});
