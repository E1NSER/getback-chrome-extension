# adfocus TAG Tool Chrome Extension

A Chrome extension designed to help check adfocus technology integrations and analyze network requests for Getback services.

## Features

- Track and analyze network requests to Getback domains
- Toggle between production and development environments
- Inject Getback scripts with custom IDs
- Control script loading with configurable delays
- Analyze network traffic with detailed request logging

## Installation

### From Source
1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

## Usage

### Basic Controls
- **Toggle Network**: Enable/disable network request monitoring
- **Toggle Dev**: Switch between development and production environments
- **Inject Getback**: Insert custom Getback scripts with specified IDs
- **Delay load**: Set a delay (in milliseconds) before loading scripts
- **Enable Analyzer**: Turn on detailed network traffic analysis

### Workflow
1. Navigate to the page you want to analyze
2. Click the extension icon to open the popup
3. Configure the desired settings
4. Click "Save & Reload" to apply changes and refresh the page
5. View the analysis results in the extension popup

## Permissions

This extension requires the following permissions:
- `activeTab`: To interact with the current tab
- `storage`: To save your settings
- `webRequest`: To monitor network requests
- `declarativeNetRequest`: To modify or block requests (when in dev mode)

## Development

The extension is built with:
- JavaScript
- jQuery
- Bootstrap

Key files:
- `manifest.json`: Extension configuration
- `popup.html` & `popup.js`: User interface
- `service-worker.js`: Background processes
- `content.js`: Content script injected into web pages
- `rules.json`: Network request rules for dev mode

## Version

Current version: 1.2.3 