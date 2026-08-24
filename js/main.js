document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');

    var videoPlayer = document.getElementById('videoPlayer');
    var channels = [
        { name: 'Channel 1', url: 'add your m3u8 link here' },//add your channel name and links
        { name: 'Channel 2', url: 'add your m3u8 link here' },
        { name: 'Channel 3', url: 'add your m3u8 link here' }
        
        
    ];
    var currentChannelIndex = 0;
    var hls = null; // reuse one Hls instance so switching channels tears down the previous stream
        
    tizen.tvinputdevice.registerKey('ChannelUp');
    tizen.tvinputdevice.registerKey('ChannelDown');

    function loadChannel(index) {
        // Tear down the previous stream first. Without this, a fresh Hls() attaches to the same
        // <video> element while the old instance still owns it, so every channel keeps playing the
        // first stream that was ever loaded.
        if (hls) {
            hls.destroy();
            hls = null;
        }
        videoPlayer.removeAttribute('src');
        videoPlayer.load();

        if (Hls.isSupported()) {
            console.log('HLS.js is supported');
            hls = new Hls();
            hls.loadSource(channels[index].url);
            hls.attachMedia(videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log('HLS manifest parsed');
                videoPlayer.play();
            });
            hls.on(Hls.Events.ERROR, function(event, data) {
                console.error('HLS.js error:', data);
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('Native HLS support detected');
            videoPlayer.src = channels[index].url;
            videoPlayer.addEventListener('loadedmetadata', function() {
                console.log('Video metadata loaded');
                videoPlayer.play();
            });
            videoPlayer.addEventListener('error', function(event) {
                console.error('Video player error:', event);
            });
        } else {
            console.error('HLS is not supported in this browser.');
            alert('HLS is not supported in this browser. Please use a compatible browser.');
        }

        // Display the channel banner
        showChannelBanner(channels[index].name);
    }

    var bannerTimer = null;
    function showChannelBanner(channelName) {
        var banner = document.getElementById('channelBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'channelBanner';
            // Sized to the title, not the full width of the screen, so it no longer covers subtitles or
            // a channel's own on-screen overlays (e.g. news tickers).
            banner.style.position = 'absolute';
            banner.style.bottom = '8%';
            banner.style.left = '40px';
            banner.style.maxWidth = '80%';
            banner.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
            banner.style.color = 'white';
            banner.style.fontSize = '30px';
            banner.style.fontFamily = 'Helvetica Neue, sans-serif';
            banner.style.padding = '8px 22px';
            banner.style.borderRadius = '8px';
            banner.style.boxSizing = 'border-box';
            banner.style.zIndex = '1000';
            document.body.appendChild(banner);
        }
        banner.textContent = channelName;
        banner.style.display = 'inline-block';

        if (bannerTimer) clearTimeout(bannerTimer);
        bannerTimer = setTimeout(function() {
            banner.style.display = 'none';
        }, 6000);
    }

    // High-contrast exit prompt. The native confirm() renders black-on-dark on some Samsung TVs
    // (Tizen 5.5 on The Frame), leaving the text unreadable — so draw our own dialog instead.
    function confirmExit() {
        if (document.getElementById('exitDialog')) return;

        var overlay = document.createElement('div');
        overlay.id = 'exitDialog';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2000;' +
            'display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1f1f1f;color:#ffffff;padding:32px 44px;border-radius:14px;' +
            'font-family:Helvetica Neue, sans-serif;font-size:30px;text-align:center;' +
            'box-shadow:0 8px 28px rgba(0,0,0,0.55);max-width:70%;';
        box.innerHTML = 'Are you sure you want to exit TVapp?' +
            '<div style="margin-top:18px;font-size:20px;opacity:0.75;">OK / Enter to exit &nbsp;·&nbsp; Back to cancel</div>';

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        function cleanup() {
            document.removeEventListener('keydown', onKey, true);
            overlay.remove();
        }
        function onKey(e) {
            e.stopPropagation(); // don't let channel navigation run behind the dialog
            var k = e.keyCode;
            if (e.key === 'Enter' || k === 13) {
                cleanup();
                tizen.application.getCurrentApplication().exit();
            } else if (e.key === 'Back' || k === 10009 || k === 27) {
                e.preventDefault();
                cleanup();
            }
        }
        document.addEventListener('keydown', onKey, true); // capture: run before the main handler
    }

    loadChannel(currentChannelIndex);

    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'ArrowUp':
                currentChannelIndex = (currentChannelIndex + 1) % channels.length;
                loadChannel(currentChannelIndex);
                break;
            case 'ArrowDown':
                currentChannelIndex = (currentChannelIndex - 1 + channels.length) % channels.length;
                loadChannel(currentChannelIndex);
                break;
            case 'Back': // Back button on Samsung TV remotes
                confirmExit();
                break;
            default:
                switch (event.keyCode) {
                    case 38: // Arrow Up
                    case 427: // CH_UP button
                        currentChannelIndex = (currentChannelIndex + 1) % channels.length;
                        loadChannel(currentChannelIndex);
                        break;
                    case 40: // Arrow Down
                    case 428: // CH_DOWN button
                        currentChannelIndex = (currentChannelIndex - 1 + channels.length) % channels.length;
                        loadChannel(currentChannelIndex);
                        break;
                    case 10009: // RETURN button on Samsung TV remotes
                        confirmExit();
                }
        }
    });
});
