import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CategoriesList from './CategoriesList';
import BranchesList from './BranchesList';
import ProductsList from './ProductsList';

export default function ProductsView() {
  return (
    <div className="h-full animate-in fade-in duration-300">
      <Routes>
        <Route path="/" element={<CategoriesList />} />
        <Route path="/categories/:categoryId" element={<BranchesList />} />
        <Route path="/branches/:branchId" element={<ProductsList />} />
      </Routes>
    </div>
  );
}
