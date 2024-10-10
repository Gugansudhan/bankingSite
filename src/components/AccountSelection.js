import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, List, ListItem } from '@mui/material';
import axios from 'axios';

const AccountSelection = () => {
    const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const userId = localStorage.getItem('userId'); // Fetch userId from local storage

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/accounts?filter=userId=${userId}`);
        const accountsData = response.data.documents.map((doc) => ({
          id: doc.name.split('/').pop(), // Extract the document ID
          ...doc.fields,
        }));
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    fetchAccounts();
  }, [userId]);

  const handleAccountClick = (accountId) => {
    localStorage.setItem('accountId', accountId); // Store the selected accountId
    navigate(`/customer/${accountId}`);// Navigate to customer page
  };

  return (
    <div>
      <Typography variant="h4">Select an Account</Typography>
      <List>
        {accounts.map((account) => (
          <ListItem key={account.id}>
            <Button variant="contained" onClick={() => handleAccountClick(account.id)}>
              Account No: {account.accno.stringValue}
            </Button>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default AccountSelection;
