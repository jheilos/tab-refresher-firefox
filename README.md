# Tab Refresher - Firefox Extension

**Automatically refresh multiple tabs in a cycle with time-based URL switching**

Perfect for monitoring dashboards, live streams, Twitch streaming schedules, or any websites requiring regular updates. Features customizable timing controls, intelligent time-based URL switching, and comprehensive settings backup/restore.

## 🚀 Features

### **Core Functionality**
- **Automatic Tab Cycling**: Continuously refresh multiple tabs in sequence
- **Time-Based URL Switching**: Automatically switch between URLs based on schedules
- **Customizable Timing**: Configure wait times and refresh delays to your needs
- **Multiple Import Methods**: File upload, paste import, and clipboard import
- **Settings Backup/Restore**: Export and import your configurations with ease
- **Smart Notifications**: Get notified when cycles start, stop, or encounter issues
- **Dedicated Settings Page**: Full-featured options page for advanced configuration

### **Perfect for Stream Watchers**
- **Twitch Integration**: Automatically switch between live channels and 24/7 streams
- **Streaming Schedules**: Set up time-based rules for when streamers go live/offline
- **Multi-Platform**: Works with Twitch, YouTube, and any streaming platform

## 📖 Quick Start Guide

### **Basic Setup**
1. **Install the extension** in Firefox
2. **Click the Tab Refresher icon** in your toolbar
3. **Click "⚙️ Open Settings & Import/Export"** to access the full settings page
4. **Add URLs** (one per line) in the "URLs to Cycle Through" section
5. **Configure timing**:
   - **Long Wait Time**: How long to stay on the first tab (default: 5 minutes)
   - **Short Wait Time**: Time between tab switches (default: 10 seconds)
   - **Pre-Refresh Delay**: Wait time before refreshing each tab (default: 2 seconds)
6. **Click "💾 Save All Settings"** to save your configuration
7. **Return to popup** and click **"Start Cycle"** to begin

### **Quick Actions (Popup)**
The popup provides quick access to:
- **Start/Pause** the tab cycle
- **View current configuration** summary (URLs, rules, timing)
- **Quick Import from Clipboard** for fast JSON import
- **Open Settings** for full configuration

### **Advanced Configuration (Settings Page)**
Access via popup → "⚙️ Open Settings & Import/Export" for:
- **Full URL management**
- **Time-based rule creation**
- **Import/Export settings**
- **Advanced timing configuration**

### **Time-Based URL Rules**
Perfect for Twitch streamers or scheduled content:

1. **Open Settings page** from the popup
2. **Add your main URL** to the URL list (e.g., `https://www.twitch.tv/yourstreamer`)
3. **Scroll to "Time-Based URL Rules"** section
4. **Create a time rule**:
   - **Original URL**: The main channel URL
   - **Replacement URL**: Alternative URL (e.g., `https://www.twitch.tv/yourstreamer_24_7`)
   - **Active Time Range**: When to use the original URL (e.g., 15:00 to 00:00)
5. **Click "Add Time Rule"**
6. **Save settings** with "💾 Save All Settings"

**Example**: Stream is live 3 PM to midnight → show live channel. Outside those hours → show 24/7 channel.

## 🔧 Installation Methods

### **Option 1: Firefox Add-ons Store (AMO)**
*Coming soon - pending review*

### **Option 2: Self-Installation**
1. **Download the extension files**
2. **Create icons folder** with PNG icons (16x16, 24x24, 32x32, 48x48, 128x128)
3. **Package as XPI**:
   ```bash
   # Using web-ext (recommended)
   npm install -g web-ext
   web-ext build
   
   # Or manual ZIP
   zip -r tab-refresher.xpi manifest.json background.js popup.html popup.js options.html options.js icons/
   ```
4. **Install in Firefox**:
   - Go to `about:addons`
   - Click gear icon → "Install Add-on From File"
   - Select your `.xpi` file

### **Option 3: Developer Mode**
1. **Download source files**
2. **Open Firefox** → `about:debugging`
3. **Click "This Firefox"**
4. **Load Temporary Add-on** → Select `manifest.json`

## 📁 File Structure

```
tab-refresher/
├── manifest.json          # Extension configuration (includes options_ui)
├── background.js          # Enhanced logic, storage, and tab management  
├── popup.html            # Simplified popup interface
├── popup.js              # Popup functionality and quick actions
├── options.html          # Full-featured settings page (NEW)
├── options.js            # Settings page logic and file operations (NEW)
├── icons/                # Extension icons (you need to create these)
│   ├── icon-16.png       # 16x16 pixel icon
│   ├── icon-24.png       # 24x24 pixel icon (NEW)
│   ├── icon-32.png       # 32x32 pixel icon
│   ├── icon-48.png       # 48x48 pixel icon
│   └── icon-128.png      # 128x128 pixel icon
└── README.md             # This documentation
```

## 💾 Settings Import/Export (Multiple Methods)

Version 1.2 introduces multiple ways to import/export settings:

### **Method 1: File Upload (Settings Page)**
1. **Open Settings** from popup
2. **Scroll to "Backup & Restore"** section
3. **Export**: Click "📤 Export Settings" to download JSON file
4. **Import**: Select JSON file using "Select a JSON settings file" input
5. **Click "📁 Import from File"**

### **Method 2: Paste Import (Settings Page)**
1. **Copy JSON content** from exported file
2. **Open Settings** from popup
3. **Scroll to "Backup & Restore"** section
4. **Paste content** into "Paste JSON content" text area
5. **Click "📋 Import from Paste"**

