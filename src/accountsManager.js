const fs = require("fs");
const path = require("path"); // Nhập khẩu module 'path'
let currentSelectedGroup = "all";
const { exec } = require("child_process");

async function loadAccountGroups(selectedGroup = null) {
  try {
    const filePath = path.join(__dirname, "data", "sweep_clone.json");

    // Nếu có selectedGroup mới được truyền vào, cập nhật currentSelectedGroup
    if (selectedGroup !== null) {
      currentSelectedGroup = selectedGroup;
    }

    if (!fs.existsSync(filePath)) {
      initializeEmptyState();
    } else {
      const fileData = fs.readFileSync(filePath, "utf-8");
      groups = JSON.parse(fileData);
      if (!Array.isArray(groups)) {
        initializeEmptyState();
      }
    }

    // Cập nhật select với việc giữ nguyên giá trị đã chọn
    updateGroupSelect(groups);

    // Đặt lại giá trị cho select
    const manageAccountsSelect = document.getElementById(
      "manageAccountsSelect"
    );
    if (manageAccountsSelect) {
      manageAccountsSelect.value = currentSelectedGroup;
    }

    let allAccounts = [];
    if (currentSelectedGroup === "all") {
      allAccounts = groups.flatMap((group) => group.data);
    } else {
      const selectedGroupData = groups.find(
        (group) => group.name_groups === currentSelectedGroup
      );
      if (selectedGroupData) {
        allAccounts = selectedGroupData.data;
      }
    }

    renderAccountsTable(allAccounts);
    updateStats(allAccounts);
  } catch (error) {
    console.error("Error loading groups:", error);
    initializeEmptyState();
  }
}

function initializeEmptyState() {
  renderAccountsTable([]);
  updateStats([]);
  updateGroupSelect([]);
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

    updateGroupSelect(groups);

    let allAccounts = [];
    if (selectedGroup === "all") {
      // Lấy tất cả tài khoản từ tất cả nhóm
      allAccounts = groups.flatMap((group) => group.data);
    } else {
      // Lọc các tài khoản theo nhóm đã chọn
      const selectedGroupData = groups.find(
        (group) => group.name_groups === selectedGroup
      );
      if (selectedGroupData) {
        allAccounts = selectedGroupData.data;
      }
    }

    renderAccountsTable(allAccounts);
    updateStats(allAccounts);
  } catch (error) {
    console.error("Error loading groups:", error);
    initializeEmptyState();
  }
}

async function addAccounts(accountsText, groupName) {
  try {
    const lines = accountsText.trim().split("\n");
    const newAccounts = lines.map((line) => {
      const [uid, password, twoFA = "", cookie = ""] = line.split("|");
      return {
        uid,
        password,
        twoFA,
        cookie,
        status: "Live",
        addedAt: new Date().toISOString(),
      };
    });
    const filePath = path.join(__dirname, "data", "sweep_clone.json");

    let currentGroups = [];
    try {
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        currentGroups = JSON.parse(fileData);
        if (!Array.isArray(currentGroups)) currentGroups = [];
      }
    } catch (error) {
      console.error("Lỗi khi đọc file JSON:", error);
    }

    // Tìm hoặc thêm mới nhóm
    let groupIndex = currentGroups.findIndex(
      (g) => g.name_groups === groupName
    );
    if (groupIndex === -1) {
      currentGroups.push({
        name_groups: groupName,
        data: newAccounts,
      });
    } else {
      currentGroups[groupIndex].data.push(...newAccounts);
    }
    await saveAccountsToFile(currentGroups);
    await loadAccountGroups();
    toggleModal(false); // Đóng modal sau khi thêm tài khoản
    clearForm();
  } catch (error) {
    console.error("Error adding accounts:", error);
    alert("Có lỗi xảy ra khi thêm tài khoản");
  }
}

function clearForm() {
  document.querySelector(".text-area").value = "";
  document.querySelector("#groupName").value = "";
}

function renderAccountsTable(accounts) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  if (!accounts || accounts.length === 0) {
    tbody.innerHTML = `        
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
        <td><input type="checkbox" class="checkbox" /></td>
        <td>${account.uid || ""}</td>
        <td><span class="${
          account.status.toLowerCase() === "live" ? "status-live" : ""
        }">${account.status}</span></td>
        <td>${
          account.password || "Không có mật khẩu"
        }</td> <!-- Hiển thị mật khẩu trực tiếp -->
        <td>${account.twoFA || ""}</td>
        <td class="cookie-cell">${account.cookie || ""}</td>
      `;
    tbody.appendChild(tr);
  });
}

function updateStats(accounts) {
  const total = accounts.length;
  const live = accounts.filter(
    (acc) => acc.status.toLowerCase() === "live"
  ).length;
  const die = total - live;

  document.querySelector(".stats").innerHTML = `
      <div>Tổng số: <span>${total}</span></div>
      <div>Live: <span>${live}</span></div>
      <div>Die: <span class="die">${die}</span></div>
    `;
}

