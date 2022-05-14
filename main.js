'use strict';

{
    const once = () => chrome.action.setBadgeBackgroundColor({
      color: '#f10e08'
    });
    chrome.runtime.onStartup.addListener(once);
    chrome.runtime.onInstalled.addListener(once);
  }

{
    const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
    if (navigator.webdriver !== true) {
      const page = getManifest().homepage_url;
      const {name, version} = getManifest();
      onInstalled.addListener(({reason, previousVersion}) => {
        management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
          'faqs': true,
          'last-update': 0
        }, prefs => {
          if (reason === 'install' || (prefs.faqs && reason === 'update')) {
            const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
            if (doUpdate && previousVersion !== version) {
              tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
                url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
                active: reason === 'install',
                ...(tbs && tbs.length && {index: tbs[0].index + 1})
              }));
              storage.local.set({'last-update': Date.now()});
            }
          }
        }));
      });
      setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
    }
}





const sorting = (y, x) => {
    if (y.paused === false && x.paused) {
      return -1;
    }
    else if (x.paused === false && y.paused) {
      return 1;
    }
    else if (y.connected === false && x.connected) {
      return -1;
    }
    else if (x.connected === false && y.connected) {
      return 1;
    }
    else {
      return y.frameId - x.frameId;
    }
  };

const onMessage = (request, sender) => {
    if (request.method === 'playing') {
      chrome.action.setIcon({
        tabId: sender.tab.id,
        path: {
          '16': 'options/img/16.png',
          '32': 'options/img/32.png',
          '48': 'options/img/64.png'
        }
      });
    }
  };
  chrome.runtime.onMessage.addListener(onMessage);

  chrome.action.onClicked.addListener(async tab => {
    try {
      const r = await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true
        },
        func: () => {
          const es = new Set();
          
          if (typeof videos === 'object') {
            [...videos].forEach(v => es.add(v));
          }
          [...document.querySelectorAll('video')].forEach(v => es.add(v));
          
          return Array.from(es).map(e => ({
            paused: e.paused,
            connected: e.isConnected
          }));
        }
      });
      const video = (r || []).map(o => o.result.map(v => {
        v.frameId = o.frameId;
        return v;
      })).flat().sort(sorting).shift();
  
      if (video) {
        
        onMessage({
          method: 'playing'
        }, {
          tab
        });
        
        await chrome.scripting.executeScript({
          target: {
            tabId: tab.id,
            frameIds: [video.frameId]
          },
          func: () => {
            
            const es = new Set();
            
            if (typeof videos === 'object') {
              [...videos].forEach(v => es.add(v));
            }
            [...document.querySelectorAll('video')].forEach(v => es.add(v));
            //
            const sorting = (y, x) => {
              if (y.paused === false && x.paused) {
                return -1;
              }
              else if (x.paused === false && y.paused) {
                return 1;
              }
              else if (y.connected === false && x.connected) {
                return -1;
              }
              else if (x.connected === false && y.connected) {
                return 1;
              }
            };
            const video = [...es].sort(sorting).shift();
            if (video) {
              video.requestPictureInPicture().catch(e => alert(e.message));
            }
          }
        });
      }
      else {
        throw Error('No player is detected');
      }
    }
    catch (f) {
      console.warn(f);
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: 'F'
      });
      chrome.action.setTitle({
        tabId: tab.id,
        title: f.message
      });
    }
});