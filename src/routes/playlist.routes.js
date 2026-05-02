import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
  getUserPlaylists,
  getPlaylistById,

} from "../controller/playlist.controler.js"

const router = Router()

// Run middleware for every router. 
router.use(verifyJWT)

router.route("/create-playlist").post( createPlaylist)
router.route("/add-video-playlist/:playlistId/video/:videoId").post( addVideoToPlaylist)
router.route("/remove-video-playlist/:playlistId/video/:videoId").delete( removeVideoFromPlaylist)
router.route("/update-video-playlist/:playlistId").patch( updatePlaylist)
router.route("/delete-video-playlist/:playlistId").delete( deletePlaylist)
router.route("/get-playlists/:userId").get( getUserPlaylists)
router.route("/get-playlist/:playlistId").get( getPlaylistById)


export default router