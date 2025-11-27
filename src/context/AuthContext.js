import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

// Re-export the JSX-based AuthContext so imports that omit extension still work
import AuthContextModule from './AuthContext.jsx';
export const AuthProvider = AuthContextModule.AuthProvider;
export const useAuth = AuthContextModule.useAuth;