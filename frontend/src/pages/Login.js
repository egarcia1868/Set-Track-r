// const form = document.querySelector('form');
import { Link } from "react-router-dom";

import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
  
    console.log("taco: ", email, password);
  };
  

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Log in</h2>
      <label htmlFor="email">Email</label>
      <input
        type="email"
        name="email"
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        value={email}
        required
      />
      <div className="email auth-form-error"></div>
      <label htmlFor="password">Password</label>
      <input
        type="password"
        name="password"
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        value={password}
        required
      />
      <div className="password auth-form-error"></div>
      <button>Log in</button>
      <Link to="/signup">
          <button className="signup" onClick={() => {
          // handleConcertDetailsClick();
        }
          } type="button">Create new account</button>
        </Link>
      
    </form>
  );
};

export default Login;
