import {storage} from '/js/store.js';
import {didaApi} from '/js/didaapi.js';
import {oneClickDida, getSelectionInfo} from '/js/oneclickdida.js';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('Registration successful, scope is:', registration.scope);
    })
    .catch(function(error) {
      console.log('Service worker registration failed, error:', error);
    });
}

//////////////////
// Event Handlers
//////////////////


self.addEventListener('install', function(event) {
    // currently unused
});


// add context menu items
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: 'OneClickDida',
        title: "发送页面到滴答清单",
        contexts: ["page", "frame", "link", "editable", "video", "audio", "browser_action", "page_action", "image"]}
    );
    chrome.contextMenus.create({
        id: 'OneClickDida' + 'Selection',
        title: "发送选择到滴答清单",
        contexts: ["selection"]}
    );
});


// handle extension button click
chrome.action.onClicked.addListener(function(tab) {
    oneClickDida(tab);    
});


// listen to context menu
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == 'OneClickDida' + 'Selection') {
        getSelectionInfo(info, tab, function(selection) {
            info.selectionText = selection;
            oneClickDida(tab, info);
        });
    } else if (info.menuItemId.startsWith('OneClickDida')) {
        oneClickDida(tab, info);
    }
});


// communication with options page
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'task') {
        oneClickDida(message.payload)
    } else if (message.type === 'login') {
        didaApi.login().then(sendResponse);
    } else if (message.type === 'logout') {
        didaApi.logout().then(sendResponse);
    } else if (message.type === 'getOptions') {
        storage.loadOptions().then(opts => {
            sendResponse(opts);
        });
    } else if (message.type === 'setOptions') {
        console.log("setOptions:", message.payload)
        storage.set(message.payload);
    } else if (message.type === 'isLoggedIn') {
        didaApi.authorized().then(response => {
            sendResponse(response);
        });
    } else {
        console.log("Unrecognized message:", message, sender);
    }

    return true;
});