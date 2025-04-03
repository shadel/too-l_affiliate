document.addEventListener("DOMContentLoaded", function() {
    // Lấy các phần tử
    const keywordMode = document.getElementById("keywordMode");
    const channelMode = document.getElementById("channelMode");
    const keywordBox = document.getElementById("keywordBox");
    const channelBox = document.getElementById("channelBox");
    const tbody = document.getElementById("linkListTbody");
    const contextMenu = document.getElementById("contextMenu");
    const selectAllCheckbox = document.getElementById("Checkbox-scan-content-all");
    const tabScanVideo = document.getElementById("tabScanVideo");
    const tabDownloadVideo = document.getElementById("tabDownloadVideo");
    const scanVideoContent = document.getElementById("scanVideoContent");
    const downloadVideoContent = document.getElementById("downloadVideoContent");
    let selectedRow = null;

    function switchTab(activeTab, inactiveTab, activeContent, inactiveContent) {
        activeTab.classList.add("active");
        inactiveTab.classList.remove("active");
        activeContent.classList.add("active");
        inactiveContent.classList.remove("active");
    }

    // Hàm lấy giá trị từ giao diện
    function getFormValues() {
        const isKeywordMode = document.getElementById("keywordMode").checked;
        const isChannelMode = document.getElementById("channelMode").checked;
    
        if (isKeywordMode) {
            const platform = document.getElementById("platformSelect").value;
            const keyword = document.getElementById("keywordInput").value.trim();
            const keywordLimit = parseInt(document.getElementById("keywordLimit").value, 10);
    
            return {
                mode: "keyword",
                platform,
                keyword,
                keywordLimit,
            };
        } else if (isChannelMode) {
            const platform = document.getElementById("platformSelectChannel").value;
            const channel = document.getElementById("channelInput").value.trim();
            const keywordLimit = parseInt(document.getElementById("keywordLimitChannels").value, 10);
            return {
                mode: "channel",
                platform,
                channel,
                keywordLimit,
            };
        }
    
        return null;
    }
    
    // Hàm kiểm tra giá trị đầu vào
    function validateFormValues(values) {
        if (!values) {
            alert("Vui lòng chọn chế độ quét!");
            return false;
        }
    
        if (values.mode === "keyword") {
            if (!values.platform || !values.keyword || isNaN(values.keywordLimit) || values.keywordLimit <= 0) {
                alert("Vui lòng nhập đầy đủ thông tin cho chế độ Quét theo từ khóa!");
                return false;
            }
        } else if (values.mode === "channel") {
            if (!values.platform || !values.channel) {
                alert("Vui lòng nhập đầy đủ thông tin cho chế độ Quét theo kênh!");
                return false;
            }
        }
    
        return true;
    }
    
    // Hàm xử lý logic quét
    function startScan(values) {
        if (values.mode === "keyword") {
            data = {
                typescan: values.mode,
                platform: values.platform,
                keyword: values.keyword,
                keywordLimit: values.keywordLimit,
            }
            // Thêm logic quét theo từ khóa tại đây
        } else if (values.mode === "channel") {
            data = {
                typescan: values.mode,
                platform: values.platform,
                keyword: values.keyword,
                keywordLimit: values.keywordLimit,
            }
            // Thêm logic quét theo kênh tại đây
        }
        const fs = require("fs");

        const filePath = path.join(__dirname, "data", "scancontent.json");

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(
          filePath,
          JSON.stringify(
            {
              data: data,
            },
            null,
            2
          ),
          "utf-8"
        );

    }

    function handleSelectAllCheckbox() {
        // Lấy tất cả checkbox trong tbody
        const tableBody = document.getElementById("linkListTbody");
        const checkboxes = tableBody.querySelectorAll(".scancontent");
    
        // Đặt trạng thái checkbox cá nhân theo trạng thái của "Select All"
        checkboxes.forEach((checkbox) => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    // Hàm thiết lập menu ngữ cảnh
    function setupContextMenu() {
        // Xóa tất cả các event listeners cũ để tránh trùng lặp
        tbody.removeEventListener("contextmenu", handleContextMenu);
        
        // Thêm lại event listener mới
        tbody.addEventListener("contextmenu", handleContextMenu);
    }

    // Xử lý sự kiện click chuột phải
    function handleContextMenu(event) {
        // Xác định hàng được click
        const row = event.target.closest("tr");
        if (!row) return;
        
        event.preventDefault();
        selectedRow = row;
        
        // Hiển thị menu ngữ cảnh tại vị trí chuột
        contextMenu.style.display = "block";
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
    }
    
    // Thiết lập menu ngữ cảnh ban đầu
    setupContextMenu();
    
    // Thêm sự kiện cho checkbox "Select All"
    selectAllCheckbox.addEventListener("change", handleSelectAllCheckbox);

        // Sự kiện click cho tab "Quét Video"
    tabScanVideo.addEventListener("click", () => {
        switchTab(tabScanVideo, tabDownloadVideo, scanVideoContent, downloadVideoContent);
    });

    // Sự kiện click cho tab "Tải Video"
    tabDownloadVideo.addEventListener("click", () => {
        switchTab(tabDownloadVideo, tabScanVideo, downloadVideoContent, scanVideoContent);
    });
    
    // Gắn sự kiện cho radio buttons
    keywordMode.addEventListener("change", () => {
        if (keywordMode.checked) {
            keywordBox.classList.remove("disabled");
            channelBox.classList.add("disabled");
        }
    });

    channelMode.addEventListener("change", () => {
        if (channelMode.checked) {
            channelBox.classList.remove("disabled");
            keywordBox.classList.add("disabled");
        }
    });
    
    document.getElementById("startScancontentBtn").addEventListener("click", () => {
        const startButton = document.getElementById("startScancontentBtn");
    
        // Vô hiệu hóa nút "Start"
        startButton.disabled = true;
        startButton.classList.add("disabled");
    
        // Lấy giá trị từ giao diện
        const values = getFormValues();
    
        // Kiểm tra tính hợp lệ của giá trị
        if (!validateFormValues(values)) {
            startButton.disabled = false; // Kích hoạt lại nút nếu không hợp lệ
            startButton.classList.remove("disabled");
            return;
        }
    
        // Xử lý logic quét
        startScan(values);
        const { exec } = require("child_process");
        const pythonProcess = exec("python ./src_python/affiliate/scan_video.py");
    
        pythonProcess.stdout.on("data", (data) => {
            try {
                console.log(data);
                const parsedData = JSON.parse(data); // Parse dữ liệu JSON từ Python
                if (parsedData.type === "error") {
                    alert(`Error: ${parsedData.status}`);
                } else if (parsedData.type === "success") {
                    alert(`Success: ${parsedData.status}`);
                } else {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td><input type="checkbox" class="scancontent"/></td>
                        <td>${parsedData.id}</td>
                        <td title="${parsedData.link || ""}" data-full-link="${parsedData.link || ""}">
                            ${parsedData.link && parsedData.link.length > 20
                                ? `<a href="${parsedData.link}" target="_blank" title="${parsedData.link}">${parsedData.link.slice(0, 20)}...</a>`
                                : `<a href="${parsedData.link}" target="_blank" title="${parsedData.link}">${parsedData.link || ""}</a>`}
                        </td>
                        <td title="${parsedData.title || ""}" data-full-title="${parsedData.title || ""}">
                            ${parsedData.title && parsedData.title.length > 20
                                ? parsedData.title.slice(0,  20) + "..."
                                : parsedData.title || ""}
                        </td>
                        <td>${parsedData.views}</td>
                        <td>${parsedData.creation_date}</td>
                        <td>${parsedData.user}</td>
                    `;
                    tbody.appendChild(row);
                    setupContextMenu();
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
            // Kích hoạt lại nút "Start" sau khi quét xong
            startButton.disabled = false;
            startButton.classList.remove("disabled");
        });
    });

    // Ẩn menu ngữ cảnh khi click bên ngoài
    document.addEventListener("click", () => {
        contextMenu.style.display = "none";
    });

    // Xử lý khi chọn "Copy"
    // Xử lý khi chọn "Copy Link"
    document.getElementById("copyLink").addEventListener("click", async () => {
        const checkboxes = document.querySelectorAll(".scancontent:checked"); // Chỉ lấy các checkbox được chọn
        let selectedLinks = '';

        checkboxes.forEach((checkbox) => {
            const row = checkbox.closest("tr"); // Lấy hàng chứa checkbox
            if (row) {
                const linkCell = row.cells[2].getAttribute("data-full-link") || ""; // Lấy ô chứa link
                selectedLinks += `${linkCell}\n`; // Thêm link vào danh sách
            }
        });

        if (selectedLinks.trim() !== '') {
            try {
                await navigator.clipboard.writeText(selectedLinks); // Copy danh sách link vào clipboard
                alert("✅ Đã copy link:\n" + selectedLinks);
            } catch (err) {
                console.error("❌ Không thể copy link: ", err);
                alert("⚠️ Không thể copy. Hãy thử lại!");
            }
        } else {
            alert("⚠️ Không có link nào được chọn để copy!");
        }
    });
    
    

    // Xử lý khi chọn "Xóa"
    document.getElementById("deleteRow").addEventListener("click", () => {
        const checkboxes = document.querySelectorAll(".scancontent:checked"); // Chỉ lấy các checkbox được chọn
    
        if (checkboxes.length === 0) {
            alert("⚠️ Không có hàng nào được chọn để xóa!");
            return;
        }
    
        checkboxes.forEach((checkbox) => {
            const row = checkbox.closest("tr"); // Lấy hàng chứa checkbox
            if (row) {
                row.remove(); // Xóa hàng
            }
        });
    
        alert("✅ Đã xóa các hàng được chọn!");
        contextMenu.style.display = "none"; // Ẩn menu ngữ cảnh nếu đang hiển thị
    });

    document.getElementById("saveLink").addEventListener("click", () => {
        const checkboxes = document.querySelectorAll(".scancontent:checked"); // Chỉ lấy các checkbox được chọn
        let selectedLinks = '';
    
        checkboxes.forEach((checkbox) => {
            const row = checkbox.closest("tr"); // Lấy hàng chứa checkbox
            if (row) {
                const linkCell = row.cells[2].getAttribute("data-full-link") || ""; // Lấy ô chứa link
                const titleCell = row.cells[3].getAttribute("data-full-title") || ""; // Lấy ô chứa tiêu đề
                selectedLinks += `${linkCell} | ${titleCell}\n`; // Thêm link và tiêu đề vào danh sách
            }
        });
    
        if (selectedLinks.trim() !== '') {
            const fs = require("fs");
            const path = require("path");
    
            // Lấy ngày giờ hiện tại
            const now = new Date();
            const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    
            // Tạo tên file
            const fileName = `savelink_${timestamp}.txt`;
    
            // Lấy đường dẫn lưu từ input
            const saveLocation = document.getElementById("saveLocation").value;
            if (!saveLocation) {
                alert("⚠️ Vui lòng chọn đường dẫn lưu trước!");
                return;
            }
    
            const filePath = path.join(saveLocation, fileName);
    
            // Ghi file
            try {
                fs.writeFileSync(filePath, selectedLinks, "utf-8");
                alert(`✅ Đã lưu link vào file: ${filePath}`);
            } catch (err) {
                console.error("❌ Lỗi khi lưu file:", err);
                alert("⚠️ Không thể lưu file. Hãy thử lại!");
            }
        } else {
            alert("⚠️ Không có link nào được chọn để lưu!");
        }
    });
    const { ipcRenderer } = require("electron");

    document.getElementById("browseFolder").addEventListener("click", async () => {
        const folderPath = await ipcRenderer.invoke("select-folder");
        if (folderPath) {
            document.getElementById("saveLocation").value = folderPath;
        }
    });
});