async function saveAccountsToFile(groups) {
  try {
    const filePath = path.join(__dirname, "data", "sweep_clone.json");
    // Chuyển đổi nhóm hiện tại thành JSON
    const jsonString = JSON.stringify(groups, null, 2);
    fs.writeFileSync(filePath, jsonString, "utf-8");
  } catch (error) {
    console.error("Lỗi khi lưu file JSON:", error);
    throw error; // Đẩy lỗi ra để xử lý bên ngoài
  }
}

async function handleAddAccounts() {
  const groupName = document.getElementById("groupName").value.trim();
  const accountsText = document.querySelector(".text-area").value.trim();

  if (!groupName || !accountsText) {
    alert("Vui lòng nhập đầy đủ tên nhóm và danh sách tài khoản");
    return;
  }

  try {
    const filePath = path.join(__dirname, "data", "sweep_clone.json");
    let currentGroups = [];

    // Đọc dữ liệu hiện tại nếu file tồn tại
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      currentGroups = JSON.parse(fileData);
      if (!Array.isArray(currentGroups)) {
        currentGroups = [];
      }
    }

    // Xử lý accounts mới
    const accounts = accountsText.split("\n").map((line) => {
      const [uid, password, twoFA = "", cookie = ""] = line.split("|");
      return {
        uid,
        password,
        twoFA,
        cookie,
        status: "Live",
        addedAt: new Date().toISOString(),
      };
    });

    // Tìm hoặc thêm nhóm
    const existingGroupIndex = currentGroups.findIndex(
      (g) => g.name_groups === groupName
    );

    if (existingGroupIndex === -1) {
      currentGroups.push({
        name_groups: groupName,
        data: accounts,
      });
    } else {
      currentGroups[existingGroupIndex].data.push(...accounts);
    }

    // Lưu toàn bộ dữ liệu
    await saveAccountsToFile(currentGroups);
    await loadAccountGroups();
    toggleModal(false);
    clearForm();
  } catch (error) {
    console.error("Error adding accounts:", error);
    alert("Có lỗi xảy ra khi thêm tài khoản");
  }
}
document
  .getElementById("deleteAccountsBtn")
  .addEventListener("click", function () {
    // Lấy giá trị của <select>
    const selectedAccount = document.getElementById(
      "manageAccountsSelect"
    ).value;

    // Lấy tất cả checkbox
    const checkboxes = document.querySelectorAll(".checkbox");
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

          // Tiếp tục lấy dữ liệu từ các cột
          const status = row.cells[2].textContent; // Lấy trạng thái từ cột thứ 3
          const password = row.cells[3].textContent; // Lấy password từ cột thứ 4
          const twoFA = row.cells[4].textContent; // Lấy 2FA từ cột thứ 5
          const cookie = row.cells[5].textContent; // Lấy cookie từ cột thứ 6

          // Thêm dữ liệu vào mảng selectedAccounts
          selectedAccounts.push({
            uid: uid,
            Status: status,
            Password: password,
            TwoFA: twoFA,
            Cookie: cookie,
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
          const checkbox = row.querySelector(".checkbox");
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
            type_delete: "deleteaccount",
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

document.addEventListener("DOMContentLoaded", function () {
  const exportAccountsBtn = document.getElementById("exportAccountsBtn");

  // Lắng nghe sự kiện click trên nút "Xuất tài khoản"
  exportAccountsBtn.addEventListener("click", function () {
    // Lấy giá trị của select
    const selectedOption = document.getElementById(
      "manageAccountsSelect"
    ).value;

    // Lấy tất cả checkbox trong tbody
    const checkboxes = document.querySelectorAll("tbody .checkbox");

    // Tạo một mảng để lưu trữ các checkbox đã được chọn
    const selectedCheckboxes = [];

    // Duyệt qua các checkbox và kiểm tra nếu nó được chọn
    checkboxes.forEach(function (checkbox, index) {
      if (checkbox.checked) {
        // Nếu checkbox được chọn, lấy toàn bộ dữ liệu của dòng tương ứng
        const row = checkbox.closest("tr"); // Lấy dòng cha của checkbox
        const uid = row.querySelector("td:nth-child(2)").textContent; // Lấy UID
        const status = row.querySelector("td:nth-child(3)").textContent; // Lấy trạng thái
        const password = row.querySelector("td:nth-child(4)").textContent; // Lấy password
        const twoFA = row.querySelector("td:nth-child(5)").textContent; // Lấy 2FA
        const cookie = row.querySelector("td:nth-child(6)").textContent; // Lấy cookie

        // Thêm dữ liệu vào mảng selectedCheckboxes
        selectedCheckboxes.push({
          UID: uid,
          Status: status,
          Password: password,
          TwoFA: twoFA,
          Cookie: cookie,
        });
      }
    });

    // In ra kết quả
    if (selectedCheckboxes.length > 0) {
      // Lưu dữ liệu vào file JSON
      const fs = require("fs");
      const filePath = path.join(__dirname, "data", "data_export.json");

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            selectedOption,
            type_export: "export_account",
            accounts: selectedCheckboxes,
          },
          null,
          2
        ),
        "utf-8"
      );
      console.log("Dữ liệu đã được lưu vào data_export.json.");

      // Thông báo cho người dùng

      // Chuyển dữ liệu thành chuỗi JSON để gửi
      const jsonData = JSON.stringify({
        selectedOption,
        accounts: selectedCheckboxes,
      });

      // Sử dụng Node.js exec để gọi Python script

      // Sau khi lưu dữ liệu vào file JSON, gọi Python để xử lý
      const scriptPath = path.join(__dirname, "src_python", "process_data.py");

      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        alert(`Dữ liệu đã được xuất thành công vào file: ${stdout.trim()}`);
      });
    } else {
      console.log("Không có checkbox nào được chọn.");
    }
  });
});

