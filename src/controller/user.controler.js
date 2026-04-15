import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  // Validation of details | All details are correct or not, email format, any required fild is empty or not
  // Check is user already exsts ? by there unique identity like: username, email.
  // Check for images , Check for avatar (It's a required field)
  // If images are present, upload them to cloudinary 
  // Create user Object - create entry in db
  // remove password and refresh token field from response
  // check for user creation 
  // return response 

  // Get User Details
  const {fullName, username, password, email, avatar} = req.body
  console.log("Email: ",email);
  console.log("Password: ",password);
  console.log("Avatar: ",avatar);

  //Validation of details
  if( [fullName, username, password, email, avatar].some((item)=> item === "") ){
    throw new ApiError(400, "Required fields can't be empty.")
  }
  // if(!fullName.contains(" ")) throw new ApiError(400, "Full Name is required.");
  // if(!email.contains("@")) throw new ApiError(400, "Invalid emali.");

  //Checking User already exists or not
  const isExists = await User.findOne({
    $or:[
      { username },
      { email }
    ]
  })

  if(isExists) throw new ApiError(409, "Username or Email already exists.");

  // Checking for images , Checking for avatar
      // console.log("-------------------------------Multer req.body --------------------------------- \n ",req.body);
      // console.log("-------------------------------Multer req.files --------------------------------- \n ",req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //checking required image file avatar
  if(!avatarLocalPath) throw new ApiError(400, "Avatar image is required.");

  // Upload to cloudinary
  const avatarImage = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //Checking requird fild avatar
  if(!avatarImage) throw new ApiError(400, "Avatar file is empty.");

  // Create User Object
  const user =  await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatarImage.url,
    coverImage: coverImage?.url || "",
    password,
  })

  // Removed Password and RefreshToken field | User.findById(user._id) it find the user with the _id which db automatically add. ".select()" select all fields of user. "-password -refreshToken" means except this 2 select all others field.
  const createdUser = await User.findById(user._id).select(" -password -refreshToken");

  // Check user creation | Checking the entry is successfully registered in DB or not
  if(!createdUser) throw new ApiError(500, "User Registration Faild.");

  return res.status(201).json(new ApiResponse( 200, createdUser, "User Registration Successfull.", ))

})

export {registerUser};