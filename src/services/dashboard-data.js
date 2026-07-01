/**
 * 💎 EMERALD - Utilitários Globais do Módulo Dashboard
 * Este arquivo centraliza funções que ajudam a tratar os dados reais vindo do Spring Boot.
 */

// 1. Formata um número bruto do Java (ex: 1500.5) para Moeda Real (R$ 1.500,50)
export const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

// 2. Formata uma data padrão do banco (ex: "2026-07-01") para o padrão brasileiro ("01/07/2026")
export const formatarData = (dataString) => {
  if (!dataString) return "";
  const [ano, mes, dia] = dataString.split("-");
  return `${dia}/${mes}/${ano}`;
};

// 3. Mapeador de categorias do Java para os tons visuais que configuramos no CSS
export const obterTomCategoria = (categoriaNome) => {
  if (!categoriaNome) return "bg-gray-50 text-gray-600";
  
  const nomeLimpo = categoriaNome.toLowerCase().trim();

  const tons = {
    receita: "bg-emerald-50 text-[#059669]",
    moradia: "bg-blue-50 text-blue-600",
    alimentacao: "bg-amber-50 text-amber-600",
    transporte: "bg-purple-50 text-purple-600",
    lazer: "bg-rose-50 text-rose-600",
  };

  return tons[nomeLimpo] || "bg-gray-50 text-gray-600";
};