import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import { ListItemSecondaryAction } from '@material-ui/core';

function Admin() {
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [heldAccounts, setHeldAccounts] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);

  // Fetch unapproved accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(
          `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users`
        );

        // Filter unapproved accounts
        const unapprovedAccounts = response.data.documents.filter(
          (account) => !account.fields.isApproved.booleanValue && !account.fields.isDenied.booleanValue
        );
        setPendingAccounts(unapprovedAccounts);
      } catch (error) {
        console.error("Error fetching pending accounts:", error);
      }
    };

    

    fetchAccounts();
    fetchHeldAccounts(); // Fetch held accounts on mount
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await axios.get(
        `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/loans`
      );

      // Filter loans with isApproved false
      const pendingLoans = response.data.documents.filter(
        (loan) => !loan.fields.isApproved.booleanValue
      );
      setLoanRequests(pendingLoans);
    } catch (error) {
      console.error("Error fetching loan requests:", error);
    }
  };

  // Fetch held accounts
  const fetchHeldAccounts = async () => {
    try {
      const response = await axios.get(
        `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/accHold`
      );

      setHeldAccounts(response.data.documents);
    } catch (error) {
      console.error("Error fetching held accounts:", error);
    }
  };

  // Approve account and send approval email
  const approveAccount = async (accountId, accountEmail) => {
    const accountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}?updateMask.fieldPaths=isApproved`;

    try {
      await axios.patch(
        accountRef,
        {
          fields: {
            isApproved: { booleanValue: true },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Send approval email via Express backend
      await axios.post("http://localhost:3001/send-email", {
        to: accountEmail,
        subject: "Account Approved",
        body: "Your account has been approved. You can now log in.",
      });

      alert("Account approved and email sent!");
      // Refresh pending accounts after approval
      setPendingAccounts(pendingAccounts.filter((acc) => acc.fields.accno.integerValue !== accountId));
    } catch (error) {
      console.error("Error approving account or sending email:", error);
    }
  };

  // Deny account and send denial email
  const denyAccount = async (accountId, accountEmail) => {
    const accountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}?updateMask.fieldPaths=isApproved&updateMask.fieldPaths=isDenied`;

    try {
      await axios.patch(
        accountRef,
        {
          fields: {
            isApproved: { booleanValue: false },
            isDenied: { booleanValue: true },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Send denial email via Express backend
      await axios.post("http://localhost:3001/send-email", {
        to: accountEmail,
        subject: "Account Denied",
        body: "Sorry, your account request has been denied.",
      });

      await axios.delete(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}`);
      alert("Account denied and email sent!");
      // Refresh pending accounts after denial
      setPendingAccounts(pendingAccounts.filter((acc) => acc.fields.accno.integerValue !== accountId));
    } catch (error) {
      console.error("Error denying account or sending email:", error);
    }
  };

  // Hold account and send hold email
  const holdAccount = async (account) => {
    const accountId = account.fields.accno.integerValue;
    const accountEmail = account.fields.email.stringValue;
    const accountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}`;
    const holdAccountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/accHold/${accountId}`;

    try {
      // First, send a hold email
      await axios.post("http://localhost:3001/send-email", {
        to: accountEmail,
        subject: "Account Held",
        body: "Your account request is currently on hold. Please contact support.",
      });

      // Move account to accHold collection
      await axios.patch(holdAccountRef, {
        fields: {
          ...account.fields,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Delete account from users collection
      await axios.delete(accountRef);

      alert("Account held and email sent!");

      // Refresh both lists
      setPendingAccounts(pendingAccounts.filter((acc) => acc.fields.accno.integerValue !== accountId));
      fetchHeldAccounts();
    } catch (error) {
      console.error("Error holding account or sending email:", error);
    }
  };

  // Approve a held account and move it to the users collection
  const approveHeldAccount = async (account) => {
    const accountId = account.fields.accno.integerValue;
    const accountEmail = account.fields.email.stringValue;
    const accountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}`;
    const holdAccountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/accHold/${accountId}`;

    try {
      // Move the account to the users collection with isApproved = true
      await axios.patch(
        accountRef,
        {
          fields: {
            ...account.fields,
            isApproved: { booleanValue: true },
            isDenied: { booleanValue: false },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Send approval email
      await axios.post("http://localhost:3001/send-email", {
        to: accountEmail,
        subject: "Account Approved",
        body: "Your account has been approved. You can now log in.",
      });

      // Then delete the account from accHold collection
      await axios.delete(holdAccountRef);

      alert("Account approved, moved to users, and email sent!");

      // Refresh held accounts list
      fetchHeldAccounts();
    } catch (error) {
      console.error("Error approving held account:", error);
    }
  };

  // Deny a held account and delete it from accHold collection
  const denyHeldAccount = async (account) => {
    const accountId = account.fields.accno.integerValue;
    const holdAccountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/accHold/${accountId}`;

    try {
      // Simply delete the account from accHold collection
      await axios.delete(holdAccountRef);

      // Send denial email
      await axios.post("http://localhost:3001/send-email", {
        to: account.fields.email.stringValue,
        subject: "Account Denied",
        body: "Your account request has been denied. Please contact support for more information.",
      });

      alert("Account denied and removed from held accounts.");

      // Refresh held accounts list
      fetchHeldAccounts();
    } catch (error) {
      console.error("Error denying held account:", error);
    }
  };

  // Approve a loan and credit to the account balance
  const approveLoan = async (loan) => {
    const accountId = loan.fields.accno.integerValue;
    console.log(accountId);
    const loanAmount = loan.fields.amount.doubleValue;
    console.log(loanAmount);
    if (!accountId || !loanAmount) {
      throw new Error('Invalid account ID or loan amount');
    }
    const accountRef = `https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/users/${accountId}`;

    try {
      // Credit the loan amount to the account's balance
      const accountResponse = await axios.get(accountRef);
      const currentBalance = accountResponse.data.fields.balance.integerValue;
       // Ensure the current balance is valid
    if (typeof currentBalance === 'undefined') {
      throw new Error('Current balance is undefined');
    }

    // Calculate the new balance after loan approval
    const newBalance = parseInt(currentBalance) + parseInt(loanAmount); 

      await axios.patch(`${accountRef}?updateMask.fieldPaths=balance`, {
        fields: {
          balance: { integerValue: newBalance },
        },
      });

      const response = await fetch(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/loans`);
      const data = await response.json();

      const loanDocument = data.documents.find(doc => doc.fields.accno.integerValue === accountId);  
      const documentId = loanDocument.name.split('/').pop();

      // Mark loan as approved
      await axios.patch(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/loans/${documentId}?updateMask.fieldPaths=isApproved`, {
        fields: {
          isApproved: { booleanValue: true },
        },
      });

      alert("Loan approved and credited to the account!");

      // Refresh loan requests list
      fetchLoans();
    } catch (error) {
      console.error("Error approving loan:", error);
    }
  };

  const denyLoan = async (loanId) => {
    try {
      // Step 1: Fetch all loans
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/loans`);
      const data = await response.json();
  
      // Step 2: Find the document with the matching loanId
      const loanDocument = data.documents.find(doc => doc.fields.accno.integerValue === loanId);
  
      if (loanDocument) {
        const documentId = loanDocument.name.split('/').pop(); // Extract the document ID from the path
  
        // Step 3: Delete the document
        await fetch(`https://firestore.googleapis.com/v1/projects/bank-management-system-d280f/databases/(default)/documents/loans/${documentId}`, {
          method: 'DELETE',
        });
  
        console.log(`Loan with ID ${loanId} has been denied and deleted.`);
      } else {
        console.log(`No loan found with ID ${loanId}`);
      }
    } catch (error) {
      console.error('Error denying loan:', error);
    }
  };
  
  const renderDocuments = (documents) => {
    return documents?.arrayValue?.values?.map((doc, idx) => (
      <a key={idx} href={doc?.stringValue} target="_blank" rel="noopener noreferrer">
        Document {idx + 1}
      </a>
    )) || 'No documents available';
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" gutterBottom>
        Admin Panel
      </Typography>
      <Paper style={{ padding: '16px' }}>
        
        {/* Pending Accounts Section */}
        <Typography variant="h5" gutterBottom>
          Pending Accounts
        </Typography>
        <List>
          {pendingAccounts.length === 0 ? (
            <Typography>No pending accounts.</Typography>
          ) : (
            pendingAccounts.map((account) => (
              <ListItem key={account.fields.accno.integerValue}>
                <ListItemText
                  primary={`${account?.fields?.firstName?.stringValue || 'N/A'} ${account?.fields?.lastName?.stringValue || 'N/A'}`}
                  secondary={
                    <Typography>
                      Email: {account?.fields?.email?.stringValue || 'N/A'}
                      <br />
                      Mobile: {account?.fields?.mobile?.integerValue || 'N/A'}
                      <br />
                      DOB: {account?.fields?.dob?.stringValue || 'N/A'}
                      <br />
                      Account No: {account?.fields?.accno?.integerValue || 'N/A'}
                      <br />
                      Balance: {account?.fields?.balance?.integerValue || 'N/A'}
                      <br />
                      IFSC: {account?.fields?.IFSC?.stringValue || 'N/A'}
                      <br />
                      Credit Amount: {account?.fields?.creditAmount?.integerValue || 'N/A'}
                      <br />
                      Transfer Limit: {account?.fields?.transferLimit?.integerValue || 'N/A'}
                      <br />
                      Documents: {renderDocuments(account?.fields?.documents)}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => approveAccount(account.fields.accno.integerValue, account.fields.email.stringValue)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => denyAccount(account.fields.accno.integerValue, account.fields.email.stringValue)}
                  >
                    Deny
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => holdAccount(account)}
                  >
                    Hold
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>

        {/* Held Accounts Section */}
        <Typography variant="h5" gutterBottom>
          Held Accounts
        </Typography>
        <List>
          {heldAccounts.length === 0 ? (
            <Typography>No held accounts.</Typography>
          ) : (
            heldAccounts.map((account) => (
              <ListItem key={account.fields.accno.integerValue}>
                <ListItemText
                  primary={`${account?.fields?.firstName?.stringValue || 'N/A'} ${account?.fields?.lastName?.stringValue || 'N/A'}`}
                  secondary={
                    <Typography>
                      Email: {account?.fields?.email?.stringValue || 'N/A'}
                      <br />
                      Mobile: {account?.fields?.mobile?.integerValue || 'N/A'}
                      <br />
                      DOB: {account?.fields?.dob?.stringValue || 'N/A'}
                      <br />
                      Account No: {account?.fields?.accno?.integerValue || 'N/A'}
                      <br />
                      Balance: {account?.fields?.balance?.integerValue || 'N/A'}
                      <br />
                      IFSC: {account?.fields?.IFSC?.stringValue || 'N/A'}
                      <br />
                      Credit Amount: {account?.fields?.creditAmount?.integerValue || 'N/A'}
                      <br />
                      Transfer Limit: {account?.fields?.transferLimit?.integerValue || 'N/A'}
                      <br />
                      Documents: {renderDocuments(account?.fields?.documents)}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => approveHeldAccount(account)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => denyHeldAccount(account)}
                  >
                    Deny
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>

        {/* Loan Requests Section */}
        <Typography variant="h5" gutterBottom>
          Loan Requests
        </Typography>
        <List>
          {loanRequests.length === 0 ? (
            <Typography>No loan requests.</Typography>
          ) : (
            loanRequests.map((loan) => (
              <ListItem key={loan.fields.accno.integerValue}>
                <ListItemText
                  primary={`Loan Request by Account: ${loan?.fields?.accno?.integerValue || "N/A"}`}
                  secondary={
                    <Typography>
                      Loan Type: {loan?.fields?.loanType?.stringValue || "N/A"}
                      <br />
                      Loan Amount: {loan?.fields?.amount?.doubleValue || "N/A"}
                      <br />
                      Reason: {loan?.fields?.reason?.stringValue || "N/A"}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Button variant="contained" color="primary" onClick={() => approveLoan(loan)}>
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => denyLoan(loan.fields.accno.integerValue)}
                  >
                    Deny
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Container>
  );
}

export default Admin;