document
  .getElementById("manageAccountsSelect")
  .addEventListener("change", function () {
    const selectedGroup = this.value;
    loadAccountGroups(selectedGroup); // Gọi lại hàm với nhóm tài khoản đã chọn
  });
function updateGroupSelect(groups) {
  const selects = [
    document.getElementById("manageAccountsSelect"),
    document.getElementById("scanGroupsSelect"),
    document.getElementById("scanGroupsSelectscanPage"),
  ];

  selects.forEach((select) => {
    if (!select) return;

    // Lưu giá trị đang được chọn
    const currentValue = select.value;

    // Clear existing options
    select.innerHTML = "";

    // Add default option
    const defaultText =
      select.id === "manageAccountsSelect"
        ? "Tất cả tài khoản"
        : "Chọn danh mục tài khoản quét";
    select.appendChild(new Option(defaultText, "all"));

    // Add group options
    groups.forEach((group) => {
      if (group && group.name_groups) {
        const option = new Option(group.name_groups, group.name_groups);
        select.appendChild(option);
      }
    });

    // Khôi phục giá trị đã chọn nếu vẫn còn tồn tại trong danh sách mới
    const optionExists = Array.from(select.options).some(
      (option) => option.value === currentValue
    );
    if (optionExists) {
      select.value = currentValue;
    }
  });
}
// Select the "Select All" checkbox in thead
const selectAllCheckbox = document.getElementById("selectAllCheckbox");

// Function to handle the "Select All" checkbox
function handleSelectAllCheckbox() {
  // Get all checkboxes in the tbody
  const tableBody = document.querySelector("tbody");
  const checkboxes = tableBody.querySelectorAll(".checkbox");

  // Set all checkboxes to match the state of the "Select All" checkbox
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAllCheckbox.checked;
  });
}

// Add event listener to the "Select All" checkbox
selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);

// Function to handle individual checkbox changes
function handleIndividualCheckbox() {
  const tableBody = document.querySelector("tbody");
  const totalCheckboxes = tableBody.querySelectorAll(".checkbox").length;
  const checkedCheckboxes =
    tableBody.querySelectorAll(".checkbox:checked").length;

  // Update "Select All" checkbox based on whether all individual checkboxes are checked
  selectAllCheckbox.checked = totalCheckboxes === checkedCheckboxes;
  // Handle indeterminate state when some but not all checkboxes are checked
  selectAllCheckbox.indeterminate =
    checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
}

// Add event listeners to all checkboxes in tbody
function initializeCheckboxes() {
  const tableBody = document.querySelector("tbody");
  const checkboxes = tableBody.querySelectorAll(".checkbox");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleIndividualCheckbox);
  });
}

// Initialize checkbox functionality when the document is loaded
document.addEventListener("DOMContentLoaded", initializeCheckboxes);

// Function to update checkbox listeners when table content changes
function updateCheckboxListeners() {
  initializeCheckboxes();
}
document.addEventListener("DOMContentLoaded", () => {
  loadAccountGroups();

  // Thêm nhóm vào tất cả các select có id là "groupSelect"
  document.addEventListener("DOMContentLoaded", async () => {
    const filePath = path.join(__dirname, "data", "sweep_clone.json");
    const fileData = fs.readFileSync(filePath, "utf-8");
    groups = JSON.parse(fileData);

    // Tìm tất cả các phần tử select có ID là "groupSelect"
    const groupSelectElements = document.querySelectorAll("#groupSelect");

    groupSelectElements.forEach((selectElement) => {
      // Xóa các option cũ
      selectElement.innerHTML = "";

      // Thêm option cho tất cả nhóm
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "All Groups";
      selectElement.appendChild(allOption);

      // Thêm option cho từng nhóm
      groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.name_groups;
        option.textContent = group.name_groups;
        selectElement.appendChild(option);
      });
    });
  });

  const openModalBtn = document.querySelector(".btn-primary");
  openModalBtn.addEventListener("click", () => toggleModal(true));

  const addButton = document.querySelector(".modal-footer .btn-primary");
  addButton.addEventListener("click", () => {
    const textarea = document.querySelector(".text-area");
    const groupName = document.querySelector("#groupName").value;

    if (textarea.value.trim()) {
      addAccounts(textarea.value, groupName);
    }
  });

  const fileButton = document.querySelector(".input-group .btn-secondary");
  fileButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        document.querySelector(".text-area").value = text;
      }
    };
    input.click();
  });
});

