import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid,
  InputLabel,
  FormControl,
} from "@mui/material";

function Register() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    mobile: "",
    dob: "",
    aadharFile: null,
    panFile: null,
    creditAmount: 0,
  });

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.files[0] });
  };

  // Upload file to Firebase Storage using REST API
  const uploadFileToFirebaseStorage = async (file, folder) => {
    const fileName = `${folder}/${file.name}`;
    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/bank-management-system-d280f.appspot.com/o/${encodeURIComponent(fileName)}?uploadType=media`;

    try {
      // Upload file to Firebase Storage
      const response = await axios.post(storageUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      // Return the file download URL
      return `https://firebasestorage.googleapis.com/v0/b/bank-management-system-d280f.appspot.com/o/${encodeURIComponent(fileName)}?alt=media`;
    } catch (error) {
      console.error("Error uploading file to Firebase Storage", error);
      throw error;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (userData.creditAmount < 100000) {
      alert("Credit amount must be greater than INR 100,000");
      return;
    }

    try {
      // Create user in Firebase Authentication
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.REACT_APP_FIREBASE_API_KEY}`,
        {
          email: userData.email,
          password: userData.password,
          returnSecureToken: true,
        }
      );

      // Check if the Firebase response contains a token
      if (!response.data || !response.data.idToken) {
        throw new Error("Invalid Firebase sign-up response");
      }

      const accountNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000); // Generate random 16 digit account number

      // Upload Aadhar and PAN files to Firebase Storage and get their URLs
      const aadharUrl = await uploadFileToFirebaseStorage(userData.aadharFile, `aadharFiles`);
      const panUrl = await uploadFileToFirebaseStorage(userData.panFile, `panFiles`);

      const newUser = {
        fields: {
          userId: { integerValue: Math.floor(Math.random() * 100000) },
          firstName: { stringValue: userData.firstName },
          lastName: { stringValue: userData.lastName },
          email: { stringValue: userData.email },
          dob: { stringValue: userData.dob },
          mobile: { integerValue: parseInt(userData.mobile) },
          accno: { integerValue: accountNumber },
          IFSC: { stringValue: "UTIB0000124" },
          role: { stringValue: "customer" },
          balance: { integerValue: userData.creditAmount },
          isApproved: { booleanValue: false },
          isDenied: { booleanValue: false },
          documents: {
            arrayValue: {
              values: [{ stringValue: aadharUrl }, { stringValue: panUrl }],
            },
          },
          createdAt: { timestampValue: new Date().toISOString() },
          transferLimit: { integerValue: 50000 },
        },
      };

      // Save the new user to Firestore using accountNumber as the document name
      await axios.patch(
        `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountNumber}`,
        newUser
      );

      // Send a confirmation email (implement this endpoint on your backend)
      await axios.post("http://localhost:3001/send-email", {
        to: userData.email,
        subject: "Registration Successful",
        body: "You have registered successfully! Please wait for bank approval. Thank you.",
      });

      alert("Registration successful! Please wait for admin approval.");
      window.location.href = "/";
    } catch (error) {
      console.error("Error registering", error.response || error);
    
      const firebaseError = error.response?.data?.error?.message || "An unknown error occurred.";
      alert(`Registration failed: ${firebaseError}`);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Typography component="h1" variant="h5">
        Register
      </Typography>
      <form onSubmit={handleRegister}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="First Name"
              name="firstName"
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Last Name"
              name="lastName"
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Email"
              name="email"
              type="email"
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Password"
              name="password"
              type="password"
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Mobile Number"
              name="mobile"
              type="number"
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Date of Birth"
              name="dob"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel htmlFor="aadharFile">Aadhar File</InputLabel>
              <input
                id="aadharFile"
                type="file"
                name="aadharFile"
                onChange={handleFileChange}
                required
              />
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel htmlFor="panFile">PAN File</InputLabel>
              <input
                id="panFile"
                type="file"
                name="panFile"
                onChange={handleFileChange}
                required
              />
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              label="Credit Amount"
              name="creditAmount"
              type="number"
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" fullWidth variant="contained" color="primary">
              Register
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}

export default Register;
