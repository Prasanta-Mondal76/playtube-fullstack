import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Register User 
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
  const { fullName, username, password, email, avatar, coverImage } = req.body
  // console.log("Email: ",email);
  // console.log("Password: ",password);
  // console.log("Avatar: ",avatar);

  //Validation of details
  if ([fullName, username, password, email, avatar].some((item) => item === "")) {
    throw new ApiError(400, "Required fields can't be empty.")
  }

  if (!fullName.trim().includes(" ")) {
    throw new ApiError(400, "Please enter full name (first and last name)")
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format")
  }

  //Checking User already exists or not
  const isExists = await User.findOne({
    $or: [
      { username },
      { email }
    ]
  })

  if (isExists) throw new ApiError(409, "Username or Email already exists. Please login.");

  // Checking for images , Checking for avatar
  // console.log("-------------------------------Multer req.body --------------------------------- \n ",req.body);
  // console.log("-------------------------------Multer req.files --------------------------------- \n ",req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  //checking required image file avatar
  if (!avatarLocalPath) {
    if (coverImageLocalPath) fs.unlinkSync(coverImageLocalPath) //If avatar image is not present then remove the cover image from local storage if it is present
    throw new ApiError(400, "Avatar image is required.")
  }


  // Upload to cloudinary
  const avatarImage = await uploadOnCloudinary(avatarLocalPath);
  const coverImages = await uploadOnCloudinary(coverImageLocalPath);
  //Checking requird fild avatar
  if (!avatarImage) throw new ApiError(400, "Avatar file is empty.");

  // Create User Object
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatarImage.url,
    coverImage: coverImages?.url || "",
    password,
  })

  // Removed Password and RefreshToken field | User.findById(user._id) it find the user with the _id which db automatically add. ".select()" select all fields of user. "-password -refreshToken" means except this 2 select all others field.
  const createdUser = await User.findById(user._id).select(" -password -refreshToken");

  // Check user creation | Checking the entry is successfully registered in DB or not
  if (!createdUser) throw new ApiError(500, "User Registration Faild.");

  return res.status(201).json(new ApiResponse(200, createdUser, "User Registration Successfull.",))

})


// Login User
const loginUser = asyncHandler(async(req, res) => {
  // Get data from frontend or req.body
  // Validatiion of data | email or username and passowrd
  // Check user exist or not by email or username 
  // If user exist then compare password is correct or not | using bcryptjs
  // If password is correct then generate accessToken and refreshToken
  // Save refreshToken in DB
  // Return response (accessToken and user details except user password and refreshToken details)
  // console.log("Login API hit: ", req.body)

  // Get data from frontend or req.body
  const { username, password, email } = req.body

  // Validatiion of data | email or username and passowrd
  // Check username or email field is empty
  if(!username && !email) throw new ApiError(400, "Username or Email is required.")

  // Check user exist or not by email or username
  // Find user by email or username
  const user = await User.findOne({
    $or: [ {email}, {username}]
  })
  if(!user) throw new ApiError(404, "User does not exixt. Please register first.")

  // If user exist then compare password is correct or not | using bcryptjs
  const isMatch = await user.isPasswordCorrect(password);
  if(!isMatch) throw new ApiError(401, "Invalid credentials. Please try again.")

  // If password is correct then generate accessToken and refreshToken
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  // Save refreshToken in DB
  user.refreshToken = refreshToken;
  await user.save({validateBeforeSave: false});

  // Creating a new object to send in response After removing password and refreshToken from user details

  // // Method 1: Using db query.
  // const loggedInUser = User.findById(user._id).select("-password -refreshToken");

  // Method 2: By copying user object.
  const loggedInUser = user.toObject(); // Shallow Copy
  delete loggedInUser.password;
  delete loggedInUser.refreshToken; 

  const options = {
    httpOnly: true,
    secure: true
  }


  // Return response (accessToken and user details except user password and refreshToken details)
  return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
              new ApiResponse(
                200,
                {
                  user:{
                    loggedInUser, 
                    accessToken,
                    refreshToken
                  }
                },
                "User logged in successfully."
              )
            )
})


// Logout User
const logoutUser = asyncHandler( async (req, res)=>{
  // To logout a user we need reference of the user and that's why we create a custom middleware name: auth.middleert.Js
  
  // Find user and remove refreshToken field from model. So that user have no longer access of login.
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: null
      }
    }
  );

  // Secure Options
  const options = {
    httpOnly: true,
    secure: true
  }

  // Remove cookies and rend response.
  res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Logged Out."))

})
export { registerUser, loginUser, logoutUser };