import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Link,
  Grid,
} from "@mui/material";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.REACT_APP_FIREBASE_API_KEY}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );

      const idToken = response.data.idToken;

      // Fetch user data from Firestore
      const userResponse = await axios.get(
        `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`, // Include the token for authorization
          },
        }
      );

      // Filter the user data based on the email
      const userDataArray = userResponse.data.documents.filter(
        (doc) => doc.fields.email.stringValue === email
      );


      if (userDataArray.length === 0) {
        alert("User data not found!");
        return;
      }

      const userData = userDataArray[0].fields; // Get the first matched user data
      // Store the userId in localStorage for use in other pages
      const userId = userData.userId.integerValue; // Assuming 'userId' is a string field in your Firestore
      localStorage.setItem("userId", userId); // Save userId to localStorage

      const accno = userData.accno.integerValue; // Assuming 'userId' is a string field in your Firestore
      localStorage.setItem("accno", accno); 

      if (email === "guganshanmuganathan@gmail.com") {
        // Redirect to admin page
        window.location.href = "/admin";
      } else if (userData.isApproved.booleanValue === true) {
        // Redirect to user page
        window.location.href = "/customer";
      } else if (userData.isDenied && userData.isDenied.booleanValue === true) {
        // Handle denied accounts
        alert("Sorry!! Your account request is denied.");
      } else {
        alert("Your account has not been approved yet!");
      }
    } catch (error) {
      console.error("Error logging in", error);
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.error.message;
        alert(`Login failed: ${errorMessage}`);
      } else {
        alert("Login failed due to an unknown error.");
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Typography component="h1" variant="h5">
        Login
      </Typography>
      <form onSubmit={handleLogin}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" fullWidth variant="contained" color="primary">
              Login
            </Button>
          </Grid>
        </Grid>
      </form>
      <Grid container justifyContent="flex-end">
        <Grid item>
          <Link href="/register" variant="body2">
            Register your account
          </Link>
        </Grid>
        <Grid item>
          <Link href="/forgot-password" variant="body2">
            Forgot Password?
          </Link>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Login;
