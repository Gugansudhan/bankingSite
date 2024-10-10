import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {  
    AppBar,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    TextField,
    Card,
    CardContent,
    CardActions,
    Alert,
    Toolbar
   } from '@mui/material';
import { TransferWithinAStation, AccountBalance, MonetizationOn } from '@mui/icons-material'; // Importing the icons
import axios from 'axios';

const CustomerDashboard = () => {
  const userID = localStorage.getItem('userId');
  const accountId = localStorage.getItem('accno'); // Get account number from local storage

  const [openDialog, setOpenDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [accountType, setAccountType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const firestoreApiUrl = 'https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents';

  // Handle navigation to other pages
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch user details from Firestore by account number
  const fetchUserDetailsByAccountNumber = async () => {
    try {   
        const userResponse = await axios.get(`${firestoreApiUrl}/users/${accountId}`);
        return userResponse.data.fields; // Returning fields of the first document
    } catch (error) {
      console.error('Error fetching account or user details:', error);
      setErrorMessage('Failed to fetch user details. Please try again later.');
      return null;
    }
  };

  // Create another account with a different account number
  const createAnotherAccount = async () => {
    const balance = parseInt(initialBalance);
    if (isNaN(balance) || balance < 100000) {
      setErrorMessage("Initial balance must be at least 100,000.");
      return;
    }

    const accountNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000);

    const userDetails = await fetchUserDetailsByAccountNumber();
    if (userDetails) {
      const documentsArray = userDetails.documents?.arrayValue?.values || [];
      const aadharUrl = documentsArray[0]?.stringValue || ""; // Aadhar URL from documents array
      const panUrl = documentsArray[1]?.stringValue || ""; 

      const newAccount = {
        fields: {
        userId: { integerValue: userID },
        firstName: { stringValue: userDetails.firstName },
        lastName: { stringValue: userDetails.lastName },
        email: { stringValue: userDetails.email },
        dob: { stringValue: userDetails.dob || '' }, // Add dob if available in userDetails
        mobile: { integerValue: parseInt(userDetails.mobile) },
        accno: { integerValue: accountNumber }, // Account number as an integer
        IFSC: { stringValue: 'UTIB0000124' }, // Hardcoded IFSC
        role: { stringValue: 'customer' }, // Set role as 'customer'
        balance: { integerValue: balance }, // Balance provided by user
        isApproved: { booleanValue: false }, // Initially not approved
        isDenied: { booleanValue: false }, // Initially not denied
        documents: {
          arrayValue: {
            values: [{ stringValue: aadharUrl }, { stringValue: panUrl }] // Aadhar and PAN URLs
          }
        },
        address: { stringValue: userDetails.address },
        createdAt: { timestampValue: new Date().toISOString() }, // Current timestamp
        transferLimit: { integerValue: 50000 }, // Transfer limit
      }
      };

      console.log(newAccount);

      try {
        await axios.patch(
          `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountNumber}`,
          newAccount
        );
        
        alert("New account created successfully!");
        setOpenDialog(false);
        setAccountType(''); // Reset form fields
        setInitialBalance('');  
      } catch (error) {
        if (error.response) {
            // Server responded with a status code other than 2xx
            console.error("Error Response:", error.response.data);
            setErrorMessage('Failed to create new account. Please try again.');
          } else {
            // Something else caused an error
            console.error("Error Message:", error.message);
            setErrorMessage('Failed to create new account. Please try again.');
          }
      }
    }
  };

  // Function to handle money transfer
  const handleTransferMoney = async () => {
    try {
      // Fetch sender's details
      const senderResponse = await axios.get(`${firestoreApiUrl}/users/${accountId}`);
      const sender = senderResponse.data.fields;
  
      // Fetch receiver's details
      const receiverResponse = await axios.get(`${firestoreApiUrl}/users/${receiverAccountNumber}`);
      const receiver = receiverResponse.data.fields;
  
      if (!receiver) {
        setErrorMessage('Receiver account does not exist.');
        return;
      }
  
      const senderBalance = sender.balance.integerValue;
      const transferValue = parseInt(transferAmount);
  
      // Validate transfer amount
      if (isNaN(transferValue) || transferValue <= 0 || transferValue > senderBalance) {
        setErrorMessage('Invalid transfer amount.');
        return;
      }
  
      // Update sender's balance
      await axios.patch(`${firestoreApiUrl}/users/${accountId}?updateMask.fieldPaths=balance`, {
        fields: { balance: { integerValue: senderBalance - transferValue } },
      });
  
      // Update receiver's balance
      const receiverBalance = receiver.balance.integerValue;
  
      await axios.patch(`${firestoreApiUrl}/users/${receiverAccountNumber}?updateMask.fieldPaths=balance`, {
        fields: { balance: { integerValue: parseInt(receiverBalance) + transferValue } },
      });
  
      // Store transaction details
      const transaction = {
        fields: {
          senderId: { integerValue: accountId },
          receiverId: { integerValue: receiverAccountNumber },
          amount: { integerValue: transferValue },
          timestamp: { timestampValue: new Date().toISOString() },
        }
      };
  
      await axios.post(`${firestoreApiUrl}/transactions`, transaction, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      setSuccessMessage('Transfer successful!');
      setReceiverAccountNumber('');
      setTransferAmount('');
      setOpenTransferDialog(false);
    } catch (error) {
      console.error('Error transferring money:', error);
      setErrorMessage('Transfer failed. Please try again.');
    }  
  };

  // Transfer Money Function
// Dashboard for customer functionalities

    const [dialog, setOBOpenTransferDialog] = useState(false);
    const [OBreceiverAccountNumber, setOBReceiverAccountNumber] = useState('');
    const [receiverIFSC, setReceiverIFSC] = useState('');
    const [OBtransferAmount, setOBTransferAmount] = useState(0);
  
    // Function to handle money transfer
    const handleOBTransferMoney = () => {
        if (!OBreceiverAccountNumber || !receiverIFSC || OBtransferAmount <= 0) {
            alert("Please fill in all fields.");
          } else {
            // Call your transferMoney function here with the relevant arguments
            transferMoney(accountId, OBreceiverAccountNumber, receiverIFSC, OBtransferAmount)
              .then(() => {
                alert("Transfer successful");
                setOBOpenTransferDialog(false); // Close the dialog on success
              })
              .catch((error) => {
                console.error("Transfer failed", error);
                alert("Transfer failed, please try again.");
              });
          } 
    };
  
    // Function to transfer money
    async function transferMoney(senderAccountID, receiverIFSC, receiverAccountID, amount) {
      try {
        
        const senderResponse = await axios.get(`${firestoreApiUrl}/users/${accountId}`);
        const sender = senderResponse.data.fields;

        const senderBalance = sender.balance.integerValue;
        if (senderBalance >= amount) {
            await axios.patch(`${firestoreApiUrl}/users/${accountId}?updateMask.fieldPaths=balance`, {
                fields: { balance: { integerValue: senderBalance - parseInt(amount)} },
              });

  
          const receiverRef = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${receiverAccountID}`;
          const receiverResponse = await axios.get(receiverRef);
      const receiverData = receiverResponse.data.fields[receiverIFSC]?.arrayValue?.values || [];

      // Append the new transaction to the existing array
      const newTransaction = {
        mapValue: {
          fields: {
            senderAccountNumber: { integerValue: senderAccountID },
            creditAmount: { integerValue: amount },
          },
        },
      };
      await axios.patch(`${receiverRef}?updateMask.fieldPaths=\`${receiverIFSC}\``, {
        fields: {
          [`${receiverIFSC}`]: {
            arrayValue: {
              values: [...receiverData, newTransaction], // Append the new transaction to the existing array
            },
          },
        },
      });
  
          alert("Transfer successful");
        }
        // } else {
        //   alert("Insufficient balance");
        // }
      } catch (error) {
        console.error("Error during money transfer:", error);
        alert("Transfer failed, please try again later");
      }
    }
  
    // Function to check incoming transactions
    async function checkIncomingTransactions(receiverAccountID) {
      try {
        // Reference to the common database
        const receiverRef = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/UTIB0000124`;
        const response = await fetch(receiverRef);
    
        if (response.ok) {
          const data = await response.json();
          const transactions = data.fields[receiverAccountID]?.arrayValue?.values || [];
    
          if (transactions.length > 0) {
            // Reference to the user's bank document
            const receiverBankRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${receiverAccountID}`;
            const receiverBankDoc = await fetch(receiverBankRef);
            const receiverBankData = await receiverBankDoc.json();
            let receiverBalance = parseFloat(receiverBankData.fields.balance.doubleValue || receiverBankData.fields.balance.integerValue);
    
            // Sum up the incoming transaction amounts
            transactions.forEach(transaction => {
              receiverBalance += parseFloat(transaction.mapValue.fields.creditAmount.doubleValue || transaction.mapValue.fields.creditAmount.integerValue);
            });
    
            // Update the balance with updateMask
            await fetch(receiverBankRef + `?updateMask.fieldPaths=balance`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fields: {
                  balance: { doubleValue: receiverBalance }, // Use doubleValue or integerValue based on your data type
                },
              }),
            });
    
            alert("Account updated with incoming transactions");
          } else {
            alert("No new transactions");
          }
        } else {
          alert("No transactions found or error accessing the common database");
        }
      } catch (error) {
        console.error("Error checking incoming transactions:", error);
        alert("Error checking transactions");
      }
    }
    

    const [loanType, setLoanType] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [openLoanDialog, setLoanOpenDialog] = useState(false); // Control for dialog
  

  const handleLoanClick = (type) => {
    setLoanType(type);
    setLoanOpenDialog(true); // Show the request form as a dialog
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    const reason = e.target.reason.value;

    const loanDetails = {
      fields: {
        userId: { stringValue: localStorage.getItem('userId') },
        loanType: { stringValue: loanType },
        amount: { doubleValue: parseFloat(amount) },
        reason: { stringValue: reason },
        isApproved: { booleanValue: false },
        accno : {integerValue: accountId},
        createdAt: { timestampValue: new Date().toISOString() },
      }
    };

    try {
      await axios.post(
        `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/loans`,
        loanDetails
      );
      setSuccessMessage('Loan request submitted! Wait for admin approval.');
      setErrorMessage('');
      setLoanOpenDialog(false); // Close the dialog on success
    } catch (error) {
      console.error("Error submitting loan request: ", error);
      setErrorMessage('Failed to submit loan request. Please try again.');
      setSuccessMessage('');
    }
    };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            MyBank
          </Typography>
          <Button color="inherit" onClick={() => handleNavigation('/')}>Home</Button>
          <Button color="inherit" onClick={() => handleNavigation('/offers')}>Offers</Button>
          <Button color="inherit" onClick={() => handleNavigation('/profile')}>Profile</Button>
        </Toolbar>
      </AppBar>

      <Container>
      <Typography variant="h4" align="center" gutterBottom>
  Welcome to MyBank
