document.addEventListener("DOMContentLoaded", () => {
  const fs = require("fs");
  const { spawn } = require("child_process");
  const path = require("path");

  // Modal HTML Template
  const modalHTML = `
  <div class="modal-overlay" id="keyValidationModal" style="display: none;">
      <div class="modal">
          <div class="modal-header">
              <h2 class="modal-title">Nhập Key kích hoạt</h2>
          </div>
          <div class="modal-body">
              <div class="input-group">
                  <input type="text" id="licenseKeyInput" class="text-input" placeholder="Nhập key của bạn vào đây..." />
                  <div id="keyErrorMessage" style="color: #f85149; margin-top: 8px; display: none;">
                      Key không hợp lệ
                  </div>
              </div>
          </div>
          <div class="modal-footer">
              <button class="btn-primary" id="validateKeyBtn">Xác nhận</button>
          </div>
      </div>
  </div>

  <div class="modal-overlay" id="showKeyModal" style="display: none;">
      <div class="modal">
          <div class="modal-header">
              <h2 class="modal-title">License Key</h2>
          </div>
          <div class="modal-body">
              <div class="key-display-group" style="display: flex; align-items: center; gap: 10px;">
                  <div class="key-input-wrapper" style="flex-grow: 1; position: relative;">
                      <input type="text" id="currentKeyDisplay" class="text-input" readonly style="width: 100%; padding-right: 100px;" />
                  </div>
                  <button id="copyKeyBtn" class="copy-button" style="
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
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                  </button>
              </div>
          </div>
          <div class="modal-footer">
              <button class="btn-primary" id="closeKeyModalBtn">Đóng</button>
          </div>
      </div>
  </div>

  <style>
      .copy-button:hover {
          background: #0052a3 !important;
      }
      .copy-button:active {
          background: #004080 !important;
      }
  </style>
  `;

  // Initialize DOM elements
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Kiểm tra key khi khởi động
  function checkKeyValidation() {
    const data = {
      status: "check_key",
    };
    fs.writeFile(
      "data/action_client.json",
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

    const pythonScriptPath = path.join(__dirname, "src_python", "check_key.py");
    const pythonProcess = spawn("python", [pythonScriptPath]);

    pythonProcess.stdout.on("data", (data) => {
      try {
        const result = JSON.parse(data.toString().trim());
        console.log(result);
        if (result.status === "False") {
          alert(result.message);
          document.getElementById("keyValidationModal").style.display = "flex";
          document.querySelector(".container").classList.add("disabled");
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error parsing JSON data:", error);
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data.toString()}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
    });
  }

  // Validate key button click handler
  document.getElementById("validateKeyBtn").addEventListener("click", () => {
    const key = document.getElementById("licenseKeyInput").value;
    const data = {
      status: "save_key",
      key: key,
    };
    fs.writeFile(
      "data/action_client.json",
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

    if (key) {
      const pythonScriptPath = path.join(
        __dirname,
        "src_python",
        "check_key.py"
      );
      const pythonProcess = spawn("python", [pythonScriptPath]);

      pythonProcess.stdout.on("data", (data) => {
        try {
          const result = JSON.parse(data.toString().trim());
          console.log(result);
          if (result.status === "True") {
            document.getElementById("keyValidationModal").style.display =
              "none";
            document.querySelector(".container").style.pointerEvents = "auto";
            alert(result.message);
          } else {
            alert(result.message);
            document.getElementById("keyErrorMessage").style.display = "block";
          }
        } catch (error) {
          console.error("Error parsing JSON data:", error);
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Python error: ${data.toString()}`);
      });

      pythonProcess.on("close", (code) => {
        console.log(`Python process exited with code ${code}`);
      });
    }
  });

  // Show current key handler
  document.getElementById("showkey").addEventListener("click", async () => {
    try {
      const keyData = await fs.promises.readFile("data/key.json", "utf8");
      const { key } = JSON.parse(keyData);
      document.getElementById("currentKeyDisplay").value = key;
      document.getElementById("showKeyModal").style.display = "flex";
    } catch (error) {
      console.error("Error reading key:", error);
      alert("Không thể đọc key");
    }
  });

  // Logout handler
  document.getElementById("logout").addEventListener("click", async () => {
    try {
      await fs.promises.unlink("data/key.json");
      document.getElementById("keyValidationModal").style.display = "flex";
      document.querySelector(".container").classList.add("disabled");
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Có lỗi xảy ra khi đăng xuất");
    }
  });

  // Copy key handler with improved UI
  const copyBtn = document.getElementById("copyKeyBtn");
  copyBtn.addEventListener("click", () => {
    const keyInput = document.getElementById("currentKeyDisplay");
    keyInput.select();
    document.execCommand("copy");

    copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
      `;
    setTimeout(() => {
      copyBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
          `;
    }, 2000);
  });

  // Close key modal handler
  document.getElementById("closeKeyModalBtn").addEventListener("click", () => {
    document.getElementById("showKeyModal").style.display = "none";
  });

  // Initialize dropdowns
  function toggleDropdown(iconId, dropdownId) {
    const icon = document.getElementById(iconId);
    const dropdown = document.getElementById(dropdownId);

    icon.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function (event) {
      if (!icon.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  toggleDropdown("settingsIcon", "supportModal");
  toggleDropdown("profileIcon", "profileDropdown");

  // Initial key validation check
  checkKeyValidation();
});
