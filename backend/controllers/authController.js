import User from "../models/UserModel.js";
import mongoose from "mongoose";

const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // duplicate error code
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('User validation failed')) {
    Object.values(err.errors).forEach(({properties}) => {
      errors[properties.path] = properties.message;
    });
  };

  return errors;
}

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
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

export const loginPost = async (req, res) => {
  const { email, password } = req.body;
  console.log('ACLP: ', email, password);
  res.send('user login');
}