</Typography>
<Typography variant="body1" align="center" paragraph>
  Our bank offers personalized financial solutions with competitive interest rates, ensuring that your savings grow steadily while providing easy access to essential banking services. With a strong focus on customer satisfaction and innovative digital tools, we strive to make managing your finances simple, secure, and convenient.
</Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Grid container spacing={2}>
  {/* Left Section for Loan Cards */}
  <Grid item xs={12} sm={6} md={6}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Card>
          <CardContent>
            <TransferWithinAStation fontSize="large" />
            <Typography variant="h5">Educational loan</Typography>
            <Typography color="textSecondary">4% Interest Rate</Typography>
          </CardContent>
          <CardActions>
            <Button size="small" color="primary" onClick={() => handleLoanClick('Educational loan')}>Learn More</Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Card>
          <CardContent>
            <MonetizationOn fontSize="large" />
            <Typography variant="h5">Car Loan</Typography>
            <Typography color="textSecondary">6% Interest Rate</Typography>
          </CardContent>
          <CardActions>
            <Button size="small" color="primary" onClick={() => handleLoanClick('Car Loan')}>Learn More</Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Card>
          <CardContent>
            <AccountBalance fontSize="large" />
            <Typography variant="h5">Home Loan</Typography>
            <Typography color="textSecondary">5.5% Interest Rate</Typography>
          </CardContent>
          <CardActions>
            <Button size="small" color="primary" onClick={() => handleLoanClick('Home loan')}>Learn More</Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Card>
          <CardContent>
            <MonetizationOn fontSize="large" />
            <Typography variant="h5">Agri Loan</Typography>
            <Typography color="textSecondary">4.5% Interest Rate</Typography>
          </CardContent>
          <CardActions>
            <Button size="small" color="primary" onClick={() => handleLoanClick('Agri Loan')}>Learn More</Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
    {/* Dialog for Loan Request Form */}
    <Dialog open={openLoanDialog} onClose={() => setLoanOpenDialog(false)}>
        <DialogTitle>Request {loanType}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Amount"
                  name="amount"
                  type="number"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Reason"
                  name="reason"
                  fullWidth
                  required
                  multiline
                />
              </Grid>
            </Grid>
            <DialogActions>
              <Button onClick={() => setLoanOpenDialog(false)}>Cancel</Button>
              <Button type="submit" color="primary">
                Submit Request
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
  </Grid>
 

  {/* Right Section for Other Buttons */}
  <Grid item xs={12} sm={6} container spacing={2} direction="column" justifyContent="center" alignItems="center">
    <Grid item>
      <Button fullWidth variant="contained" color="primary" onClick={() => setOpenTransferDialog(true)}>
        Transfer Money (Within Bank)
      </Button>
    </Grid>
    <Grid item>
    <Button variant="contained" color="primary" onClick={() => setOBOpenTransferDialog(true)}>
    Transfer Money (Other Bank)
      </Button>
    </Grid>
    <Grid item>
      <Button fullWidth variant="contained" color="secondary" onClick={() => setOpenDialog(true)}>
        Create Another Account
      </Button>
    </Grid>
  </Grid>
