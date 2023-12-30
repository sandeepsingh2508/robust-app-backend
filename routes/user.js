const {
  signUp,
  logIn,
  getAnyUserDetails,
  updateAnyUserDetails,
  deleteAnyUser,
  getOwnDetails,
  updateOwnDetails,
  deleteOwnDetails,
  getAllUsers,
  updateRole,
} = require("../controllers/user");

const { isAuthorized, authorizeRoles } = require("../middlewares/auth");

const { upload } = require("../utils/multer");
const router = require("express").Router();

router.post("/signup", upload.array("profile"), signUp);
router.post("/login", logIn);
router.get(
  "/getanyuserdetails/:userId",
  isAuthorized,
  authorizeRoles("admin"),
  getAnyUserDetails
);
router.put(
  "/updateanyuserdetails/:userId",
  isAuthorized,
  authorizeRoles("admin"),
  upload.array("profile"),
  updateAnyUserDetails
);
router.delete(
  "/deleteanyuser/:userId",
  isAuthorized,
  authorizeRoles("admin"),
  deleteAnyUser
);
router.get("/getallusers", isAuthorized, authorizeRoles("admin"), getAllUsers);
router.get("/getowndetails", isAuthorized, getOwnDetails);
router.put("/updateowndetails", isAuthorized, upload.array("profile"), updateOwnDetails);
router.delete("/deleteowndetails", isAuthorized, deleteOwnDetails);
router.put("/updaterole", isAuthorized, updateRole);
module.exports = router;