### **Method 3: Quick Clipboard Import (Popup)**
1. **Copy JSON settings** to clipboard
2. **Open popup**
3. **Click "📋 Quick Import from Clipboard"**
4. Settings automatically imported and applied

### **Why Multiple Methods?**
- **File Upload**: Most reliable for large configurations
- **Paste Import**: Works when file dialogs cause issues
- **Clipboard Import**: Fastest for quick sharing/testing

## 🎯 Configuration Examples

### **Twitch Streamer Monitoring**
```json
{
  "urls": ["https://www.twitch.tv/yourfavoritestreamer"],
  "longWait": 5,
  "shortWait": 30,
  "preRefresh": 3,
  "timeBasedRules": [
    {
      "originalUrl": "https://www.twitch.tv/yourfavoritestreamer",
      "replacementUrl": "https://www.twitch.tv/yourfavoritestreamer_24_7",
      "startTime": "15:00",
      "endTime": "00:00"
    }
  ]
}
```

```

## 🔄 User Interface Guide

### **Popup Interface** (Quick Controls)
- **Status Display**: Shows if cycling is running/stopped
- **Start/Pause Buttons**: Basic cycle control
- **Configuration Summary**: Quick view of URLs, rules, timing
- **Quick Import**: Fast clipboard-based import
- **Settings Access**: Opens full settings page

### **Settings Page Interface** (Full Configuration)
- **URL Management**: Add, edit, and organize URLs
- **Timing Configuration**: Detailed timing controls
- **Time-Based Rules**: Create and manage URL switching rules
- **Import/Export**: Multiple import methods and export options
- **Real-time Preview**: See which rules are currently active

### **Navigation Flow**
```
Popup (Quick Actions) 
    ↓ "Open Settings"
Settings Page (Full Configuration)
    ↓ Save & Return
Popup (Start Cycle)
```

## ⚙️ Technical Details

### **Architecture (v1.2)**
- **Popup**: Lightweight UI for quick actions and status
- **Options Page**: Full-featured settings with file operations
- **Background Script**: Centralized storage and tab management
- **Message Passing**: Clean communication between components

### **Permissions Explained**
- **`tabs`**: Required to create, switch between, and refresh tabs
- **`activeTab`**: Needed to activate specific tabs during cycling
- **`<all_urls>`**: Allows loading any website you specify
- **`notifications`**: Shows start/stop/error messages
- **`storage`**: Saves your settings and configurations

### **Browser Compatibility**
- **Firefox 75+**: Full compatibility with all features
- **Manifest V2**: Uses stable Manifest V2 format
- **Performance**: Optimized for minimal resource usage
- **File Operations**: Uses dedicated options page (Firefox requirement)

### **Privacy & Security**
- **No data collection**: Extension operates entirely locally
- **No external connections**: Only loads URLs you specify
- **No tracking**: Your browsing data never leaves your browser
- **Open source**: All code is reviewable and transparent

## 🔍 Troubleshooting

### **Common Issues**

**Import not working in popup**
- Use the Settings page for file import (popup file dialogs close in Firefox)
- Try Quick Clipboard Import instead
- Verify JSON format is valid

**Extension not starting**
- Check that at least one URL is configured
- Verify URLs are valid (include `http://` or `https://`)
- Open browser console for error messages

**Settings not saving**
- Use "💾 Save All Settings" button in Settings page
- Check browser storage permissions
- Try exporting settings as backup before changes

**URLs not loading**
- Ensure websites allow being loaded in tabs
- Some sites block automated access
- Check for redirects or login requirements

**Time rules not working**
- Verify time format is HH:MM (24-hour)
- Check that original URL matches exactly in URL list
- Ensure rule times don't conflict
- Check current time display in Settings page

### **Debug Mode**
Enable verbose logging:
1. **Open browser console**: F12 → Console tab
2. **Look for messages**: `[Popup]`, `[Options]`, `[Background]`
3. **Check extension pages**:
   - Right-click extension icon → Inspect (for popup)
   - Go to about:debugging → This Firefox → Inspect (for background)

### **Getting Help**
- **Check console logs** for detailed error messages
- **Try different import methods** if one fails
- **Export working config** before making changes
- **Restart extension** in about:addons if needed

## 🚀 Development

### **Contributing**
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Test both popup and options page**
4. **Submit pull request with detailed description**

### **Local Development**
```bash
# Install web-ext for testing
npm install -g web-ext

# Start development server
web-ext run

# Build for distribution  
web-ext build

# Lint code
web-ext lint
```

### **Testing Checklist**
- [ ] Popup opens and displays status correctly
- [ ] Settings page opens from popup
- [ ] All import methods work (file, paste, clipboard)
- [ ] Export downloads valid JSON
- [ ] Time rules activate/deactivate correctly
- [ ] Tab cycling works with various URL types
- [ ] Settings persist after browser restart

## 📄 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🤝 Support

- **Issues**: Report bugs or request features via GitHub issues
- **Documentation**: Check this README for comprehensive guidance
- **Community**: Share configurations and tips with other users

## 🔄 Version History

- **v1.2.0**: Major architecture refactor - Added dedicated options page, multiple import methods, enhanced UI separation, fixed Firefox popup file input issues
- **v1.1.0**: Added time-based URL switching, settings export/import, improved error handling
- **v1.0.0**: Initial release with basic tab cycling functionality

---
