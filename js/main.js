document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');

    var videoPlayer = document.getElementById('videoPlayer');
    var channels = [
        { name: 'Channel 1', url: 'add your m3u8 link here' },//add your channel name and links
        { name: 'Channel 2', url: 'add your m3u8 link here' },
        { name: 'Channel 3', url: 'add your m3u8 link here' }
        
        
    ];
    var currentChannelIndex = 0;

    function loadChannel(index) {
        if (Hls.isSupported()) {
            console.log('HLS.js is supported');
            var hls = new Hls();
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

    function showChannelBanner(channelName) {
        var banner = document.getElementById('channelBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'channelBanner';
            banner.style.position = 'absolute';
            banner.style.bottom = '0';
            banner.style.left = '0';
            banner.style.width = '100%';
            banner.style.height = '15%';
            banner.style.backgroundColor = 'rgba(0, 0, 0, 1)';
            banner.style.color = 'white';
            banner.style.fontSize = '30px'; // Increase font size
            banner.style.fontFamily = 'Helvetiva Neue, sans-serif';
            banner.style.padding = '10px';
            banner.style.boxSizing = 'border-box';
            banner.style.zIndex = '1000';
            banner.style.display = 'flex';
            banner.style.alignItems = 'center';
            banner.style.paddingBottom = '10px';
            document.body.appendChild(banner);
        }
        banner.innerHTML = `<span style="margin-left: 50px;">${channelName}</span>`;
        banner.style.display = 'block';

        
        setTimeout(function() {
            banner.style.display = 'none';
        }, 6000);
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
                if (confirm('Are you sure you want to exit TVapp?')) {
                    tizen.application.getCurrentApplication().exit();
                }
                break;
            default:
                switch (event.keyCode) {
                    case 427: // CH_UP button
                        currentChannelIndex = (currentChannelIndex + 1) % channels.length;
                        loadChannel(currentChannelIndex);
                        break;
                    case 428: // CH_DOWN button
                        currentChannelIndex = (currentChannelIndex - 1 + channels.length) % channels.length;
                        loadChannel(currentChannelIndex);
                        break;
                    case 10009: // CH_DOWN button
                    	if (confirm('Are you sure you want to exit the TVapp?')) {
                            tizen.application.getCurrentApplication().exit();
                        }
                }
        }
    });
});
