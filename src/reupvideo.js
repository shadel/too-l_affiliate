

document.addEventListener("DOMContentLoaded", () => {
    const introToggle = document.getElementById("introToggle");
    const introTree = document.getElementById("introTree");
    const toggleIcon = introToggle.querySelector(".toggle-icon");
    const videoInput = document.getElementById("videoInput");
    const reupVideoListTbody = document.getElementById("reupVideoListTbody");
    const browseFolderReup = document.getElementById("browseFolderReup");
    const saveLocationReup = document.getElementById("saveLocationReup");
    const startReupBtn = document.getElementById("startReupBtn");
    const reupThreadsInput = document.getElementById("reupThreads"); // Input số luồng
    const { ipcRenderer } = require("electron");
    const fs = require("fs");
    const path = require("path");
    // Toggle Intro Tree
    introToggle.addEventListener("click", () => {
        if (introTree.style.display === "none") {
            introTree.style.display = "block";
            toggleIcon.textContent = "-"; // Đổi dấu thành trừ
        } else {
            introTree.style.display = "none";
            toggleIcon.textContent = "+"; // Đổi dấu thành cộng
        }
    });

    // Handle video selection and append to table
    videoInput.addEventListener("click", async () => {
        const filePaths = await ipcRenderer.invoke("select-files");
        if (filePaths && filePaths.length > 0) {
            reupVideoListTbody.innerHTML = ""; // Clear the current table body

            filePaths.forEach((filePath, index) => {
                const row = document.createElement("tr");

                const indexCell = document.createElement("td");
                indexCell.textContent = index + 1;

                const pathCell = document.createElement("td");
                pathCell.textContent = filePath;

                const statusCell = document.createElement("td");
                statusCell.textContent = "Chưa xử lý";

                row.appendChild(indexCell);
                row.appendChild(pathCell);
                row.appendChild(statusCell);

                reupVideoListTbody.appendChild(row);
            });
        }
    });

    // Handle folder selection
    browseFolderReup.addEventListener("click", async () => {
        const folderPath = await ipcRenderer.invoke("select-folder");
        if (folderPath) {
            saveLocationReup.value = folderPath;
        }
    });

    // Handle "Bắt đầu" button click
    // Handle "Bắt đầu" button click
    startReupBtn.addEventListener("click", () => {
        const saveLocation = saveLocationReup.value;
        const reupThreads = reupThreadsInput.value; // Get number of threads from input

        // Validate input data
        if (!saveLocation) {
            alert("Vui lòng chọn nơi lưu video!");
            return;
        }

        if (!reupThreads || isNaN(reupThreads) || reupThreads <= 0) {
            alert("Vui lòng nhập số luồng hợp lệ!");
            return;
        }

        const rows = reupVideoListTbody.querySelectorAll("tr");
        if (rows.length === 0) {
            alert("Vui lòng chọn ít nhất một video!");
            return;
        }

        const effectCheckboxes = introTree.querySelectorAll("input[type='checkbox']:checked");
        if (effectCheckboxes.length === 0) {
            alert("Vui lòng chọn ít nhất một hiệu ứng!");
            return;
        }

        // Get video list from table
        const videoData = [];
        rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            videoData.push({
                index: cells[0].textContent.trim(),
                path: cells[1].textContent.trim(),
                status: cells[2].textContent.trim(),
            });
        });

        // Get selected effects
        const selectedEffects = [];
        effectCheckboxes.forEach((checkbox) => {
            selectedEffects.push(checkbox.value);
        });

        // Create JSON data
        const jsonData = {
            saveLocation,
            threads: parseInt(reupThreads, 10), // Number of threads
            videos: videoData,
            effects: selectedEffects, // List of effects
        };

        // JSON file path
        const dataFolderPath = path.join(__dirname, "data");
        const filePath = path.join(dataFolderPath, "reup_video_data.json");

        try {
            // Create directory if it doesn't exist
            if (!fs.existsSync(dataFolderPath)) {
                fs.mkdirSync(dataFolderPath, { recursive: true });
            }

            // Write data to JSON file
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
            
            // Disable button during processing
            startReupBtn.disabled = true;
            startReupBtn.textContent = "Đang xử lý...";
            
            // Execute Python script
            const { exec } = require("child_process");
            const pythonProcess = exec("python ./src_python/affiliate/reup_video.py");
            
            // Listen for data from Python script
            // ...existing code...

            pythonProcess.stdout.on("data", (data) => {
                try {
                    const lines = data.toString().split("\n").filter(line => line.trim() !== "");
                    
                    lines.forEach((line) => {
                        try {
                            const parsedData = JSON.parse(line);
                            console.log("Data from Python:", parsedData);
                            
                            // Handle video status updates
                            if (parsedData.path) {
                                Array.from(reupVideoListTbody.children).forEach((row) => {
                                    const rowPath = row.querySelector("td:nth-child(2)").textContent;
                                    if (rowPath === parsedData.path) {
                                        const statusCell = row.querySelector("td:nth-child(3)");
                                        let statusText = parsedData.status;
                                        if (parsedData.progress >= 0) {
                                            statusText += ` (${parsedData.progress}%)`;
                                        }
                                        statusCell.textContent = statusText;
                                    }
                                });
                            }
                            
                            // Handle completion message
                            if (parsedData.complete) {
                                startReupBtn.disabled = false;
                                startReupBtn.textContent = "Bắt đầu";
                                alert("Quá trình xử lý video hoàn tất!");
                            }
                        } catch (e) {
                            console.error("Error parsing line:", line, e);
                        }
                    });
                } catch (e) {
                    console.error("Error processing Python output:", e);
                }
            });
        
            pythonProcess.stderr.on("data", (data) => {
                console.error(`Python error: ${data}`);
            });
        
            pythonProcess.on("close", (code) => {
                console.log(`Python process exited with code ${code}`);
                // Re-enable the start button
                startReupBtn.disabled = false;
                startReupBtn.textContent = "Bắt đầu";
                
                if (code === 0) {
                    alert("Quá trình xử lý video hoàn tất!");
                } else {
                    alert(`Có lỗi xảy ra khi xử lý video. Mã lỗi: ${code}`);
                }
            });
            
        } catch (err) {
            console.error("Lỗi khi lưu file JSON:", err);
            alert("Lưu dữ liệu thất bại!");
        }
    });
});