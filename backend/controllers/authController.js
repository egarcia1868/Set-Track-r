import User from "../models/UserModel.js";
// import { getConcertFromAPI } from "../services/concertService.js";
import mongoose from "mongoose";

export const signupGet = async (req, res) => {
  res.render('signup');
}

export const loginGet = async (req, res) => {
  res.render('signup');
}

export const signupPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({email, password})
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    res.status(400).send('error, user not created');
  }
}

export const loginPost = async (req, res) => {
  const { email, password } = req.body;
  console.log('ACLP: ', email, password);
  res.send('user login');
}