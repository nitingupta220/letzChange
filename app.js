var app = angular.module('youtubePlayer', []);

app.run(function () {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

app.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.controller('youtubePlayerController', function ($scope, $http, $window, $log, VideosService) {
    'use strict';

    init();

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.videos = VideosService.getVideos();
//        $scope.history = VideosService.getHistory();
        $scope.playlist = true;
    }


//    $scope.addVideo = function (url) {
//        $scope.videos.push({
//            url: $scope.videoInput
//        });
//        $scope.videoInput = '';
//    };
    
    
    $scope.search = function (isNewQuery) {
        $scope.loading = true;
        $http.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    key: 'AIzaSyBh5MnjkpY2a2Z6tgT4_jqauH7Za2w4Sc4',
                    type: 'video',
                    maxResults: '10',
                    pageToken: isNewQuery ? '' : $scope.nextPageToken,
                    part: 'id,snippet',
                    fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle,nextPageToken',
                    q: this.query
                }
            })
            .then(function (data) {
                //                console.log(data.data.items[0].snippet.title);
                var results = data.data.items[0].snippet.title;
                console.log(results);
                if (data.data.items.length) {
                    $scope.label = 'No results were found!';
                }
                VideosService.listResults(data, $scope.nextPageToken && !isNewQuery);
                $scope.nextPageToken = data.nextPageToken;
                $log.info(data);
            }), (function () {
                $log.info('Search error');
            }), (function () {
                $scope.loadMoreButton.stopSpin();
                $scope.loadMoreButton.setDisabled(false);
                $scope.loading = false;
            });
    };

    $scope.launch = function (video, archive) {
        VideosService.launchPlayer(video.id, video.title);
        if (archive) {
            VideosService.archiveVideo(video);
        }
        $log.info('Launched id:' + video.id + ' and title:' + video.title);
    };

    $scope.queue = function (id, title) {
        VideosService.queueVideo(id, title);
//        VideosService.deleteVideo($scope.history, id);
        $log.info('Queued id:' + id + ' and title:' + title);
    };
});


app.service('VideosService', ['$window', '$rootScope', '$log', function ($window, $rootScope, $log) {

    var service = this;

    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null,
        playerHeight: '100%',
        playerWidth: '100%',
        state: 'stopped'
    };

    var videos = [{
            id: 'kRJuY6ZDLPo',
            title: 'La Roux - In for the Kill (Twelves Remix)'
        },
        {
            id: '45YSGFctLws',
            title: 'Shout Out Louds - Illusions'
        }
        ];


    var results = [];
    var history = [];

    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        service.bindPlayer('placeholder');
        service.loadPlayer();
        $rootScope.$apply();
    };

    function onYoutubeStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            youtube.state = 'playing';
        } else if (event.data == YT.PlayerState.PAUSED) {
            youtube.state = 'paused';
        } else if (event.data == YT.PlayerState.ENDED) {
            youtube.state = 'ended';
            service.launchPlayer(videos[0].id, videos[0].title);
            service.archiveVideo(videos[0].id, videos[0].title);
//            service.deleteVideo(videos, videos[0].id);
        }
        $rootScope.$apply();
    }

    this.bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };

    this.createPlayer = function () {
        $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
        return new YT.Player(youtube.playerId, {
            height: youtube.playerHeight,
            width: youtube.playerWidth,
            playerVars: {
                rel: 0,
                showinfo: 0
            }
        });
    };

    this.loadPlayer = function () {
        if (youtube.ready && youtube.playerId) {
            if (youtube.player) {
                youtube.player.destroy();
            }
            youtube.player = service.createPlayer();
        }
    };

    this.launchPlayer = function (id, title) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        youtube.videoTitle = title;
        return youtube;
    }

    this.listResults = function (data, append) {
        if (!append) {
            results.length = 0;
        }
        for (var i = data.data.items.length - 1; i >= 0; i--) {
            results.push({
                id: data.data.items[i].id.videoId,
                title: data.data.items[i].snippet.title,
                description: data.data.items[i].snippet.description,
                thumbnail: data.data.items[i].snippet.thumbnails.default.url,
                author: data.data.items[i].snippet.channelTitle
            });
        }
        return results;
    }

    this.archiveVideo = function (video) {
        history.unshift(video);
        return history;
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };

//    this.getHistory = function () {
//        return history;
//    };

    this.getVideos = function () {
        return videos;
    };

    this.queueVideo = function (id, title) {
        videos.push({
            id: id,
            title: title
        });
        return videos;
    };

}]);

app.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        var video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);
