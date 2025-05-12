import { Box, Typography, Container } from "@mui/material";
import VideoPlayer from "../components/VideoPlayer";
import { links } from "../data/links";

function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          py: 4,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          YouTube Video Collection
        </Typography>

        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          A curated collection of YouTube video segments
        </Typography>

        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <VideoPlayer videos={links} />
        </Box>
      </Box>
    </Container>
  );
}

export default Home;