// Hàm toggleModal cập nhật trạng thái modal
function toggleModal(isOpen) {
  const modal = document.getElementById("addAccountModal");

  if (isOpen) {
    modal.classList.add("show");
  } else {
    modal.classList.remove("show");
  }

  console.log(
    "Modal state changed:",
    modal.classList.contains("show") ? "opened" : "closed"
  );
}
// Lấy tất cả các phần tử cần thiết
const manageAccountsLink = document.getElementById("manageAccountsLink");
const scanFanpageLink = document.getElementById("scanFanpageLink");
const scanPageLink = document.getElementById("scanPageLink");
const managePagesLink = document.getElementById("managePagesLink");
const SpamPageGroupsLink = document.getElementById("SpamPageGroupsLink");
const managePagesContent = document.getElementById("managePagesContent");
const manageAccountsContent = document.getElementById("manageAccountsContent");
const spamsttgroupsPages = document.getElementById("spamsttgroupsPages");
const scanGroupsByKeywordsContent = document.getElementById(
  "Scangroupsbykeywords"
); // Đổi ID cho khớp
const ScanPage = document.getElementById("ScanPage");
const scancontent = document.getElementById("scancontent");
const searchContent = document.getElementById("searchContent");
const reupvideo = document.getElementById("reupvideo");
const reupvideocontent = document.getElementById("reupVideoContent");

// Hàm ẩn tất cả các nội dung
function hideAllContent() {
  const contents = document.querySelectorAll(".main-content");
  contents.forEach((content) => {
    content.style.display = "none";
  });
}
if (scancontent && searchContent) {
  scancontent.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    searchContent.style.display = "block";
  });
} else {
  console.error(
    "Element 'SpamPageGroupsLink' or 'spamsttgroupsPages' not found"
  );
}
if (SpamPageGroupsLink && spamsttgroupsPages) {
  SpamPageGroupsLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    spamsttgroupsPages.style.display = "block";
  });
} else {
  console.error(
    "Element 'SpamPageGroupsLink' or 'spamsttgroupsPages' not found"
  );
}
// Kiểm tra và gán sự kiện nếu phần tử tồn tại
if (reupvideo && reupvideocontent) {
  reupvideo.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    reupvideocontent.style.display = "block";
  });
} else {
  console.error("Element 'reupvideo' or 'reupvideocontent' not found");
}
// Kiểm tra và gán sự kiện nếu phần tử tồn tại
if (managePagesLink && managePagesContent) {
  managePagesLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    managePagesContent.style.display = "block";
  });
} else {
  console.error("Element 'managePagesLink' or 'managePagesContent' not found");
}
// Kiểm tra và gán sự kiện nếu phần tử tồn tại
if (manageAccountsLink && manageAccountsContent) {
  manageAccountsLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    manageAccountsContent.style.display = "block";
  });
} else {
  console.error(
    "Element 'manageAccountsLink' or 'manageAccountsContent' not found"
  );
}

if (scanFanpageLink && scanGroupsByKeywordsContent) {
  scanFanpageLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    scanGroupsByKeywordsContent.style.display = "block";
  });
} else {
  console.error(
    "Element 'scanFanpageLink' or 'Scangroupsbykeywords' not found"
  );
}
if (scanPageLink && ScanPage) {
  scanPageLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllContent();
    ScanPage.style.display = "block";
  });
} else {
  console.error("Element 'scanPageLink' or 'ScanPage' not found");
}
// Lấy tất cả các liên kết có class 'nav-item'
const navItems = document.querySelectorAll(".nav-item");

// Hàm gỡ bỏ class 'active' khỏi tất cả các liên kết
function removeActiveClass() {
  navItems.forEach((item) => {
    item.classList.remove("active");
  });
}

// Gắn sự kiện click cho từng liên kết
navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault(); // Ngăn chặn hành động mặc định
    removeActiveClass(); // Gỡ bỏ 'active' khỏi tất cả các liên kết
    item.classList.add("active"); // Thêm 'active' vào liên kết được nhấn
  });
});
