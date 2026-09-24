import fs from 'fs';

let content = fs.readFileSync('src/ShopDashboard.jsx', 'utf8');

content = content.replace(
  "import ParchiPanel from './components/ShopDashboard/ParchiPanel.jsx';",
  "import ParchiPanel from './components/ShopDashboard/ParchiPanel.jsx';\nimport RequestsTab from './components/ShopDashboard/RequestsTab.jsx';"
);

content = content.replace(
  `<button onClick={() => setActiveTab("settings")} style={tabStyle(activeTab === "settings")}>⚙️ Settings</button>`,
  `<button onClick={() => setActiveTab("settings")} style={tabStyle(activeTab === "settings")}>⚙️ Settings</button>\n        <button onClick={() => setActiveTab("requests")} style={tabStyle(activeTab === "requests")}>📦 Customer Requests</button>`
);

content = content.replace(
  `{activeTab === "settings" && <SettingsTab shopData={shopData} setShopData={setShopData} />}`,
  `{activeTab === "settings" && <SettingsTab shopData={shopData} setShopData={setShopData} />}\n          {activeTab === "requests" && <RequestsTab shopData={shopData} />}`
);

fs.writeFileSync('src/ShopDashboard.jsx', content);
console.log("Updated ShopDashboard!");
