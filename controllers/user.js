const userDB = require("../models/user");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const response = require("../middlewares/responseMiddleware");
const jwt = require("../utils/jwt");
const path = require("path");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const sharp = require("sharp");
const tempDir = require("os").tmpdir();

const signUp = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    if (!name || !email || !phone || !password) {
      return response.validationError(
        res,
        "Cannot create an account without proper information"
      );
    }

    const findUser = await userDB.findOne({ email: email.toLowerCase() });

    if (findUser) {
      return response.errorResponse(res, "User Already exists. Login", 400);
    }
    const hashPassword = await bcrypt.hash(password, 10);

    //upload profile
    if (!req.files || !Array.isArray(req.files)) {
      return response.validationError(res, "No valid files provided");
    }
    const uploadedImage = await Promise.all(
      req.files.map(async (file) => {
        const changedFileName = `${uuidv4()}-${file.originalname
          .split(" ")
          .join("-")}`;
        const filePath = path.join(tempDir, changedFileName);

        await sharp(file.buffer).resize(1024, 1024).toFile(filePath);
        const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
          folder: "User",
        });

        // Delete the local image
        fs.unlinkSync(filePath);

        return {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url,
        };
      })
    );

    const [displayProfile] = uploadedImage;
    const newUser = await new userDB({
      name,
      password: hashPassword,
      email: email.toLowerCase(),
      phone,
      profile: displayProfile,
    }).save();

    const token = jwt(newUser._id);
    const result = {
      user: newUser,
      token: token,
    };
    response.successResponse(res, result, "Successfully saved the user");
  } catch (error) {
    console.error(error);
    response.internalServerError(res, error.message || "Internal server error");
  }
};

const logIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return response.validationError(
        res,
        "Cannot login without proper information"
      );
    }
    const findUser = await userDB.findOne({ email: email.toLowerCase() });
    if (!findUser) {
      response.notFoundError(res, "Cannot find the user");
    }
    const comparePassword = await bcrypt.compare(password, findUser.password);
    if (comparePassword) {
      const token = jwt(findUser._id);
      const result = {
        user: findUser,
        token: token,
      };
      response.successResponse(res, result, "Login successful");
    } else {
      response.errorResponse(res, "Password incorrect", 400);
    }
  } catch (error) {
    console.log(error);
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For admin only
const getAnyUserDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    if (userId === ":userId" || !userId) {
      return response.validationError(
        res,
        "Parameters not enough for getting user"
      );
    }
    const findUser = await userDB.findById({ _id: userId });
    if (!findUser) {
      return response.notFoundError(res, "Cannot find user");
    }
    response.successResponse(res, findUser, "Successfully retrieved all users");
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For admin only
const updateAnyUserDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    if (userId === ":ownerid" || !userId) {
      return response.validationError(
        res,
        "Parameters not enough for getting user"
      );
    }
    const findUser = await userDB.findById({ _id: userId });
    if (!findUser) {
      return response.notFoundError(res, "Cannot find user");
    }

    if (!req.files || !Array.isArray(req.files)) {
      return response.validationError(res, "No valid files provided");
    }
    const uploadedImage = await Promise.all(
      req.files.map(async (file) => {
        const changedFileName = `${uuidv4()}-${file.originalname
          .split(" ")
          .join("-")}`;
        const filePath = path.join(tempDir, changedFileName);

        await sharp(file.buffer).resize(1024, 1024).toFile(filePath);
        const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
          folder: "User",
        });

        // Delete the local image
        fs.unlinkSync(filePath);

        return {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url,
        };
      })
    );

    const [displayProfile] = uploadedImage;

    const updatedData = {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.profile && { profile: displayProfile }),
    };
    const updatedUser = await userDB.findByIdAndUpdate(
      { _id: findUser._id },
      updatedData,
      { new: true }
    );
    response.successResponse(
      res,
      updatedUser,
      "Successfully updated the user details"
    );
  } catch (error) {
    console.log(error);
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For admin only
const deleteAnyUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (userId === ":userId" || !userId) {
      return response.validationError(
        res,
        "Parameters not enough for getting user"
      );
    }
    const findUser = await userDB.findById({ _id: userId });
    if (!findUser) {
      return response.notFoundError(res, "Cannot find user");
    }
    const deletedUser = await userDB.findByIdAndDelete({ _id: userId });
    if (!deletedUser) {
      return response.internalServerError(res, "User not deleted");
    }
    response.successResponse(res, deletedUser, "Successfully deleted user");
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For User
const getOwnDetails = async (req, res) => {
  try {
    const findDetails = await userDB.findById({ _id: req.decoded.id });
    if (!findDetails) {
      return response.notFoundError(res, "Cannot find user details");
    }
    response.successResponse(
      res,
      findDetails,
      "Successfully find the own details"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For user
const updateOwnDetails = async (req, res) => {
  try {
    const findUser = await userDB.findOne({ _id: req.decoded.id });
    if (!findUser) {
      return response.notFoundError(res, "Cannot find user");
    }

    const uploadedImage = await Promise.all(
      req.files.map(async (file) => {
        const changedFileName = `${uuidv4()}-${file.originalname
          .split(" ")
          .join("-")}`;
        const filePath = path.join(tempDir, changedFileName);

        await sharp(file.buffer).resize(1024, 1024).toFile(filePath);
        const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
          folder: "User",
        });

        // Delete the local image
        fs.unlinkSync(filePath);

        return {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url,
        };
      })
    );

    const [displayProfile] = uploadedImage;

    const updatedData = {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.profile && { profile: displayProfile }),
    };
    const updatedUser = await userDB.findByIdAndUpdate(
      { _id: findUser._id },
      updatedData,
      {
        new: true,
      }
    );
    response.successResponse(
      res,
      updatedUser,
      "Successfully updated the own details"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For user
const deleteOwnDetails = async (req, res) => {
  try {
    const findUser = await userDB.findOne({_id:req.decoded.id });
    if (!findUser) {
      return response.notFoundError(res, "Cannot find user");
    }
    const deletedUser = await userDB.findByIdAndDelete({ _id:findUser._id });
    if (!deletedUser) {
      return response.internalServerError(res, "Cannot delete user");
    }
    response.successResponse(
      res,
      deletedUser,
      "Successfully deleted user details"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

//For user
const getAllUsers = async (req, res) => {
  try {
    const users = await userDB.find({});
    if (!users) {
      return response.internalServerError(res, "User not found");
    }
    response.successResponse(res, users, "Successfully retrieved all users");
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

const updateRole = async (req, res) => {
  const { role } = req.body;
  try {
    const findUser = await userDB.findById({ _id: req.decoded.id });
    if (!findUser) {
      return response.notFoundError(res, "Cannot find user");
    }
    const updatedUser = await userDB.findByIdAndUpdate(
      { _id: findUser._id },
      { $set: { role: role } },
      { new: true }
    );
    if (!updatedUser) {
      return response.internalServerError(res, "Role has not updated");
    }
    response.successResponse(
      res,
      updatedUser,
      "Successfully updated the user details"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};

module.exports = {
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
};
