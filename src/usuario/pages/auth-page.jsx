import React from "react";
import { AuthScreen } from "../components/auth-screen.jsx"; 

// 🔹 Página limpa que serve como ponto de entrada para a autenticação
// Recebe a propriedade 'onLoginSuccess' do App.jsx e repassa para a AuthScreen
export default function AuthPage({ onLoginSuccess }) {
  return <AuthScreen onLoginSuccess={onLoginSuccess} />;
}