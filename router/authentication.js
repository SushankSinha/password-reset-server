import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/userForPasswordResetSchema.js";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const router = express.Router();

const OAuth2 = google.auth.OAuth2;

const sendMailVerification = async (name, email, randomString) => {
  try {
    let mailTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: process.env.ACCESS_TOKEN,
        expires: 3599,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset",
      html: `<p>Greetings ${name}! Your OTP to reset Password is ${randomString}</p>`,
    };

    mailTransporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password ) {
    res.status(422).json({ error: "Fill the required fields" });
  }

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      res.status(422).json({ error: "Email already exists" });
    } else if (!userExist){
      const userDetails = new User({
        name,
        email,
        password
      });

      await userDetails.save();

      res.status(201).json({ message: "Registration Successful!" });
    }
  } catch (err) {
    console.log(err);
  }
});


// login route

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({ message: "User does not exists" });
    } else {
      const auth = await bcrypt.compare(password, user.password);
      if (!auth) {
        return res.json({ message: "Incorrect credentials" });
      } else if (auth) {
        res
          .status(200)
          .json({ message: "User logged in successfully", success: true });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

router.post("/user_verification", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({email : email });
    
    if (!user) {
      res.status(404).json({ message: "User does not exists" });
    } else {
      res.status(200).json({ message: "User Exists" });

      function generateOTP(length) {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";
        let result = "";

        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          result += characters.charAt(randomIndex);
        }

        return result;
      }

      const randomString = generateOTP(8);

      const auth = await User.updateOne({ $set: { currentOtp: randomString } }
      );

      sendMailVerification(user.name, user.email, randomString);
    
    } 
  }catch (error) {
      console.error(error);
    }
  });

  router.post("/otp_verification", async (req, res) => {
    try {

      const {email, otp } = req.body;

      const user = await User.findOne({email : email });
     
      if (!user) {
        res.json({ message: "User does not exists" });
      } else {

      const otpVerification = await User.findOne({ currentOtp: otp });

      if (!otpVerification) {
        res.status(401).json({ message: "Invalid OTP" });
      } else if (otpVerification) {

        res.status(200).json({ message: "OTP Verified" });

       }
       }
       } catch (error) {
          console.error(error);
        }
      });

router.post("/reset_password", async (req, res) => {
          try { 
        const { email, password } = req.body;

        const user = await User.findOne({email : email });
     
        if (!user) {
          res.status(404).json({ message: "User does not exists" });
        } else {

        const auth = await User.updateOne(
          { password: password },
          { $set: { currentOtp: "" } }
        );
        if (auth) {
          res
            .status(201)
            .json({ message: "Password updated successfully", success: true });
        }
      }
     } catch (error) {
    console.error(error);
  }
});

export default router;
