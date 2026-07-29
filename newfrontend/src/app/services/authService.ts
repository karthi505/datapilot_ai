import { User } from '../types';

export const authService = {
  // Get all users from localStorage
  getUsers: (): User[] => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  },

  // Save users to localStorage
  saveUsers: (users: User[]): void => {
    localStorage.setItem('users', JSON.stringify(users));
  },

  // Get companies from localStorage
  getCompanies: (): string[] => {
    const savedCompanies = localStorage.getItem('companies');
    return savedCompanies ? JSON.parse(savedCompanies) : [];
  },

  // Save companies to localStorage
  saveCompanies: (companies: string[]): void => {
    localStorage.setItem('companies', JSON.stringify(companies));
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const savedCurrentUser = localStorage.getItem('currentUser');
    return savedCurrentUser ? JSON.parse(savedCurrentUser) : null;
  },

  // Save current user to localStorage
  saveCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },

  // Authenticate user
  login: (email: string, password: string, users: User[]): User | null => {
    const user = users.find(u => u.email === email && u.password === password && u.verified);
    return user || null;
  },

  // Check if email exists
  emailExists: (email: string, users: User[]): boolean => {
    return users.some(u => u.email === email);
  },

  // Check if company exists
  companyExists: (companyName: string, companies: string[]): boolean => {
    return companies.includes(companyName);
  },

  // Generate OTP
  generateOTP: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
};
