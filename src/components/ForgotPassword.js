import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.REACT_APP_FIREBASE_API_KEY}`,
        {
          requestType: "PASSWORD_RESET",
          email,
        }
      );
      alert("Password reset email sent!");
    } catch (error) {
      console.error("Error sending reset email", error);
      alert("Failed to send reset email!");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper style={{ padding: '16px', marginTop: '16px' }}>
        <Typography variant="h4" gutterBottom>
          Forgot Password
        </Typography>
        <form onSubmit={handleForgotPassword}>
          <TextField
            label="Enter your email"
            variant="outlined"
            fullWidth
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
          >
            Send Reset Email
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default ForgotPassword;
