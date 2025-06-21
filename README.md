# Tab Refresher - Firefox Extension

**Automatically refresh multiple tabs in a cycle with time-based URL switching**

Perfect for monitoring dashboards, live streams, Twitch streaming schedules, or any websites requiring regular updates. Features customizable timing controls, intelligent time-based URL switching, and comprehensive settings backup/restore.

## 🚀 Features

### **Core Functionality**
- **Automatic Tab Cycling**: Continuously refresh multiple tabs in sequence
- **Time-Based URL Switching**: Automatically switch between URLs based on schedules
- **Customizable Timing**: Configure wait times and refresh delays to your needs
- **Settings Backup/Restore**: Export and import your configurations
- **Smart Notifications**: Get notified when cycles start, stop, or encounter issues

### **Perfect for Streamers Watchers**
- **Twitch Integration**: Automatically switch between live channels and 24/7 streams
- **Streaming Schedules**: Set up time-based rules for when streamers go live/offline
- **Multi-Platform**: Works with Twitch, YouTube, and any streaming platform


## 📖 Quick Start Guide

### **Basic Setup**
1. **Install the extension** in Firefox
2. **Click the Tab Refresher icon** in your toolbar
3. **Add URLs** (one per line) in the "URLs to Cycle Through" section
4. **Configure timing**:
    - **Long Wait Time**: How long to stay on the first tab (default: 5 minutes)
    - **Short Wait Time**: Time between tab switches (default: 10 seconds)
    - **Pre-Refresh Delay**: Wait time before refreshing each tab (default: 2 seconds)
5. **Click "Start New Cycle"** to begin

### **Advanced: Time-Based URL Rules**
Perfect for Twitch streamers or scheduled content:

1. **Add your main URL** to the URL list (e.g., `https://www.twitch.tv/yourstreamer`)
2. **Create a time rule**:
    - **Original URL**: The main channel URL
    - **Replacement URL**: Alternative URL (e.g., `https://www.twitch.tv/yourstreamer_24_7`)
    - **Active Time Range**: When to use the original URL (e.g., 15:00 to 00:00)

**Example**: Stream is live 3 PM to midnight → show live channel. Outside those hours → show 24/7 channel.

## 🔧 Installation Methods

### **Option 1: Firefox Add-ons Store (AMO)**
*Maybe *

### **Option 2: Self-Installation**
1. **Download the extension files**
2. **Create icons folder** with PNG icons (16x16, 32x32, 48x48, 128x128)
3. **Package as XPI**:
   ```bash
   # Using web-ext (recommended)
   npm install -g web-ext
   web-ext build
   
   # Or manual ZIP
   zip -r tab-refresher.xpi manifest.json background.js popup.html popup.js icons/
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
├── manifest.json          # Extension configuration
├── background.js          # Main logic and tab management
├── popup.html            # User interface
├── popup.js              # UI functionality and settings
├── icons/                # Extension icons (you need to create these)
│   ├── icon-16.png       # 16x16 pixel icon
│   ├── icon-32.png       # 32x32 pixel icon
│   ├── icon-48.png       # 48x48 pixel icon
│   └── icon-128.png      # 128x128 pixel icon
└── README.md             # This documentation
```

## 🎯 Configuration Examples

### **Twitch Streamer Monitoring**
```
Main URLs:
https://www.twitch.tv/yourfavoritestreamer

Time-Based Rule:
- Original: https://www.twitch.tv/yourfavoritestreamer
- Replacement: https://www.twitch.tv/yourfavoritestreamer_24_7
- Active Time: 15:00 to 00:00

Timing:
- Long Wait: 5 minutes
- Short Wait: 30 seconds
- Pre-Refresh: 3 seconds
```

### **Business Dashboard Monitoring**
```
URLs:
https://analytics.yourcompany.com/dashboard
https://status.yourcompany.com
https://sales.yourcompany.com/metrics

Timing:
- Long Wait: 2 minutes
- Short Wait: 5 seconds
- Pre-Refresh: 1 second
```

### **News Monitoring**
```
URLs:
https://news.ycombinator.com
https://www.reddit.com/r/technology
https://techcrunch.com

Timing:
- Long Wait: 10 minutes
- Short Wait: 15 seconds
- Pre-Refresh: 2 seconds
```

## ⚙️ Settings Backup & Restore

### **Export Settings**
- Click **"Export Settings"** to download a JSON file
- Contains all URLs, timing settings, and time-based rules
- Filename includes timestamp for easy organization

### **Import Settings**
- Click **"Import Settings"** and select a JSON file
- Validates all settings before applying
- Replaces current configuration completely

### **Share Configurations**
Perfect for teams or multiple setups:
- Export your work dashboard configuration
- Share with colleagues
- Import gaming/streaming setups

## 🛠️ Technical Details

### **Permissions Explained**
- **`tabs`**: Required to create, switch between, and refresh tabs
- **`activeTab`**: Needed to activate specific tabs during cycling
- **`<all_urls>`**: Allows loading any website you specify
- **`notifications`**: Shows start/stop/error messages
- **`storage`**: Saves your settings and configurations

### **Browser Compatibility**
- **Firefox 75+**: Full compatibility
- **Manifest V2**: Uses stable Manifest V2 (no plans to deprecate)
- **Performance**: Optimized for minimal resource usage

### **Privacy & Security**
- **No data collection**: Extension operates entirely locally
- **No external connections**: Only loads URLs you specify
- **No tracking**: Your browsing data never leaves your browser
- **Open source**: All code is reviewable and transparent

## 🔍 Troubleshooting

### **Common Issues**

**Extension not starting**
- Check that at least one URL is configured
- Verify URLs are valid (include `http://` or `https://`)
- Check browser console for error messages

**URLs not loading**
- Ensure websites allow being loaded in tabs
- Some sites block automated access
- Check for redirects or login requirements

**Time rules not working**
- Verify time format is HH:MM (24-hour)
- Check that original URL matches exactly
- Ensure rule times don't conflict

**Settings not saving**
- Check browser storage permissions
- Try restarting the extension
- Export settings as backup before changes

### **Debug Mode**
Enable verbose logging by opening browser console:
1. **Right-click extension icon** → Inspect
2. **Go to Console tab**
3. **Look for `[Tab Refresher]` messages**

## 🚀 Development

### **Contributing**
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes and test thoroughly**
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

### **Release Process**
1. **Update version** in `manifest.json`
2. **Test all functionality**
3. **Create release build**: `web-ext build`
4. **Submit to AMO** or distribute privately

## 📄 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🤝 Support

- **Issues**: Report bugs or request features via GitHub issues
- **Documentation**: Check this README for comprehensive guidance
- **Community**: Share configurations and tips with other users

## 🔄 Version History

- **v1.1.0**: Added time-based URL switching, settings export/import, improved error handling
- **v1.0.0**: Initial release with basic tab cycling functionality

---
