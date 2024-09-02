import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import KintoConnect from './KintoConnect';
import { PrimaryButton } from 'components/shared';
import authService, { User, AuthResponse } from './authService';
import { ethers } from 'ethers';


declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    checkMetaMaskConnection();
  }, []);

  const checkMetaMaskConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsMetaMaskConnected(accounts.length > 0);
        if (accounts.length > 0) {
          setPublicKey(accounts[0]);
        }
      } catch (error) {
        console.error("Failed to check MetaMask connection:", error);
      }
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Connected to MetaMask, public key:", accounts[0]);
        setIsMetaMaskConnected(true);
        setPublicKey(accounts[0]);
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
        setError("Failed to connect to MetaMask. Please try again.");
      }
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const result: AuthResponse = await authService.login(email, password);
      setIsLoading(false);
      setIsLoggedIn(true);
      localStorage.setItem('token', result.token);
      setSuccess('Login successful!');
    } catch (err) {
      setIsLoading(false);
      setError('Invalid email or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    if (!isMetaMaskConnected) {
      setError("Please connect to MetaMask first.");
      setIsLoading(false);
      return;
    }
    try {
      console.log("Sending registration request:", { firstName, lastName, email, password, publicKey });
      const result: AuthResponse = await authService.register(firstName, lastName, email, password, publicKey);
      setIsLoading(false);
      setIsLoggedIn(true);
      localStorage.setItem('token', result.token);
      setSuccess('Registration successful!');
    } catch (err) {
      setIsLoading(false);
      setError('Registration failed. Email might already be in use.');
    }
  };

  const validateForm = () => {
    return firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== '' && password.trim() !== '' && isMetaMaskConnected;
  };

  
    return <KintoConnect />;
  

  // return (
  //   <AuthPage>
  //     <AuthCard>
  //       <h1>Welcome to Anzen</h1>
  //       <p>{isRegistering ? 'Create an account' : 'Please log in to continue'}</p>
  //       <form onSubmit={isRegistering ? handleRegister : handleLogin}>
  //         {isRegistering && (
  //           <>
  //             <Input
  //               type="text"
  //               placeholder="First Name"
  //               value={firstName}
  //               onChange={(e) => setFirstName(e.target.value)}
  //               required
  //             />
  //             <Input
  //               type="text"
  //               placeholder="Last Name"
  //               value={lastName}
  //               onChange={(e) => setLastName(e.target.value)}
  //               required
  //             />
  //           </>
  //         )}
  //         <Input
  //           type="email"
  //           placeholder="Email"
  //           value={email}
  //           onChange={(e) => setEmail(e.target.value)}
  //           required
  //         />
  //         <Input
  //           type="password"
  //           placeholder="Password"
  //           value={password}
  //           onChange={(e) => setPassword(e.target.value)}
  //           required
  //         />
  //         {isRegistering && (
  //           <PrimaryButton 
  //             onClick={connectMetaMask} 
  //             type="button"
  //             disabled={isMetaMaskConnected}
  //           >
  //             {isMetaMaskConnected ? 'MetaMask Connected' : 'Connect MetaMask'}
  //           </PrimaryButton>
  //         )}
  //         {error && <ErrorMessage>{error}</ErrorMessage>}
  //         {success && <SuccessMessage>{success}</SuccessMessage>}
  //         <PrimaryButton 
  //           onClick={(e) => e.currentTarget.form?.requestSubmit()} 
  //           disabled={isLoading || (isRegistering && !validateForm())}
  //         >
  //           {isLoading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
  //         </PrimaryButton>
  //       </form>
  //       <ToggleAuth onClick={() => {
  //         setIsRegistering(!isRegistering);
  //         setError('');
  //         setSuccess('');
  //       }}>
  //         {isRegistering ? 'Already have an account? Log in' : 'Need an account? Register'}
  //       </ToggleAuth>
  //     </AuthCard>
  //   </AuthPage>
  // );
};

const AuthPage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const AuthCard = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 300px;

  h1 {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 2rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  color: green;
  margin-bottom: 1rem;
`;

const ToggleAuth = styled.button`
  background: none;
  border: none;
  color: blue;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 1rem;
`;

export default App;