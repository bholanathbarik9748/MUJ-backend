import "dotenv/config";
import express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import User from "../model/userSchema.js";
import Ride from "../model/rideSchema.js";
import RideRequest from "../model/rideRequestSchema.js";
import authenticate from "../middleware/Authenticate.js";

router.get("/", (req, res) => {
  res.send("Welcome to MANIPAL UNIVERSITY JAIPUR's CAR POOL SYSTEM");
});

router.post("/user/register", async (req, res) => {
  const { UID, user_type, fname, lname, email, designation, phone, password } =
    req.body;

  try {
    if (
      !UID ||
      !user_type ||
      !fname ||
      !lname ||
      !email ||
      !designation ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: All fields are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Conflict: User already exists with this email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({
      UID,
      user_type,
      fname,
      lname,
      email,
      designation,
      phone,
      password: hashedPassword, // Store hashed password
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Unable to register user.",
    });
  }
});

router.post("/user/login", async (req, res) => {
  const { UID, password } = req.body;

  if (!UID || !password) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: All fields are required.",
    });
  }

  try {
    const user = await User.findOne({ UID });
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const token = await user.generateAuthToken();
        res.status(200).json({ user, token });
      } else {
        res.status(401).json({ error: "Invalid Password" });
      }
    } else {
      res.status(401).json({ error: "Invalid UID" });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/add/ride", async (req, res) => {
  const { PublisherID, from, to, no_of_pass, doj, price } = req.body;

  try {
    // Check if all required fields are provided
    if (!PublisherID || !from || !to || !no_of_pass || !doj || !price) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: All fields are required.",
      });
    }

    // Perform additional validation if necessary
    // For example, you can check if no_of_pass is a valid number, doj is a valid date, etc.

    // Create a new ride object
    const ride = new Ride({
      PublisherID,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      no_of_pass,
      doj,
      price,
    });

    // Save the ride to the database
    await ride.save();

    // Respond with success message
    res.status(201).json({
      success: true,
      message: "Ride published successfully",
      ride: ride, // Optionally, you can send the saved ride object back in the response
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error publishing ride:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/rides/all", async (req, res) => {
  try {
    // Query the database for all rides
    const allRides = await Ride.find();

    // If there are no rides found
    if (allRides.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No rides found",
      });
    }

    // Respond with the rides found
    res.status(200).json({
      success: true,
      rides: allRides,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching rides:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/ridesto/:TO", async (req, res) => {
  try {
    // Extract the destination from the request parameters and convert it to uppercase
    const to = req.params.TO.toUpperCase();

    // Query the database for rides with the specified destination
    const availableRides = await Ride.find({ to });

    // If no rides are found for the destination
    if (availableRides.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No rides found to ${to}`,
      });
    }

    // Respond with the rides found
    res.status(200).json({
      success: true,
      rides: availableRides,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching rides to destination:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

//fix this ->
router.get("/rides/:FROM/:TO", async (req, res) => {
  try {
    // Extract the origin and destination from the request parameters and convert them to uppercase
    const from = req.params.FROM.toUpperCase();
    const to = req.params.TO.toUpperCase();

    // Query the database for rides with the specified origin and destination
    const availableRides = await Ride.find({
      $and: [
        { from: { $regex: new RegExp(from, "i") } }, // Case-insensitive search for origin
        { to: { $regex: new RegExp(to, "i") } }      // Case-insensitive search for destination
      ],
    });

    // If no rides are found for the specified origin and destination
    if (availableRides.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No rides found from ${from} to ${to}`,
      });
    }

    // Respond with the rides found
    res.status(200).json({
      success: true,
      rides: availableRides,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching rides:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


router.get("/rides/:FROM/:TO/:MAXP", async (req, res) => {
  try {
    // Extract the origin, destination, and maximum payable price from the request parameters
    const from = req.params.FROM.toUpperCase();
    const to = req.params.TO.toUpperCase();
    const maxp = parseFloat(req.params.MAXP); // Convert maxp to a number

    // Validate maxp to ensure it's a valid number
    if (isNaN(maxp) || maxp < 0) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: Maximum payable price should be a positive number.",
      });
    }

    // Query the database for rides with the specified origin, destination, and maximum payable price
    const availableRides = await Ride.find({
      $and: [
        { from: from },
        { to: to },
        { price: { $gte: 0, $lte: maxp } }, // Ensure price is between 0 and maxp
      ],
    });

    // If no rides are found for the specified origin, destination, and maximum payable price
    if (availableRides.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No rides found from ${from} to ${to} within the specified price range.`,
      });
    }

    // Respond with the rides found
    res.status(200).json({
      success: true,
      rides: availableRides,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching rides:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


router.get("/user/show/:UID", async (req, res) => {
  try {
    // Extract the user ID from the request parameters
    const UID = req.params.UID;

    // Validate UID to ensure it's a non-empty string
    if (!UID || typeof UID !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Bad Request: User ID is invalid.",
      });
    }

    // Query the database for rides published by the user
    const my_rides = await Ride.find({ PublisherID: UID });

    // If no rides are found for the user
    if (my_rides.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No rides found for user with ID: ${UID}`,
      });
    }

    // Respond with the rides found
    res.status(200).json({
      success: true,
      rides: my_rides,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching user rides:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


router.get("/user/dashboard", authenticate, function (req, res) {
  try {
    // Log access to the dashboard
    console.log("Hello from GET /user/dashboard");

    // Send only necessary user information to the client
    const { _id, username, email } = req.rootUser;
    const userData = { _id, username, email };

    // Respond with the user information
    res.status(200).json(userData);
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching user data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/user/data/:UID", async (req, res) => {
  try {
    // Extract the user ID from the request parameters
    const UID = req.params.UID;

    // Validate UID to ensure it's a non-empty string
    if (!UID || typeof UID !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Bad Request: User ID is invalid.",
      });
    }

    // Query the database for user data using the UID
    const userData = await User.findOne({ UID });

    // If no user data is found for the provided UID
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: `No user found with ID: ${UID}`,
      });
    }

    // Respond with the user data
    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error fetching user data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


router.delete("/ride/request/remove/:RideID/:RequestID", async (req, res) => {
  try {
    // Extract the RideID and RequestID from the request parameters
    const RideID = req.params.RideID;
    const RequestID = req.params.RequestID;

    // Validate RideID and RequestID to ensure they are non-empty strings
    if (!RideID || !RequestID || typeof RideID !== 'string' || typeof RequestID !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Bad Request: RideID or RequestID is invalid.",
      });
    }

    // Find the ride request document using RideID and RequestID
    const rideRequest = await RideRequest.findOne({ RideID, RequestID });

    // If no ride request document is found
    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: "Ride request not found",
      });
    }

    // Delete the ride request document
    await rideRequest.delete();

    console.log("Document Deleted");
    res.status(200).json({ success: true, message: "Ride request deleted successfully" });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error deleting ride request:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/ride/request/show/:rideID", async (req, res) => {
  try {
    const rideID = req.params.rideID;
    const rideRequests = await RideRequest.find({ RideID: rideID });

    if (!rideRequests) {
      return res.status(404).json({ message: "No ride requests found for the given RideID" });
    }

    res.status(200).json({ rideRequests });
  } catch (err) {
    console.error("Error retrieving ride requests:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ride/request/add/:rideID/:requestID/:requestName", async (req, res) => {
  try {
    const rideID = req.params.rideID;
    const requestID = req.params.requestID;
    const requestName = req.params.requestName;

    // Validate input parameters if necessary

    console.log(rideID);
    console.log(requestID);
    console.log(requestName);

    // Check for duplicate ride request
    const existingRequest = await RideRequest.findOne({ RideID: rideID, RequestID: requestID });
    if (existingRequest) {
      console.log("_____________________________________");
      console.log(existingRequest);
      console.log("_____________________________________");
      return res.status(400).json({ message: "ALREADY REQUESTED" });
    }

    // Create new ride request
    const newRequest = new RideRequest({
      RideID: rideID,
      RequestID: requestID,
      RequestName: requestName,
    });
    await newRequest.save();

    res.status(200).json({ message: "RIDE REQUESTED" });
  } catch (err) {
    console.error("Error adding ride request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
