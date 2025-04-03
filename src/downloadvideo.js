document.addEventListener("DOMContentLoaded", function() {
    const { ipcRenderer } = require("electron");
    document.getElementById("selectVideoLinksBtn").addEventListener("click", function () {
        // Tạo input để chọn file
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".txt";
      
        fileInput.addEventListener("change", function (event) {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
              const content = e.target.result;
              const lines = content.split("\n").filter(line => line.trim() !== "");
              const videoListTbody = document.getElementById("videoDownloadListTbody");
              videoListTbody.innerHTML = ""; // Xóa nội dung cũ
      
              lines.forEach((line, index) => {
                const [link, title] = line.split(" | ");
                if (link && title) {
                  const row = document.createElement("tr");
      
                  // Cột số thứ tự
                  const indexCell = document.createElement("td");
                  indexCell.textContent = index + 1;
                  row.appendChild(indexCell);
      
                  // Cột Link Video
                  const linkCell = document.createElement("td");
                  linkCell.title = link.trim(); // Thêm thuộc tính title để hiển thị đầy đủ link khi hover
                  linkCell.innerHTML = link.trim().length > 20
                    ? `<a href="${link.trim()}" target="_blank" title="${link.trim()}">${link.trim().slice(0, 20)}...</a>`
                    : `<a href="${link.trim()}" target="_blank" title="${link.trim()}">${link.trim()}</a>`;
                  row.appendChild(linkCell);
      
                  // Cột Tiêu đề
                  const titleCell = document.createElement("td");
                  titleCell.title = title.trim(); // Thêm thuộc tính title để hiển thị đầy đủ tiêu đề khi hover
                  titleCell.textContent = title.trim().length > 20
                    ? title.trim().slice(0, 20) + "..."
                    : title.trim();
                  row.appendChild(titleCell);
      
                  // Cột Trạng thái
                  const statusCell = document.createElement("td");
                  statusCell.textContent = "Chưa tải"; // Trạng thái mặc định
                  row.appendChild(statusCell);
      
                  // Cột Đường dẫn lưu
                  const pathCell = document.createElement("td");
                  pathCell.textContent = "N/A"; // Giá trị mặc định
                  row.appendChild(pathCell);
      
                  videoListTbody.appendChild(row);
                }
              });
      
              // Cập nhật tổng số link video
              document.getElementById("totalVideoLinks").textContent = lines.length;
            };
            reader.readAsText(file);
          }
        });
      
        // Kích hoạt hộp thoại chọn file
        fileInput.click();
    });
    document.getElementById("browseFolderDownload").addEventListener("click", async () => {
        const folderPath = await ipcRenderer.invoke("select-folder");
        if (folderPath) {
            document.getElementById("saveLocationDownload").value = folderPath;
        }
    });

    document.getElementById("startDownloadBtn").addEventListener("click", function () {
        const startDownloadBtn = document.getElementById("startDownloadBtn");
        const videoListTbody = document.getElementById("videoDownloadListTbody");
        const downloadThreads = document.getElementById("downloadThreads").value;
        const saveLocation = document.getElementById("saveLocationDownload").value;
    
        // Kiểm tra nếu không có video hoặc số luồng không hợp lệ
        if (!videoListTbody.children.length) {
            alert("Danh sách video tải trống!");
            return;
        }
        if (!downloadThreads || isNaN(downloadThreads) || downloadThreads <= 0) {
            alert("Số luồng không hợp lệ!");
            return;
        }
        if (!saveLocation) {
            alert("Vui lòng chọn nơi lưu file!");
            return;
        }
    
        // Làm mờ nút "Start Download"
        startDownloadBtn.disabled = true;
        startDownloadBtn.textContent = "Đang tải...";
    
        // Lấy danh sách video từ treeview
        const videos = [];
        Array.from(videoListTbody.children).forEach((row) => {
            const link = row.querySelector("td:nth-child(2) a")?.getAttribute("href") || ""; // Lấy link đầy đủ từ href
            const title = row.querySelector("td:nth-child(3)")?.getAttribute("title") || ""; // Lấy tiêu đề đầy đủ từ title
            if (link && title) {
                videos.push({ link, title });
            }
        });
    
        // Tạo đối tượng JSON
        const downloadData = {
            threads: parseInt(downloadThreads, 10),
            savePath: saveLocation,
            videos: videos,
        };
    
        // Lưu JSON vào file
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(__dirname, "data", "downloadConfig.json");
    
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(downloadData, null, 2), "utf-8");
    
        alert("Cấu hình tải video đã được lưu!");
    
        const { exec } = require("child_process");
        const pythonProcess = exec("python ./src_python/affiliate/download_video.py");
    
        // Lắng nghe dữ liệu từ Python
        pythonProcess.stdout.on("data", (data) => {
            try {
                // Xử lý từng dòng dữ liệu
                const lines = data.toString().split("\n").filter(line => line.trim() !== "");
                lines.forEach((line) => {
                    const parsedData = JSON.parse(line); // Parse dữ liệu JSON từ Python
                    const { link, status } = parsedData;
    
                    // Tìm hàng tương ứng trong treeview
                    Array.from(videoListTbody.children).forEach((row) => {
                        const rowLink = row.querySelector("td:nth-child(2) a")?.getAttribute("href");
                        if (rowLink === link) {
                            const statusCell = row.querySelector("td:nth-child(4)"); // Cột trạng thái
                            statusCell.textContent = status; // Cập nhật trạng thái
                        }
                    });
                });
            } catch (e) {
                console.error("Lỗi khi parse dữ liệu từ Python:", e);
            }
        });
    
        pythonProcess.stderr.on("data", (data) => {
            console.error(`Error: ${data}`);
        });
    
        pythonProcess.on("close", (code) => {
            console.log(`Python process exited with code ${code}`);
            // Kích hoạt lại nút "Start Download" khi hoàn tất
            startDownloadBtn.disabled = false;
            startDownloadBtn.textContent = "Start Download";
            alert("Quá trình tải hoàn tất!");
        });
    });
    
});


