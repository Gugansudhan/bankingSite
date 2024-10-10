import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, TextField, Container, List, ListItem, Grid, ListItemText, Alert } from '@mui/material';

const ProfilePage = () => {
  const [userDetails, setUserDetails] = useState({});
  const [loanDetails, setLoanDetails] = useState([]);
  const userId = localStorage.getItem('userId');
  const accountId = localStorage.getItem('accno');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userResponse = await axios.get(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}`);
        setUserDetails(userResponse.data.fields);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleSave = async () => {
    try {
      await axios.patch(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}?updateMask.fieldPaths=mobile&updateMask.fieldPaths=address`, {
        fields: {
          mobile: { stringValue: userDetails.mobile.integerValue },
          address: { stringValue: userDetails.address.stringValue },
        },
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}`);
      alert('Account deleted!');
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const [transactions, setTransactions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch transactions where userId is either the sender or receiver
  const handleShowTransactions = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
        const response = await axios.get(
            'https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/transactions'
          );
      const allDocuments = response.data.documents; // Firestore returns transactions in the `documents` array
    if (!allDocuments) {
      setErrorMessage('No transactions found.');
      setLoading(false);
      return;
    }
    console.log(allDocuments);
    // Map through documents and extract fields
    const allTransactions = allDocuments.map(doc => {
      const transactionData = doc.fields;
      return {
        senderId: transactionData.senderId.integerValue,
        receiverId: transactionData.receiverId.integerValue,
        amount: transactionData.amount.doubleValue || transactionData.amount.integerValue,
        date: transactionData.timestamp.timestampValue, // Assuming it's a timestamp
      };
    });

    

    // Filter transactions where userId matches either senderId or receiverId
    const userTransactions = allTransactions.filter(
      (transaction) => transaction.senderId === accountId || transaction.receiverId === accountId
    );

    console.log(allTransactions);

    setTransactions(userTransactions); // Assuming the response data is an array of transactions
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setErrorMessage('Failed to fetch transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4">Profile</Typography>

      {/* Display User Details */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="body1">User ID: {userId}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">Account Number: {accountId}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">First Name: {userDetails.firstName?.stringValue || ''}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">Last Name: {userDetails.lastName?.stringValue || ''}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">Email: {userDetails.email?.stringValue || ''}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">DOB: {userDetails.dob?.stringValue || ''}</Typography>
        </Grid>

        {/* Editable Fields */}
        <Grid item xs={12}>
          <TextField
            label="Mobile"
            value={userDetails.mobile?.integerValue || ''}
            onChange={(e) => setUserDetails({ ...userDetails, mobile: { integerValue: e.target.value } })}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>x
          <TextField
            label="Address"
            value={userDetails.address?.stringValue || ''}
            onChange={(e) => setUserDetails({ ...userDetails, address: { stringValue: e.target.value } })}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Button onClick={handleSave} variant="contained" color="primary" style={{ marginTop: '10px' }}>Save</Button>
      <Button onClick={handleDelete} variant="contained" color="secondary" style={{ marginTop: '10px', marginLeft: '10px' }}>Delete Account</Button>


      {/* Transaction Details Button */}
      <Button onClick={handleShowTransactions} variant="contained" color="primary" style={{ marginTop: '10px' }}>Show Transactions</Button>
      {loading && <p>Loading...</p>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <List>
          {transactions.map((transaction, index) => (
            <ListItem key={index}>
            <ListItemText
              secondary={`Amount: ${transaction.amount}, Date: ${transaction.timestamp}, Sender: ${transaction.senderId}, Receiver: ${transaction.receiverId}`}
            />
          </ListItem>
          ))}
        </List>
      {/* Logout Button */}
      <Button onClick={() => { window.location.href = "/" }} variant="contained" style={{ marginTop: '20px' }}>Logout</Button>
    </Container>
  );
};

export default ProfilePage;
