import { useEffect, useRef, useState } from "react";
import { Box, Paper, Typography, IconButton, Button } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

// Global flag to track if API is being loading
let isApiLoading = false;
let apiReadyCallbacks = [];

// Function to load YouTube API once
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (isApiLoading) {
    return new Promise((resolve) => {
      apiReadyCallbacks.push(resolve);
    });
  }

  isApiLoading = true;
  return new Promise((resolve) => {
    apiReadyCallbacks.push(resolve);
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      isApiLoading = false;
      apiReadyCallbacks.forEach((callback) => callback());
      apiReadyCallbacks = [];
    };
  });
};

const VideoPlayer = ({ videos, initialIndex = 0 }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const currentVideo = videos[currentIndex];

  const getVideoId = (url) => {
    if (url.includes("youtu.be")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }
    if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(new URL(url).search);
      return urlParams.get("v");
    }
    return null;
  };

  const loadVideo = (index) => {
    if (!playerRef.current || !isPlayerReady) return;

    const video = videos[index];
    const videoId = getVideoId(video.link);

    if (videoId) {
      playerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: video.start,
        endSeconds: video.end,
      });
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      loadVideo(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      loadVideo(currentIndex + 1);
    }
  };

  // Add new function to handle video looping
  const handleVideoLoop = () => {
    if (!playerRef.current || !isPlayerReady) return;

    const currentTime = playerRef.current.getCurrentTime();
    const video = videos[currentIndex];

    if (currentTime >= video.end) {
      playerRef.current.seekTo(video.start);
      playerRef.current.playVideo();
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeUpdateInterval;

    const initializePlayer = async () => {
      try {
        await loadYouTubeAPI();

        if (!mounted) return;

        const videoId = getVideoId(currentVideo.link);
        if (!videoId) {
          console.error("Invalid YouTube URL:", currentVideo.link);
          return;
        }

        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = containerWidth * (9 / 16);

        playerRef.current = new window.YT.Player(container, {
          height: containerHeight,
          width: containerWidth,
          videoId: videoId,
          playerVars: {
            start: currentVideo.start,
            end: currentVideo.end,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            playsinline: 1,
            autoplay: 1,
            controls: 1,
            origin: window.location.origin,
            loop: 1,
          },
          events: {
            onReady: () => {
              if (!mounted) return;
              console.log("Player ready");
              setIsPlayerReady(true);

              // Start checking for video loop
              timeUpdateInterval = setInterval(() => {
                if (mounted && playerRef.current) {
                  handleVideoLoop();
                }
              }, 1000);
            },
            onStateChange: (event) => {
              if (!mounted) return;

              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  break;
                case window.YT.PlayerState.PAUSED:
                  break;
                case window.YT.PlayerState.ENDED:
                  // Instead of auto-advancing, loop the current video
                  playerRef.current.seekTo(currentVideo.start);
                  playerRef.current.playVideo();
                  break;
              }
            },
            onError: (event) => {
              console.error("Player error:", event.data);
            },
          },
        });
      } catch (error) {
        console.error("Error creating player:", error);
      }
    };

    initializePlayer();

    return () => {
      mounted = false;
      setIsPlayerReady(false);
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 }, mb: 3, width: "100%" }}>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}
      >
        {/* Previous button */}
        <IconButton
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": { bgcolor: "action.hover" },
            "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
            width: { xs: 36, sm: 48 },
            height: { xs: 36, sm: 48 },
            minWidth: { xs: 36, sm: 48 },
          }}
        >
          <NavigateBeforeIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
        </IconButton>

        {/* Video player */}
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            aspectRatio: "16/9",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: "40vh", sm: "50vh", md: "60vh" },
            maxHeight: { xs: "50vh", sm: "60vh", md: "70vh" },
            "& > div": {
              width: "100% !important",
              height: "100% !important",
              "& iframe": {
                width: "100% !important",
                height: "100% !important",
                border: "none",
              },
            },
          }}
        />

        {/* Next button */}
        <IconButton
          onClick={handleNext}
          disabled={currentIndex === videos.length - 1}
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": { bgcolor: "action.hover" },
            "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
            width: { xs: 36, sm: 48 },
            height: { xs: 36, sm: 48 },
            minWidth: { xs: 36, sm: 48 },
          }}
        >
          <NavigateNextIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
        </IconButton>
      </Box>

      {/* Video info and progress */}
      <Box
        sx={{
          mt: { xs: 1, sm: 2 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 0.5, sm: 0 },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Video {currentIndex + 1} of {videos.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start: {currentVideo.start}s | End: {currentVideo.end}s
        </Typography>
      </Box>
    </Paper>
  );
};

export default VideoPlayer;
