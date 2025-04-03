const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

// Function to load account groups from JSON file

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Allow using Node.js features in the renderer process
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

ipcMain.handle("save-accounts", async (event, accounts) => {
  const filePath = path.join(__dirname, "data", "sweep_clone.json");

  try {
    // Read existing data if it exists
    let currentData = [];
    try {
      const data = fs.readFileSync(filePath, "utf8");
      currentData = JSON.parse(data);
    } catch (error) {
      console.log("No existing data, starting with an empty array.");
    }

    // Save the new accounts
    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2));
    console.log("Accounts saved successfully!");

    return { success: true };
  } catch (error) {
    console.error("Error saving accounts:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
  });
  return result.filePaths[0] || null;
});
ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
          { name: "Videos", extensions: ["mp4", "mkv", "avi", "mov"] },
      ],
  });

  if (result.canceled) {
      return null;
  } else {
      return result.filePaths; // Trả về danh sách đường dẫn đầy đủ
  }
});