</Grid>


        {/* Dialog for Creating Another Account */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Create Another Account</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Account Type"
              type="text"
              fullWidth
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Initial Balance"
              type="number"
              fullWidth
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={createAnotherAccount}>Create</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for Transferring Money */}
        <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)}>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Receiver Account Number"
              type="text"
              fullWidth
              value={receiverAccountNumber}
              onChange={(e) => setReceiverAccountNumber(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Transfer Amount"
              type="number"
              fullWidth
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
            <Button onClick={handleTransferMoney}>Transfer</Button>
          </DialogActions>
        </Dialog>

         {/* Dialog for Transferring Money */}
  <Dialog open={dialog} onClose={() => setOBOpenTransferDialog(false)}>
    <DialogTitle>Transfer Money</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Receiver Account Number"
        type="number"
        fullWidth
        value={OBreceiverAccountNumber}
        onChange={(e) => setOBReceiverAccountNumber(e.target.value)}
      />
      <TextField
        margin="dense"
        label="Receiver IFSC"
        type="text"
        fullWidth
        value={receiverIFSC}
        onChange={(e) => setReceiverIFSC(e.target.value)}
      />
      <TextField
        margin="dense"
        label="Amount"
        type="number"
        fullWidth
        value={OBtransferAmount}
        onChange={(e) => setOBTransferAmount(parseFloat(e.target.value))}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setOBOpenTransferDialog(false)}>Cancel</Button>
      <Button onClick={handleOBTransferMoney}>Transfer</Button>
    </DialogActions>
  </Dialog>

  {/* Button for Checking Incoming Transactions */}
  <Button onClick={() => checkIncomingTransactions(accountId, receiverIFSC)}>
    Check Incoming Transactions
  </Button>
      </Container>
    </div>
  );
};

export default CustomerDashboard;
